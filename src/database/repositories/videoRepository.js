
import { getDatabase } from '../database';

export async function getAllVideos() {
  const db = await getDatabase();

  return await db.getAllAsync(`
    SELECT videos.*, channels.name AS channel_name
    FROM videos
    INNER JOIN channels ON videos.channel_id = channels.id
    ORDER BY videos.created_at DESC
  `);
}

export async function getVideosByChannel(channelId) {
  const db = await getDatabase();

  return await db.getAllAsync(
    `SELECT * FROM videos
     WHERE channel_id = ?
     ORDER BY created_at DESC`,
    [channelId]
  );
}

export async function addVideo(video) {
  const db = await getDatabase();

  const result = await db.runAsync(
    `INSERT INTO videos
     (channel_id, title, description, thumbnail_uri,
      upload_date, status, priority)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      video.channel_id,
      video.title,
      video.description || '',
      video.thumbnail_uri || null,
      video.upload_date || null,
      video.status || 'Idea',
      video.priority || 'Medium',
    ]
  );

  return result.lastInsertRowId;
}

export async function updateVideo(id, video) {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE videos
     SET channel_id = ?,
         title = ?,
         description = ?,
         thumbnail_uri = ?,
         upload_date = ?,
         status = ?,
         priority = ?
     WHERE id = ?`,
    [
      video.channel_id,
      video.title,
      video.description || '',
      video.thumbnail_uri || null,
      video.upload_date || null,
      video.status || 'Idea',
      video.priority || 'Medium',
      id,
    ]
  );
}

export async function deleteVideo(id) {
  const db = await getDatabase();

  await db.runAsync(
    'DELETE FROM videos WHERE id = ?',
    [id]
  );
}
