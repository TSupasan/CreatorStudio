import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'upload-reminders';

export async function cancelVideoReminder(videoId) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const matching = scheduled.filter(
    (item) => String(item.content?.data?.videoId) === String(videoId)
  );

  for (const item of matching) {
    await Notifications.cancelScheduledNotificationAsync(item.identifier);
  }
}

async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted === true;
}

export async function syncVideoReminder(videoId, video) {
  await cancelVideoReminder(videoId);

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

  const reminderDate = new Date(uploadDate.getTime() - 60 * 60 * 1000);

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
      body: `"${video.title}" is scheduled to be uploaded in one hour.`,
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