import SQLiteStorage from 'expo-sqlite/kv-store';
import { getDatabase } from '../database';
import { defaultVisualTheme, normalizeCustomHex, visualThemeNames } from '../../theme/colors';

const storage = SQLiteStorage;
const PROFILE_KEY = 'creatorstudio.profile.v1';
const THEME_KEY = 'creatorstudio.theme.v1';
const REMINDERS_KEY = 'creatorstudio.uploadReminders.v1';
const WORKSPACE_CHANNEL_KEY = 'creatorstudio.workspaceChannel.v1';
const APP_PREFERENCES_KEY = 'creatorstudio.appPreferences.v1';

export const defaultAppPreferences = {
  reminderLeadMinutes: 60,
  weekStartsOn: 0,
  dateFormat: 'DMY',
  timeFormat: '12h',
  visualTheme: defaultVisualTheme,
  customAccent: null,
  typographyStyle: 'default',
};

const REMINDER_INTERVALS = [15, 60, 1440];

function normalizeAppPreferences(value = {}) {
  return {
    reminderLeadMinutes: REMINDER_INTERVALS.includes(Number(value.reminderLeadMinutes))
      ? Number(value.reminderLeadMinutes) : defaultAppPreferences.reminderLeadMinutes,
    weekStartsOn: Number(value.weekStartsOn) === 1 ? 1 : 0,
    dateFormat: ['DMY', 'MDY', 'YMD'].includes(value.dateFormat) ? value.dateFormat : 'DMY',
    timeFormat: value.timeFormat === '24h' ? '24h' : '12h',
    visualTheme: visualThemeNames.includes(value.visualTheme) ? value.visualTheme : defaultVisualTheme,
    customAccent: normalizeCustomHex(value.customAccent),
    typographyStyle: ['default', 'modern', 'rounded'].includes(value.typographyStyle) ? value.typographyStyle : 'default',
  };
}

export async function getAppPreferences() {
  const saved = await storage.getItemAsync(APP_PREFERENCES_KEY);
  if (!saved) return { ...defaultAppPreferences };
  try {
    return normalizeAppPreferences(JSON.parse(saved));
  } catch {
    return { ...defaultAppPreferences };
  }
}

export async function saveAppPreferences(preferences) {
  const normalized = normalizeAppPreferences(preferences);
  await storage.setItemAsync(APP_PREFERENCES_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function getDefaultReminderTiming() {
  return (await getAppPreferences()).reminderLeadMinutes;
}

export async function saveDefaultReminderTiming(minutes) {
  if (!REMINDER_INTERVALS.includes(Number(minutes))) throw new Error('Unsupported reminder timing.');
  return saveAppPreferences({ ...(await getAppPreferences()), reminderLeadMinutes: Number(minutes) });
}

export async function getLocalStorageSummary() {
  const db = await getDatabase();
  const tables = ['channels', 'videos', 'tasks', 'content_ideas', 'idea_categories', 'content_series'];
  const counts = {};
  for (const table of tables) {
    const row = await db.getFirstAsync(`SELECT COUNT(*) AS count FROM ${table}`);
    counts[table] = Number(row?.count || 0);
  }
  const pageCount = await db.getFirstAsync('PRAGMA page_count');
  const pageSize = await db.getFirstAsync('PRAGMA page_size');
  const databaseBytes = Number(pageCount?.page_count || 0) * Number(pageSize?.page_size || 0);
  return { counts, databaseBytes };
}

export const defaultCreatorProfile = {
  name: '',
  bio: '',
  imageUri: null,
};

export async function getCreatorProfile() {
  const savedProfile = await storage.getItemAsync(PROFILE_KEY);
  if (!savedProfile) return { ...defaultCreatorProfile };

  try {
    const profile = JSON.parse(savedProfile);
    return {
      name: typeof profile.name === 'string' ? profile.name : '',
      bio: typeof profile.bio === 'string' ? profile.bio : '',
      imageUri: typeof profile.imageUri === 'string' ? profile.imageUri : null,
    };
  } catch {
    return { ...defaultCreatorProfile };
  }
}

export async function saveCreatorProfile(profile) {
  const value = {
    name: profile.name.trim(),
    bio: profile.bio.trim(),
    imageUri: profile.imageUri || null,
  };
  await storage.setItemAsync(PROFILE_KEY, JSON.stringify(value));
  return value;
}

export async function getSavedThemeMode() {
  const mode = await storage.getItemAsync(THEME_KEY);
  return mode === 'light' || mode === 'dark' ? mode : 'system';
}

export async function saveThemeMode(mode) {
  if (mode !== 'light' && mode !== 'dark' && mode !== 'system') {
    throw new Error('Unsupported theme selection.');
  }
  await storage.setItemAsync(THEME_KEY, mode);
}

export async function getUploadRemindersEnabled() {
  const preference = await storage.getItemAsync(REMINDERS_KEY);
  return preference !== 'false';
}

export async function saveUploadRemindersEnabled(enabled) {
  await storage.setItemAsync(REMINDERS_KEY, enabled ? 'true' : 'false');
}

export async function getSelectedWorkspaceChannelId() {
  const savedId = await storage.getItemAsync(WORKSPACE_CHANNEL_KEY);
  if (!savedId || savedId === 'all') return null;
  const channelId = Number(savedId);
  return Number.isSafeInteger(channelId) && channelId > 0 ? channelId : null;
}

export async function saveSelectedWorkspaceChannelId(channelId) {
  const value = channelId === null ? 'all' : String(Number(channelId));
  await storage.setItemAsync(WORKSPACE_CHANNEL_KEY, value);
}
