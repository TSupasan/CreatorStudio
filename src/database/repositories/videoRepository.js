import { getDatabase } from '../database';

async function insertVideo(db, video) {
  const result = await db.runAsync(
    `INSERT INTO videos
     (channel_id, title, description, thumbnail_uri, upload_date, upload_time, status, priority)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [video.channel_id, video.title, video.description || '', video.thumbnail_uri || null,
      video.upload_date || null, video.upload_time || null, video.status || 'Idea', video.priority || 'Medium']
  );
  return result.lastInsertRowId;
}

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
    `SELECT * FROM videos WHERE channel_id = ? ORDER BY created_at DESC`,
    [channelId]
  );
}

export async function getVideoById(id) {
  const db = await getDatabase();

  return await db.getFirstAsync(
    `SELECT videos.*, channels.name AS channel_name
     FROM videos
     INNER JOIN channels ON videos.channel_id = channels.id
     WHERE videos.id = ?`,
    [Number(id)]
  );
}

export async function addVideo(video) {
  const db = await getDatabase();
  return insertVideo(db, video);
}

export async function createVideoFromIdea(video, taskNames, ideaId) {
  const db = await getDatabase();
  const cleanTaskNames = [...new Set(taskNames.map((name) => name.trim()).filter(Boolean))];
  let createdVideoId;

  await db.withTransactionAsync(async () => {
    const sourceIdea = await db.getFirstAsync(
      'SELECT id, converted_video_id FROM content_ideas WHERE id = ?',
      [Number(ideaId)]
    );
    if (!sourceIdea) throw new Error('The source idea no longer exists.');
    if (sourceIdea.converted_video_id) throw new Error('This idea has already been converted to a video.');

    const videoId = await insertVideo(db, video);
    for (const taskName of cleanTaskNames) {
      await db.runAsync(
        `INSERT INTO tasks (video_id, task_name, is_completed, is_optional)
         VALUES (?, ?, 0, 0)`,
        [videoId, taskName]
      );
    }

    const result = await db.runAsync(
      `UPDATE content_ideas
       SET status = 'Converted', converted_video_id = ?, updated_at = ?
       WHERE id = ? AND converted_video_id IS NULL AND status != 'Converted'`,
      [videoId, new Date().toISOString(), Number(ideaId)]
    );
    if (result.changes !== 1) throw new Error('This idea has already been converted to a video.');
    createdVideoId = videoId;
  });
  return createdVideoId;
}

export async function updateVideo(id, video) {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE videos
     SET channel_id = ?, title = ?, description = ?, thumbnail_uri = ?,
         upload_date = ?, upload_time = ?, status = ?, priority = ?
     WHERE id = ?`,
    [
      video.channel_id,
      video.title,
      video.description || '',
      video.thumbnail_uri || null,
      video.upload_date || null,
      video.upload_time || null,
      video.status || 'Idea',
      video.priority || 'Medium',
      Number(id),
    ]
  );
}

export async function deleteVideo(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM videos WHERE id = ?', [Number(id)]);
}
