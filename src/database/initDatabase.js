import { getDatabase } from './database';

export async function initializeDatabase() {
  try {
    const db = await getDatabase();

    console.log('CreatorStudio database initialized successfully.');

    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}