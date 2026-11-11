import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import GlassCard from '../components/GlassCard';
import {
  defaultCreatorProfile,
  getCreatorProfile,
  getUploadRemindersEnabled,
  saveCreatorProfile,
} from '../database/repositories/settingsRepository';
import { setUploadRemindersEnabled } from '../services/notificationService';
import { useTheme } from '../theme/ThemeContext';
import appConfig from '../../app.json';

function SectionHeading({ title, caption, colors }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {caption ? <Text style={[styles.sectionCaption, { color: colors.textMuted }]}>{caption}</Text> : null}
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, themeMode, themeLoaded, setThemeMode } = useTheme();
  const [profile, setProfile] = useState(defaultCreatorProfile);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingReminderPreference, setSavingReminderPreference] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  useEffect(() => {
    let isActive = true;
    Promise.all([getCreatorProfile(), getUploadRemindersEnabled()])
      .then(([savedProfile, savedRemindersEnabled]) => {
        if (!isActive) return;
        setProfile(savedProfile);
        setRemindersEnabled(savedRemindersEnabled);
      })
      .catch((error) => {
        console.error('Settings loading error:', error);
        Alert.alert('Settings unavailable', 'Could not load your saved settings.');
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const updateProfileField = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const chooseProfileImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to select a profile image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;

      const pickedUri = result.assets[0].uri;
      const extension = pickedUri.split('.').pop()?.split('?')[0] || 'jpg';
      const destination = `${FileSystem.documentDirectory}creator_profile_${Date.now()}.${extension}`;
      await FileSystem.copyAsync({ from: pickedUri, to: destination });
      updateProfileField('imageUri', destination);
    } catch (error) {
      console.error('Profile image selection error:', error);
      Alert.alert('Image unavailable', 'Could not save the selected profile image on this device.');
    }
  };

  const saveProfile = async () => {
    if (!profile.name.trim()) {
      Alert.alert('Creator name required', 'Enter a creator name before saving your profile.');
      return;
    }

    setSavingProfile(true);
    try {
      const savedProfile = await saveCreatorProfile(profile);
      setProfile(savedProfile);
      Alert.alert('Profile saved', 'Your creator profile is stored on this device.');
    } catch (error) {
      console.error('Profile save error:', error);
      Alert.alert('Could not save profile', 'Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const changeTheme = async (mode) => {
    if (mode === themeMode || savingTheme) return;
    setSavingTheme(true);
    try {
      await setThemeMode(mode);
    } catch {
      Alert.alert('Could not save appearance', 'Your theme selection could not be stored.');
    } finally {
      setSavingTheme(false);
    }
  };

  const changeReminderPreference = async (enabled) => {
    if (savingReminderPreference) return;
    setSavingReminderPreference(true);
    try {
      const result = await setUploadRemindersEnabled(enabled);
      setRemindersEnabled(enabled);
      if (result.failed > 0) {
        Alert.alert(
          enabled ? 'Preference saved' : 'Preference saved',
          enabled
            ? `Reminders are enabled, but ${result.failed} existing reminder(s) could not be scheduled.`
            : `Reminders are disabled, but ${result.failed} scheduled reminder(s) could not be cancelled.`
        );
      }
    } catch (error) {
      console.error('Reminder preference error:', error);
      Alert.alert('Could not update reminders', 'Your reminder preference could not be applied.');
      const currentValue = await getUploadRemindersEnabled().catch(() => remindersEnabled);
      setRemindersEnabled(currentValue);
    } finally {
      setSavingReminderPreference(false);
    }
  };

  const activeTheme = themeMode === 'system' ? (isDark ? 'dark' : 'light') : themeMode;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>PERSONALIZE YOUR SPACE</Text>
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your settings...</Text>
          </View>
        ) : (
          <>
            <SectionHeading title="Profile" caption="ON THIS DEVICE" colors={colors} />
            <GlassCard padding={17} style={styles.card}>
              <View style={styles.profileTop}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose profile image"
                  onPress={chooseProfileImage}
                  style={[styles.avatar, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}
                >
                  {profile.imageUri ? (
                    <Image source={{ uri: profile.imageUri }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person-outline" size={32} color={colors.primary} />
                  )}
                  <View style={[styles.editPhotoBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="camera-outline" size={13} color="#FFFFFF" />
                  </View>
                </Pressable>
                <View style={styles.profileIntro}>
                  <Text style={[styles.profileName, { color: colors.text }]}>{profile.name || 'Your creator profile'}</Text>
                  <Text style={[styles.profileHint, { color: colors.textSecondary }]}>Tap the photo to choose an image</Text>
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CREATOR NAME</Text>
              <TextInput
                accessibilityLabel="Creator name"
                value={profile.name}
                onChangeText={(value) => updateProfileField('name', value)}
                placeholder="Your name or channel identity"
                placeholderTextColor={colors.textMuted}
                maxLength={50}
                returnKeyType="next"
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 15 }]}>SHORT BIO</Text>
              <TextInput
                accessibilityLabel="Short bio"
                value={profile.bio}
                onChangeText={(value) => updateProfileField('bio', value)}
                placeholder="A few words about your creative work"
                placeholderTextColor={colors.textMuted}
                maxLength={180}
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.bioInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              />
              <Text style={[styles.characterCount, { color: colors.textMuted }]}>{profile.bio.length}/180</Text>

              <Pressable
                accessibilityRole="button"
                disabled={savingProfile}
                onPress={saveProfile}
                style={({ pressed }) => [styles.primaryButton, { backgroundColor: pressed ? colors.secondary : colors.primary, opacity: savingProfile ? 0.7 : 1 }]}
              >
                {savingProfile ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" />}
                <Text style={styles.primaryButtonText}>{savingProfile ? 'Saving...' : 'Save profile'}</Text>
              </Pressable>
            </GlassCard>

            <SectionHeading title="Appearance" caption="APP-WIDE" colors={colors} />
            <GlassCard padding={16} style={styles.card}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Color theme</Text>
              <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>Choose how CreatorStudio looks on this device.</Text>
              <View style={styles.themeOptions}>
                {[
                  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
                  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
                ].map((option) => {
                  const selected = activeTheme === option.mode;
                  return (
                    <Pressable
                      key={option.mode}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected, disabled: !themeLoaded || savingTheme }}
                      disabled={!themeLoaded || savingTheme}
                      onPress={() => changeTheme(option.mode)}
                      style={[styles.themeOption, {
                        backgroundColor: selected ? colors.primaryLight : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      }]}
                    >
                      <Ionicons name={option.icon} size={18} color={selected ? colors.primary : colors.textSecondary} />
                      <Text style={[styles.themeOptionText, { color: selected ? colors.primary : colors.text }]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </GlassCard>

            <SectionHeading title="Notifications" caption="LOCAL REMINDERS" colors={colors} />
            <GlassCard padding={16} style={styles.card}>
              <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="notifications-outline" size={19} color={colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Upload reminders</Text>
                  <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>Local alerts one hour before a scheduled upload.</Text>
                </View>
                {savingReminderPreference ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Switch
                    accessibilityLabel="Enable upload reminders"
                    value={remindersEnabled}
                    onValueChange={changeReminderPreference}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={remindersEnabled ? colors.primary : colors.textMuted}
                  />
                )}
              </View>
            </GlassCard>

            <SectionHeading title="About" caption="CREATORSTUDIO" colors={colors} />
            <GlassCard padding={17} style={styles.card}>
              <View style={styles.aboutHeader}>
                <View style={[styles.aboutIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.aboutName, { color: colors.text }]}>CreatorStudio</Text>
                  <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>Version {appConfig.expo?.version || 'Unavailable'}</Text>
                </View>
              </View>
              <Text style={[styles.aboutDescription, { color: colors.textSecondary }]}>A personal workspace to plan videos, organize channels and track your content workflow.</Text>
              <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceSecondary }]}>
                <Ionicons name="phone-portrait-outline" size={16} color={colors.success} />
                <Text style={[styles.offlineText, { color: colors.textSecondary }]}>Works offline. Your data stays on this device.</Text>
              </View>
            </GlassCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 27 },
  backButton: { width: 43, height: 43, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 13 },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginTop: 3 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionCaption: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  card: { marginBottom: 24, borderRadius: 20 },
  profileTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 21 },
  avatar: { width: 72, height: 72, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  editPhotoBadge: { position: 'absolute', right: 3, bottom: 3, width: 23, height: 23, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  profileIntro: { flex: 1, marginLeft: 14 },
  profileName: { fontSize: 15, fontWeight: '800' },
  profileHint: { fontSize: 11, marginTop: 5 },
  fieldLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 7 },
  input: { minHeight: 47, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13 },
  bioInput: { minHeight: 88, maxHeight: 130 },
  characterCount: { textAlign: 'right', fontSize: 9, marginTop: 5 },
  primaryButton: { height: 48, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  rowTitle: { fontSize: 13, fontWeight: '800' },
  rowDescription: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  themeOptions: { flexDirection: 'row', gap: 10, marginTop: 15 },
  themeOption: { flex: 1, height: 47, borderWidth: 1, borderRadius: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  themeOptionText: { fontSize: 12, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  settingText: { flex: 1, marginRight: 7 },
  aboutHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aboutIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  aboutName: { fontSize: 15, fontWeight: '800' },
  aboutDescription: { fontSize: 12, lineHeight: 19, marginTop: 15 },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 11, marginTop: 15 },
  offlineText: { flex: 1, fontSize: 11, fontWeight: '600' },
  loadingState: { minHeight: 190, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 12, marginTop: 10 },
});
