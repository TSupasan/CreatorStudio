import * as SQLite from 'expo-sqlite';

let db;
let databaseInitialization;

async function openAndInitializeDatabase() {
  const openedDb = await SQLite.openDatabaseAsync('creatorstudio.db');

  try {
    await openedDb.execAsync(`
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

      CREATE TABLE IF NOT EXISTS idea_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE,
        is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS content_series (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS content_ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        notes TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        category_id INTEGER,
        series_id INTEGER,
        channel_id INTEGER,
        status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Selected', 'Planned', 'Converted')),
        converted_video_id INTEGER UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES idea_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (series_id) REFERENCES content_series(id) ON DELETE SET NULL,
        FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE SET NULL,
        FOREIGN KEY (converted_video_id) REFERENCES videos(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS content_ideas_category_idx ON content_ideas(category_id);
      CREATE INDEX IF NOT EXISTS content_ideas_series_idx ON content_ideas(series_id);
      CREATE INDEX IF NOT EXISTS content_ideas_status_idx ON content_ideas(status);
    `);

    const defaultIdeaCategories = [
      'Tutorial',
      'Gaming',
      'Vlog',
      'Educational',
      'Review',
      'Entertainment',
    ];
    for (const category of defaultIdeaCategories) {
      await openedDb.runAsync(
        'INSERT OR IGNORE INTO idea_categories (name, is_default) VALUES (?, 1)',
        [category]
      );
    }

    // Safe migration for databases created by earlier app versions.
    const columns = await openedDb.getAllAsync('PRAGMA table_info(videos)');
    const hasUploadTime = columns.some((column) => column.name === 'upload_time');

    if (!hasUploadTime) {
      await openedDb.execAsync('ALTER TABLE videos ADD COLUMN upload_time TEXT');
    }

    const ideaColumns = await openedDb.getAllAsync('PRAGMA table_info(content_ideas)');
    const hasIdeaChannel = ideaColumns.some((column) => column.name === 'channel_id');
    if (!hasIdeaChannel) {
      await openedDb.execAsync(
        'ALTER TABLE content_ideas ADD COLUMN channel_id INTEGER REFERENCES channels(id) ON DELETE SET NULL'
      );
    }

    await openedDb.execAsync('CREATE INDEX IF NOT EXISTS content_ideas_channel_idx ON content_ideas(channel_id)');

    return openedDb;
  } catch (error) {
    try {
      await openedDb.closeAsync();
    } catch (closeError) {
      console.warn('Could not close the failed database initialization connection:', closeError);
    }
    throw error;
  }
}

export async function getDatabase() {
  if (db) return db;

  if (!databaseInitialization) {
    databaseInitialization = openAndInitializeDatabase()
      .then((openedDb) => {
        db = openedDb;
        return openedDb;
      })
      .catch((error) => {
        databaseInitialization = null;
        throw error;
      });
  }

  return databaseInitialization;
}
