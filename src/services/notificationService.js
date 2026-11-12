import * as Notifications from 'expo-notifications';
import { getDatabase } from '../database/database';
import {
  getUploadRemindersEnabled as readUploadRemindersEnabled,
  getDefaultReminderTiming,
  getAppPreferences,
  saveAppPreferences,
  saveDefaultReminderTiming,
  saveUploadRemindersEnabled,
} from '../database/repositories/settingsRepository';

const CHANNEL_ID = 'upload-reminders';

function reminderDescription(minutes) {
  if (minutes === 15) return 'in 15 minutes';
  if (minutes === 1440) return 'in 24 hours';
  return 'in one hour';
}

export async function setDefaultReminderTiming(minutes) {
  const previousPreferences = await getAppPreferences();
  const remindersEnabled = await readUploadRemindersEnabled();
  await saveDefaultReminderTiming(minutes);
  if (!remindersEnabled) return { failed: 0, enabled: false };

  let videos;
  try {
    const db = await getDatabase();
    videos = await db.getAllAsync('SELECT * FROM videos');
  } catch (error) {
    await saveAppPreferences(previousPreferences);
    throw error;
  }
  let failed = 0;
  for (const video of videos) {
    try {
      await syncVideoReminder(video.id, video);
    } catch (error) {
      failed += 1;
      console.warn('Could not update an upload reminder:', error);
    }
  }
  return { failed, enabled: true };
}

export async function cancelVideoReminder(videoId) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const matching = scheduled.filter(
    (item) => String(item.content?.data?.videoId) === String(videoId)
  );

  for (const item of matching) {
    await Notifications.cancelScheduledNotificationAsync(item.identifier);
  }
}

export async function setUploadRemindersEnabled(enabled) {
  await saveUploadRemindersEnabled(enabled);

  if (!enabled) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const reminders = scheduled.filter(
      (item) => item.content?.data?.type === 'upload-reminder'
    );
    const results = await Promise.allSettled(
      reminders.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
    );
    return { enabled: false, failed: results.filter((result) => result.status === 'rejected').length };
  }

  const db = await getDatabase();
  const videos = await db.getAllAsync('SELECT * FROM videos');
  let failed = 0;
  for (const video of videos) {
    try {
      await syncVideoReminder(video.id, video);
    } catch (error) {
      failed += 1;
      console.warn('Could not reschedule an upload reminder:', error);
    }
  }
  return { enabled: true, failed };
}

async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted === true;
}

export async function syncVideoReminder(videoId, video) {
  await cancelVideoReminder(videoId);

  if (!(await readUploadRemindersEnabled())) {
    return { scheduled: false, reason: 'reminders-disabled' };
  }

  if (
    !video.upload_date ||
    !video.upload_time ||
    video.status === 'Published'
  ) {
    return { scheduled: false, reason: 'not-scheduled' };
  }

  const [year, month, day] = video.upload_date.split('-').map(Number);
  const [hour, minute] = video.upload_time.split(':').map(Number);

  const uploadDate = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    Number.isNaN(uploadDate.getTime()) ||
    uploadDate.getFullYear() !== year ||
    uploadDate.getMonth() !== month - 1 ||
    uploadDate.getDate() !== day
  ) {
    return { scheduled: false, reason: 'invalid-date' };
  }

  const leadMinutes = await getDefaultReminderTiming();
  const reminderDate = new Date(uploadDate.getTime() - leadMinutes * 60 * 1000);

  if (reminderDate.getTime() <= Date.now()) {
    return { scheduled: false, reason: 'too-soon-or-past' };
  }

  const permissionGranted = await requestNotificationPermission();

  if (!permissionGranted) {
    return { scheduled: false, reason: 'permission-denied' };
  }

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Upload Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Upcoming Video Upload',
      body: `"${video.title}" is scheduled to be uploaded ${reminderDescription(leadMinutes)}.`,
      sound: true,
      data: {
        videoId: String(videoId),
        type: 'upload-reminder',
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      channelId: CHANNEL_ID,
    },
  });

  return { scheduled: true, identifier };
}
