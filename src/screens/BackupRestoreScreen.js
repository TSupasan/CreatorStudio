import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import Text from '../components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import GlassCard from '../components/GlassCard';
import ThemeBackdrop from '../components/ThemeBackdrop';
import { createBackup, restoreBackup, validateBackup } from '../database/backupService';
import { useTheme } from '../theme/ThemeContext';

const countRecords = (backup) => ({
  channels: backup.data.channels.length,
  videos: backup.data.videos.length,
  tasks: backup.data.tasks.length,
});

function ActionButton({ colors, busy, icon, title, description, onPress, danger = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [styles.actionButton, {
        backgroundColor: pressed ? colors.surfaceSecondary : colors.surface,
        borderColor: danger ? `${colors.danger}55` : colors.border,
        opacity: busy ? 0.65 : 1,
      }]}
    >
      <View style={[styles.actionIcon, { backgroundColor: danger ? `${colors.danger}18` : colors.primaryLight }]}>
        <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.primaryOnLight} />
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionTitle, { color: danger ? colors.danger : colors.text }]}>{title}</Text>
        <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      {busy ? <ActivityIndicator color={colors.primaryText} /> : <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />}
    </Pressable>
  );
}

export default function BackupRestoreScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [busy, setBusy] = useState(false);

  const exportBackup = async () => {
    setBusy(true);
    try {
      const backup = await createBackup();
      const timestamp = backup.createdAt.replace(/[:.]/g, '-');
      const uri = `${FileSystem.documentDirectory}CreatorStudio-backup-${timestamp}.json`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2));
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('File sharing is not available on this device.');
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        UTI: 'public.json',
        dialogTitle: 'Save or share your CreatorStudio backup',
      });
      Alert.alert('Backup ready', 'Your local JSON backup was created and opened in the device share sheet.');
    } catch (error) {
      Alert.alert('Backup failed', error.message || 'The backup could not be created.');
    } finally {
      setBusy(false);
    }
  };

  const chooseBackup = async () => {
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;

      const contents = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const backup = validateBackup(JSON.parse(contents));
      const counts = countRecords(backup);
      Alert.alert(
        'Replace current data?',
        `This will replace all existing channels, videos and tasks with this backup:\n\n${counts.channels} channels\n${counts.videos} videos\n${counts.tasks} tasks\n\nThis cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace data',
            style: 'destructive',
            onPress: async () => {
              setBusy(true);
              try {
                await restoreBackup(backup);
                Alert.alert('Restore complete', 'Your channels, videos and tasks have been restored.');
              } catch (error) {
                Alert.alert('Restore failed', error.message || 'Your existing data was kept.');
              } finally {
                setBusy(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Could not read backup', error.message || 'Choose a valid CreatorStudio JSON backup file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeBackdrop colors={colors} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>YOUR DATA</Text>
            <Text style={[styles.title, { color: colors.text }]}>Backup & Restore</Text>
          </View>
        </View>

        <GlassCard style={styles.introCard} padding={18}>
          <View style={[styles.introIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="shield-checkmark-outline" size={25} color={colors.primaryOnLight} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Keep a local copy of your workspace</Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            A backup includes all channel, video and editing task records, including their IDs and relationships. It is stored as a JSON file on your device and is never uploaded by CreatorStudio.
          </Text>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Backup</Text>
        <ActionButton
          colors={colors}
          busy={busy}
          icon="download-outline"
          title="Create a backup"
          description="Export records to JSON and save or share the file locally."
          onPress={exportBackup}
        />

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Restore</Text>
        <ActionButton
          colors={colors}
          busy={busy}
          icon="refresh-outline"
          title="Restore from a backup"
          description="Choose a CreatorStudio JSON backup from your device."
          onPress={chooseBackup}
          danger
        />

        <View style={[styles.notice, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Ionicons name="image-outline" size={19} color={colors.warning} />
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            Thumbnail and channel profile image paths are recorded, but the image files themselves are not included. Those local images may not be available after moving a backup to another device.
          </Text>
        </View>
        <Text style={[styles.versionText, { color: colors.textMuted }]}>Backup format version 1</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backButton: { width: 43, height: 43, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 13 },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 23, fontWeight: '800', letterSpacing: -0.5, marginTop: 3 },
  introCard: { marginBottom: 28 },
  introIcon: { width: 46, height: 46, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  bodyText: { fontSize: 12, lineHeight: 19 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  actionButton: { minHeight: 84, borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  actionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actionText: { flex: 1, marginRight: 8 },
  actionTitle: { fontSize: 13, fontWeight: '800' },
  actionDescription: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 15, borderWidth: 1, marginTop: 27, gap: 10 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 17 },
  versionText: { textAlign: 'center', fontSize: 10, fontWeight: '600', marginTop: 20 },
});
