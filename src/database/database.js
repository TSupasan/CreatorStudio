import * as SQLite from 'expo-sqlite';

let db;

export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('creatorstudio.db');

    await db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        profile_image_uri TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        thumbnail_uri TEXT,
        upload_date TEXT,
        upload_time TEXT,
        status TEXT DEFAULT 'Idea',
        priority TEXT DEFAULT 'Medium',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER NOT NULL,
        task_name TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        is_optional INTEGER DEFAULT 0,
        FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
      );
    `);

    // Safe migration for databases created by earlier app versions.
    const columns = await db.getAllAsync('PRAGMA table_info(videos)');
    const hasUploadTime = columns.some((column) => column.name === 'upload_time');

    if (!hasUploadTime) {
      await db.execAsync('ALTER TABLE videos ADD COLUMN upload_time TEXT');
    }
  }

  return db;
}
