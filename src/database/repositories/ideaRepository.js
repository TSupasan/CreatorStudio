import { getDatabase } from '../database';

export const IDEA_STATUSES = ['New', 'Selected', 'Planned', 'Converted'];

export function parseIdeaTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags !== 'string' || !tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.filter((tag) => typeof tag === 'string') : [];
  } catch {
    return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
}

function normalizeTags(tags = []) {
  const values = Array.isArray(tags) ? tags : String(tags).split(',');
  const unique = new Map();
  values.forEach((tag) => {
    const cleanTag = String(tag).trim().replace(/^#/, '');
    if (cleanTag) unique.set(cleanTag.toLocaleLowerCase(), cleanTag);
  });
  return [...unique.values()];
}

function validateIdea(idea) {
  const title = String(idea.title || '').trim();
  if (!title) throw new Error('An idea title is required.');
  if (title.length > 120) throw new Error('Idea titles must be 120 characters or fewer.');

  const status = idea.status || 'New';
  if (!IDEA_STATUSES.includes(status)) throw new Error('Choose a valid idea status.');
  return { ...idea, title, status, tags: normalizeTags(idea.tags) };
}

export async function getIdeaCategories() {
  const db = await getDatabase();
  return db.getAllAsync(
    'SELECT * FROM idea_categories ORDER BY is_default DESC, name COLLATE NOCASE ASC'
  );
}

export async function createIdeaCategory(name) {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('Enter a category name.');
  if (cleanName.length > 40) throw new Error('Category names must be 40 characters or fewer.');

  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO idea_categories (name, is_default) VALUES (?, 0)',
    [cleanName]
  );
  return result.lastInsertRowId;
}

export async function deleteIdeaCategory(categoryId) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM idea_categories WHERE id = ? AND is_default = 0', [Number(categoryId)]);
}

export async function getContentSeries() {
  const db = await getDatabase();
  return db.getAllAsync('SELECT * FROM content_series ORDER BY name COLLATE NOCASE ASC');
}

export async function createContentSeries(name, description = '') {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('Enter a series name.');
  if (cleanName.length > 80) throw new Error('Series names must be 80 characters or fewer.');

  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO content_series (name, description, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [cleanName, String(description || '').trim(), now, now]
  );
  return result.lastInsertRowId;
}

export async function deleteContentSeries(seriesId) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM content_series WHERE id = ?', [Number(seriesId)]);
}

export async function getAllIdeas() {
  const db = await getDatabase();
  return db.getAllAsync(`
    SELECT content_ideas.*, idea_categories.name AS category_name,
           content_series.name AS series_name
    FROM content_ideas
    LEFT JOIN idea_categories ON idea_categories.id = content_ideas.category_id
    LEFT JOIN content_series ON content_series.id = content_ideas.series_id
    ORDER BY content_ideas.updated_at DESC, content_ideas.id DESC
  `);
}

export async function getIdeaById(ideaId) {
  const db = await getDatabase();
  return db.getFirstAsync(`
    SELECT content_ideas.*, idea_categories.name AS category_name,
           content_series.name AS series_name
    FROM content_ideas
    LEFT JOIN idea_categories ON idea_categories.id = content_ideas.category_id
    LEFT JOIN content_series ON content_series.id = content_ideas.series_id
    WHERE content_ideas.id = ?
  `, [Number(ideaId)]);
}

export async function createIdea(ideaInput) {
  const idea = validateIdea(ideaInput);
  if (idea.status === 'Converted') throw new Error('An idea can only become converted after a video is created.');

  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO content_ideas
      (title, description, notes, tags, category_id, series_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [idea.title, String(idea.description || '').trim(), String(idea.notes || '').trim(),
      JSON.stringify(idea.tags), idea.category_id || null, idea.series_id || null,
      idea.status, now, now]
  );
  return result.lastInsertRowId;
}

export async function updateIdea(ideaId, ideaInput) {
  const idea = validateIdea(ideaInput);
  const db = await getDatabase();
  const current = await db.getFirstAsync(
    'SELECT converted_video_id, status FROM content_ideas WHERE id = ?',
    [Number(ideaId)]
  );
  if (!current) throw new Error('This idea no longer exists.');
  if (current.converted_video_id && idea.status !== 'Converted') {
    throw new Error('The status of an idea linked to a video cannot be changed.');
  }
  if (idea.status === 'Converted' && !current.converted_video_id && current.status !== 'Converted') {
    throw new Error('An idea can only become converted after a video is created.');
  }

  await db.runAsync(
    `UPDATE content_ideas
     SET title = ?, description = ?, notes = ?, tags = ?, category_id = ?, series_id = ?,
         status = ?, updated_at = ?
     WHERE id = ?`,
    [idea.title, String(idea.description || '').trim(), String(idea.notes || '').trim(),
      JSON.stringify(idea.tags), idea.category_id || null, idea.series_id || null,
      idea.status, new Date().toISOString(), Number(ideaId)]
  );
}

export async function updateIdeaStatus(ideaId, status) {
  if (!IDEA_STATUSES.includes(status) || status === 'Converted') {
    throw new Error('Converted status is set automatically when an idea becomes a video.');
  }
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE content_ideas SET status = ?, updated_at = ?
     WHERE id = ? AND converted_video_id IS NULL`,
    [status, new Date().toISOString(), Number(ideaId)]
  );
  if (!result.changes) throw new Error('This converted idea is linked to a video and its status is locked.');
}

export async function deleteIdea(ideaId) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM content_ideas WHERE id = ?', [Number(ideaId)]);
}
