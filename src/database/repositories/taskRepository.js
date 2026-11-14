import { getDatabase } from '../database';

export async function saveVideoTasks(videoId, taskNames = []) {
  const db = await getDatabase();
  const cleanNames = [...new Set(taskNames.map((name) => name.trim()).filter(Boolean))];

  for (const name of cleanNames) {
    await db.runAsync(
      `INSERT INTO tasks (video_id, task_name, is_completed, is_optional)
       VALUES (?, ?, 0, 0)`,
      [Number(videoId), name]
    );
  }
}

export async function replaceVideoTasks(videoId, taskNames = []) {
  const db = await getDatabase();
  const cleanNames = [...new Set(taskNames.map((name) => name.trim()).filter(Boolean))];
  const existing = await db.getAllAsync(
    'SELECT * FROM tasks WHERE video_id = ?',
    [Number(videoId)]
  );

  const existingByName = new Map(existing.map((task) => [task.task_name, task]));

  for (const task of existing) {
    if (!cleanNames.includes(task.task_name)) {
      await db.runAsync('DELETE FROM tasks WHERE id = ?', [task.id]);
    }
  }

  for (const name of cleanNames) {
    if (!existingByName.has(name)) {
      await db.runAsync(
        `INSERT INTO tasks (video_id, task_name, is_completed, is_optional)
         VALUES (?, ?, 0, 0)`,
        [Number(videoId), name]
      );
    }
  }
}

export async function getTasksByVideoId(videoId) {
  const db = await getDatabase();
  return await db.getAllAsync(
    'SELECT * FROM tasks WHERE video_id = ? ORDER BY id ASC',
    [Number(videoId)]
  );
}

export async function updateTaskStatus(taskId, isCompleted) {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE tasks SET is_completed = ? WHERE id = ?',
    [isCompleted ? 1 : 0, Number(taskId)]
  );
}

export async function getVideoProgress(videoId) {
  const db = await getDatabase();
  const result = await db.getFirstAsync(
    `SELECT COUNT(*) AS total, COALESCE(SUM(is_completed), 0) AS completed
     FROM tasks WHERE video_id = ?`,
    [Number(videoId)]
  );

  const total = result?.total || 0;
  const completed = result?.completed || 0;

  return {
    total,
    completed,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
