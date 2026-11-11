import SQLiteStorage from 'expo-sqlite/kv-store';

const storage = SQLiteStorage;
const PROFILE_KEY = 'creatorstudio.profile.v1';
const THEME_KEY = 'creatorstudio.theme.v1';
const REMINDERS_KEY = 'creatorstudio.uploadReminders.v1';

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
