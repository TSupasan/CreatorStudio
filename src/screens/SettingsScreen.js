import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { getUploadRemindersEnabled, getLocalStorageSummary } from '../database/repositories/settingsRepository';
import { setUploadRemindersEnabled, setDefaultReminderTiming } from '../services/notificationService';
import { useTheme } from '../theme/ThemeContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { formatDateBytes } from '../utils/datePreferences';
import appConfig from '../../app.json';

function Section({ title, caption, colors }) {
  return <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>{caption ? <Text style={[styles.caption, { color: colors.textMuted }]}>{caption}</Text> : null}</View>;
}

function ChoiceRow({ label, choices, value, onChange, colors, disabled = false }) {
  return <View style={styles.choiceBlock}><Text style={[styles.choiceLabel, { color: colors.textSecondary }]}>{label}</Text><View style={styles.choices}>{choices.map((choice) => {
    const selected = choice.value === value;
    return <Pressable key={String(choice.value)} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={() => onChange(choice.value)} style={[styles.choice, { backgroundColor: selected ? colors.primaryLight : colors.surface, borderColor: selected ? colors.primary : colors.border, opacity: disabled ? 0.6 : 1 }]}><Text style={[styles.choiceText, { color: selected ? colors.primary : colors.text }]}>{choice.label}</Text></Pressable>;
  })}</View></View>;
}

