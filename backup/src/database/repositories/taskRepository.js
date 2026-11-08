
import { getDatabase } from '../database';

// Default editing tasks for each video
const defaultTasks = [
  { name: 'Video Editing', optional: 0 },
  { name: 'Audio Editing', optional: 0 },
  { name: 'Color Grading', optional: 0 },
  { name: 'Thumbnail Designing', optional: 0 },
  { name: 'Dubbing', optional: 1 },
  { name: 'Final Review', optional: 0 },
];

// Create default tasks for a video
export async function initializeVideoTasks(videoId) {
  const db = await getDatabase();

  const existingTasks = await db.getAllAsync(
    'SELECT * FROM tasks WHERE video_id = ?',
    [videoId]
  );

  if (existingTasks.length > 0) {
    return;
  }

  for (const task of defaultTasks) {
    await db.runAsync(
      `INSERT INTO tasks
       (video_id, task_name, is_completed, is_optional)
       VALUES (?, ?, 0, ?)`,
      [videoId, task.name, task.optional]
    );
  }
}

// Get all tasks for a video
export async function getTasksByVideoId(videoId) {
  const db = await getDatabase();

  return await db.getAllAsync(
    `SELECT * FROM tasks
     WHERE video_id = ?
     ORDER BY id ASC`,
    [videoId]
  );
}

// Update task completion status
export async function updateTaskStatus(taskId, isCompleted) {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE tasks
     SET is_completed = ?
     WHERE id = ?`,
    [isCompleted ? 1 : 0, taskId]
  );
}

// Calculate video progress
export async function getVideoProgress(videoId) {
  const db = await getDatabase();

  const result = await db.getFirstAsync(
    `SELECT
       COUNT(*) AS total,
       SUM(is_completed) AS completed
     FROM tasks
     WHERE video_id = ?
       AND is_optional = 0`,
    [videoId]
  );

  const total = result?.total || 0;
  const completed = result?.completed || 0;

  return {
    total,
    completed,
    percentage: total === 0
      ? 0
      : Math.round((completed / total) * 100),
  };
}
