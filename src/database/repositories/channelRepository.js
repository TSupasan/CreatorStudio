import { getDatabase } from '../database';

export async function getAllChannels() {
  const db = await getDatabase();

  return await db.getAllAsync(
    'SELECT * FROM channels ORDER BY created_at DESC'
  );
}

export async function addChannel(
  name,
  description = '',
  profileImageUri = null
) {
  const db = await getDatabase();

  const result = await db.runAsync(
    `INSERT INTO channels (name, description, profile_image_uri)
     VALUES (?, ?, ?)`,
    [name, description, profileImageUri]
  );

  return result.lastInsertRowId;
}

export async function updateChannel(
  id,
  name,
  description,
  profileImageUri = null
) {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE channels
     SET name = ?, description = ?, profile_image_uri = ?
     WHERE id = ?`,
    [name, description, profileImageUri, id]
  );
}

export async function deleteChannel(id) {
  const db = await getDatabase();

  await db.runAsync(
    'DELETE FROM channels WHERE id = ?',
    [id]
  );
}