function SettingsLink({ icon, title, description, colors, onPress, last = false }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.linkRow, { borderBottomColor: colors.border }, last && styles.lastRow]}><View style={[styles.linkIcon, { backgroundColor: colors.primaryLight }]}><Ionicons name={icon} size={19} color={colors.primary} /></View><View style={styles.linkCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>;
}

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, themeMode, themeLoaded, setThemeMode } = useTheme();
  const { preferences, ready: preferencesReady, refreshPreferences, updatePreferences } = useAppPreferences();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingReminder, setSavingReminder] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [storageSummary, setStorageSummary] = useState(null);
  const [storageError, setStorageError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [enabled, summary] = await Promise.all([getUploadRemindersEnabled(), getLocalStorageSummary()]);
      setRemindersEnabled(enabled);
      setStorageSummary(summary);
      setStorageError(false);
    } catch (error) {
      console.warn('Settings loading error:', error);
      setStorageError(true);
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const changeTheme = async (mode) => {
    if (savingTheme || mode === themeMode) return;
    setSavingTheme(true);
    try { await setThemeMode(mode); }
    catch { Alert.alert('Could not save appearance', 'Your theme selection could not be stored.'); }
    finally { setSavingTheme(false); }
  };

  const changeReminders = async (enabled) => {
    if (savingReminder) return;
    setSavingReminder(true);
    try {
      const result = await setUploadRemindersEnabled(enabled);
      setRemindersEnabled(enabled);
      if (result.failed > 0) Alert.alert('Preference saved', `${result.failed} existing reminder(s) could not be ${enabled ? 'scheduled' : 'cancelled'}.`);
    } catch (error) {
      console.warn('Reminder preference error:', error);
      Alert.alert('Could not update reminders', 'The local reminder preference could not be applied.');
      setRemindersEnabled(await getUploadRemindersEnabled().catch(() => remindersEnabled));
    } finally { setSavingReminder(false); }
  };

  const updatePreference = async (changes) => {
    if (savingPreference) return;
    setSavingPreference(true);
    try { await updatePreferences(changes); }
    catch (error) { console.warn('Preference save error:', error); Alert.alert('Could not save preference', 'Your previous setting remains active.'); }
    finally { setSavingPreference(false); }
  };

  const updateReminderTiming = async (minutes) => {
    if (savingPreference || Number(minutes) === preferences.reminderLeadMinutes) return;
    setSavingPreference(true);
    try {
      const result = await setDefaultReminderTiming(Number(minutes));
      await refreshPreferences();
      if (result.failed > 0) Alert.alert('Timing saved', `${result.failed} scheduled reminder(s) could not be updated. Other reminders were refreshed.`);
    } catch (error) {
      console.warn('Reminder timing error:', error);
      Alert.alert('Could not update reminder timing', 'The previous reminder timing remains active.');
    } finally { setSavingPreference(false); }
  };

  const themeChoices = [
    { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' },
  ];
  const reminderChoices = [
    { value: 15, label: '15 min' }, { value: 60, label: '1 hour' }, { value: 1440, label: '24 hours' },
  ];
  const dateChoices = [
    { value: 'DMY', label: 'DD/MM/YYYY' }, { value: 'MDY', label: 'MM/DD/YYYY' }, { value: 'YMD', label: 'YYYY-MM-DD' },
  ];

  return <View style={[styles.container, { backgroundColor: colors.background }]}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable><View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: colors.textSecondary }]}>PERSONALIZE YOUR APP</Text><Text style={[styles.title, { color: colors.text }]}>Settings</Text></View></View>

      <Section title="Appearance" caption="APP-WIDE" colors={colors} />
      <GlassCard padding={16} style={styles.card}>
        <ChoiceRow label="Theme" choices={themeChoices} value={themeMode} onChange={changeTheme} colors={colors} disabled={!themeLoaded || savingTheme} />
        <Text style={[styles.description, { color: colors.textSecondary, marginTop: 10 }]}>System follows your device appearance. Your selection is saved on this device.</Text>
      </GlassCard>

      <Section title="Notifications" caption="LOCAL ALERTS" colors={colors} />
      <GlassCard padding={16} style={styles.card}>
        <View style={styles.settingRow}><View style={[styles.linkIcon, { backgroundColor: colors.primaryLight }]}><Ionicons name="notifications-outline" size={19} color={colors.primary} /></View><View style={styles.linkCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>Upload reminders</Text><Text style={[styles.description, { color: colors.textSecondary }]}>Enable or disable scheduled upload alerts on this device.</Text></View>{savingReminder ? <ActivityIndicator color={colors.primary} /> : <Switch accessibilityLabel="Enable upload reminders" value={remindersEnabled} onValueChange={changeReminders} trackColor={{ false: colors.border, true: colors.primaryLight }} thumbColor={remindersEnabled ? colors.primary : colors.textMuted} />}</View>
      </GlassCard>

      <Section title="Reminder Preferences" caption="SCHEDULED UPLOADS" colors={colors} />
      <GlassCard padding={16} style={styles.card}>
        <ChoiceRow label="Default reminder timing" choices={reminderChoices} value={preferences.reminderLeadMinutes} onChange={updateReminderTiming} colors={colors} disabled={!preferencesReady || savingPreference} />
        <Text style={[styles.description, { color: colors.textSecondary, marginTop: 10 }]}>Changing this timing refreshes existing reminders when notifications are enabled.</Text>
      </GlassCard>

      <Section title="General Preferences" caption="DATES & CALENDAR" colors={colors} />
      <GlassCard padding={16} style={styles.card}>
        <ChoiceRow label="Week starts on" choices={[{ value: 0, label: 'Sunday' }, { value: 1, label: 'Monday' }]} value={preferences.weekStartsOn} onChange={(weekStartsOn) => updatePreference({ weekStartsOn })} colors={colors} disabled={!preferencesReady || savingPreference} />
        <ChoiceRow label="Date format" choices={dateChoices} value={preferences.dateFormat} onChange={(dateFormat) => updatePreference({ dateFormat })} colors={colors} disabled={!preferencesReady || savingPreference} />
        <ChoiceRow label="Time format" choices={[{ value: '12h', label: '12-hour' }, { value: '24h', label: '24-hour' }]} value={preferences.timeFormat} onChange={(timeFormat) => updatePreference({ timeFormat })} colors={colors} disabled={!preferencesReady || savingPreference} />
        <Text style={[styles.description, { color: colors.textSecondary, marginTop: 10 }]}>Dates and times shown in your schedule use these preferences. Saved video dates are unchanged.</Text>
      </GlassCard>

      <Section title="Storage & Data" caption="ON THIS DEVICE" colors={colors} />
      <GlassCard padding={16} style={styles.card}>
        {loading ? <View style={styles.loadingRow}><ActivityIndicator color={colors.primary} /><Text style={[styles.description, { color: colors.textSecondary }]}>Reading local database...</Text></View> : storageError ? <Text style={[styles.description, { color: colors.textSecondary }]}>Local storage information is temporarily unavailable.</Text> : <>
          <Text style={[styles.rowTitle, { color: colors.text }]}>Local database size · estimate</Text>
          <Text style={[styles.storageSize, { color: colors.primary }]}>{formatDateBytes(storageSummary?.databaseBytes)}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>Channels {storageSummary?.counts.channels || 0} · Videos {storageSummary?.counts.videos || 0} · Tasks {storageSummary?.counts.tasks || 0}</Text>
          <Text style={[styles.description, { color: colors.textSecondary, marginTop: 4 }]}>Ideas and their categories and series: {(storageSummary?.counts.content_ideas || 0) + (storageSummary?.counts.idea_categories || 0) + (storageSummary?.counts.content_series || 0)}</Text>
        </>}
        <Text style={[styles.description, { color: colors.textSecondary, marginTop: 12 }]}>CreatorStudio keeps its records locally. Backup files can be created and restored below; no data is uploaded.</Text>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <SettingsLink icon="archive-outline" title="Backup & Restore" description="Export or restore a local JSON backup." colors={colors} onPress={() => navigation.navigate('BackupRestore')} last />
      </GlassCard>

      <Section title="About CreatorStudio" caption="APPLICATION" colors={colors} />
      <GlassCard padding={17} style={styles.card}>
        <View style={styles.aboutHeader}><View style={[styles.aboutIcon, { backgroundColor: colors.primaryLight }]}><Ionicons name="sparkles-outline" size={22} color={colors.primary} /></View><View><Text style={[styles.rowTitle, { color: colors.text }]}>CreatorStudio</Text><Text style={[styles.description, { color: colors.textSecondary }]}>Version {appConfig.expo?.version || 'Unavailable'}</Text></View></View>
        <Text style={[styles.description, styles.aboutDescription, { color: colors.textSecondary }]}>A personal workspace to plan videos, organize channels and track your content workflow.</Text>
        <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceSecondary }]}><Ionicons name="phone-portrait-outline" size={16} color={colors.success} /><Text style={[styles.description, { color: colors.textSecondary, marginTop: 0 }]}>Works offline. Your data stays on this device.</Text></View>
      </GlassCard>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 40 }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 26 }, back: { width: 43, height: 43, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 13 }, eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.6 }, title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginTop: 3 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }, sectionTitle: { fontSize: 17, fontWeight: '800' }, caption: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1 }, card: { marginBottom: 22, borderRadius: 20 }, rowTitle: { fontSize: 13, fontWeight: '800' }, description: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  choiceBlock: { marginBottom: 16 }, choiceLabel: { fontSize: 11, fontWeight: '700', marginBottom: 8 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, choice: { minHeight: 39, paddingHorizontal: 11, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, choiceText: { fontSize: 10, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center' }, linkIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 }, linkCopy: { flex: 1, marginRight: 8 }, linkRow: { minHeight: 62, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 }, lastRow: { borderBottomWidth: 0 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, storageSize: { fontSize: 23, fontWeight: '800', marginTop: 7, marginBottom: 5 }, separator: { height: StyleSheet.hairlineWidth, marginTop: 14 }, aboutHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 }, aboutIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, aboutDescription: { marginTop: 15, marginBottom: 13 }, offlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 11 },
});
