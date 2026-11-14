import { getDatabase } from './database';

export const BACKUP_FORMAT_VERSION = 1;

const isPositiveId = (value) => Number.isSafeInteger(value) && value > 0;
const isTextOrNull = (value) => value === null || typeof value === 'string';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateRows(rows, tableName, validateRow) {
  assert(Array.isArray(rows), `Backup ${tableName} must be a list.`);
  const ids = new Set();
  rows.forEach((row, index) => {
    assert(row && typeof row === 'object' && !Array.isArray(row), `Backup ${tableName} entry ${index + 1} is invalid.`);
    assert(isPositiveId(row.id), `Backup ${tableName} contains an invalid ID.`);
    assert(!ids.has(row.id), `Backup ${tableName} contains duplicate IDs.`);
    ids.add(row.id);
    validateRow(row);
  });
  return ids;
}

export function validateBackup(backup) {
  assert(backup && typeof backup === 'object' && !Array.isArray(backup), 'This file is not a CreatorStudio backup.');
  assert(backup.applicationName === 'CreatorStudio', 'This backup was not created by CreatorStudio.');
  assert(backup.formatVersion === BACKUP_FORMAT_VERSION, 'This backup format version is not supported.');
  assert(typeof backup.createdAt === 'string' && !Number.isNaN(Date.parse(backup.createdAt)), 'The backup creation date is invalid.');
  assert(backup.data && typeof backup.data === 'object' && !Array.isArray(backup.data), 'Backup data is missing.');

  const { channels, videos, tasks } = backup.data;
  const channelIds = validateRows(channels, 'channels', (row) => {
    assert(typeof row.name === 'string' && row.name.trim().length > 0, 'A channel name is invalid.');
    assert(isTextOrNull(row.description) && isTextOrNull(row.profile_image_uri), 'A channel field is invalid.');
    assert(isTextOrNull(row.created_at), 'A channel creation date is invalid.');
  });
  const videoIds = validateRows(videos, 'videos', (row) => {
    assert(isPositiveId(row.channel_id) && channelIds.has(row.channel_id), 'A video refers to a missing channel.');
    assert(typeof row.title === 'string' && row.title.trim().length > 0, 'A video title is invalid.');
    ['description', 'thumbnail_uri', 'upload_date', 'upload_time', 'status', 'priority', 'created_at', 'completed_at']
      .forEach((field) => assert(isTextOrNull(row[field]), `A video ${field} field is invalid.`));
  });
  validateRows(tasks, 'tasks', (row) => {
    assert(isPositiveId(row.video_id) && videoIds.has(row.video_id), 'A task refers to a missing video.');
    assert(typeof row.task_name === 'string' && row.task_name.trim().length > 0, 'A task name is invalid.');
    assert(row.is_completed === 0 || row.is_completed === 1, 'A task completion value is invalid.');
    assert(row.is_optional === 0 || row.is_optional === 1, 'A task optional value is invalid.');
  });

  return backup;
}

export async function createBackup() {
  const db = await getDatabase();
  const [channels, videos, tasks] = await Promise.all([
    db.getAllAsync('SELECT * FROM channels ORDER BY id ASC'),
    db.getAllAsync('SELECT * FROM videos ORDER BY id ASC'),
    db.getAllAsync('SELECT * FROM tasks ORDER BY id ASC'),
  ]);

  return {
    applicationName: 'CreatorStudio',
    formatVersion: BACKUP_FORMAT_VERSION,
    createdAt: new Date().toISOString(),
    data: { channels, videos, tasks },
  };
}

export async function restoreBackup(backup) {
  validateBackup(backup);
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM tasks');
    await db.runAsync('DELETE FROM videos');
    await db.runAsync('DELETE FROM channels');

    for (const channel of backup.data.channels) {
      await db.runAsync(
        `INSERT INTO channels (id, name, description, profile_image_uri, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [channel.id, channel.name, channel.description, channel.profile_image_uri, channel.created_at]
      );
    }
    for (const video of backup.data.videos) {
      await db.runAsync(
        `INSERT INTO videos
         (id, channel_id, title, description, thumbnail_uri, upload_date, upload_time, status, priority, created_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [video.id, video.channel_id, video.title, video.description, video.thumbnail_uri, video.upload_date,
          video.upload_time, video.status, video.priority, video.created_at, video.completed_at]
      );
    }
    for (const task of backup.data.tasks) {
      await db.runAsync(
        `INSERT INTO tasks (id, video_id, task_name, is_completed, is_optional)
         VALUES (?, ?, ?, ?, ?)`,
        [task.id, task.video_id, task.task_name, task.is_completed, task.is_optional]
      );
    }
  });
}
