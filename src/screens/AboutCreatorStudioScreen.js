import React from 'react';
import { Image, Pressable, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import appConfig from '../../app.json';
import Text from '../components/ThemedText';
import GlassCard from '../components/GlassCard';
import { useTheme } from '../theme/ThemeContext';

const FEATURES = [
  { icon: 'logo-youtube', title: 'Multiple Channel Management' },
  { icon: 'videocam-outline', title: 'Video Project Management' },
  { icon: 'checkbox-outline', title: 'Custom Editing Task Management' },
  { icon: 'calendar-outline', title: 'Content Calendar & Scheduling' },
  { icon: 'bulb-outline', title: 'Content Idea Vault' },
  { icon: 'stats-chart-outline', title: 'Content Analytics Dashboard' },
  { icon: 'notifications-outline', title: 'Local Notifications & Reminders' },
  { icon: 'archive-outline', title: 'Offline Backup & Restore' },
  { icon: 'color-palette-outline', title: 'Theme Customization' },
];

const APP_INFORMATION = [
  ['Application Name', 'CreatorStudio'],
  ['Version', appConfig.expo?.version || 'Unavailable'],
  ['Platform', 'React Native / Expo'],
  ['Database', 'SQLite'],
  ['Storage', 'Local Device Storage'],
  ['Internet Requirement', 'Not Required'],
];

function SectionHeading({ title, colors }) {
  return <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>;
}

export default function AboutCreatorStudioScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable>
          <View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: colors.textSecondary }]}>APPLICATION DETAILS</Text><Text style={[styles.title, { color: colors.text }]}>About CreatorStudio</Text></View>
        </View>

        <GlassCard padding={20} style={styles.card}>
          <View style={styles.appHeader}>
            <Image source={require('../../assets/icon.png')} style={styles.appIcon} />
            <View style={styles.appHeaderCopy}>
              <Text style={[styles.appName, { color: colors.text }]}>CreatorStudio</Text>
              <Text style={[styles.tagline, { color: colors.primaryText }]}>Your Personal Content Workspace</Text>
              <Text style={[styles.version, { color: colors.textMuted }]}>Version {appConfig.expo?.version || 'Unavailable'}</Text>
            </View>
          </View>
        </GlassCard>

        <SectionHeading title="About the application" colors={colors} />
        <GlassCard padding={17} style={styles.card}>
          <Text style={[styles.body, { color: colors.textSecondary }]}>CreatorStudio is an offline content planning and video project management application designed to help creators organize their content workflow, manage multiple channels, track video production progress and plan publishing schedules in one place.</Text>
        </GlassCard>

        <SectionHeading title="Key features" colors={colors} />
        <GlassCard padding={15} style={styles.card}>
          {FEATURES.map((feature, index) => <View key={feature.title} style={[styles.featureRow, { borderBottomColor: colors.border }, index === FEATURES.length - 1 && styles.lastRow]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}><Ionicons name={feature.icon} size={17} color={colors.primaryOnLight} /></View>
            <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          </View>)}
        </GlassCard>

        <SectionHeading title="Application information" colors={colors} />
        <GlassCard padding={16} style={styles.card}>
          {APP_INFORMATION.map(([label, value], index) => <View key={label} style={[styles.infoRow, { borderBottomColor: colors.border }, index === APP_INFORMATION.length - 1 && styles.lastRow]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
          </View>)}
        </GlassCard>

        <SectionHeading title="Privacy & offline use" colors={colors} />
        <GlassCard padding={17} style={styles.card}>
          <View style={styles.privacyHeader}><View style={[styles.privacyIcon, { backgroundColor: colors.primaryLight }]}><Ionicons name="shield-checkmark-outline" size={20} color={colors.primaryOnLight} /></View><Text style={[styles.privacyTitle, { color: colors.text }]}>Your workspace stays on this device</Text></View>
          <Text style={[styles.body, { color: colors.textSecondary, marginTop: 12 }]}>CreatorStudio is designed for offline use. Your workspace data is stored locally on your device. The application does not require cloud synchronization or online account access.</Text>
        </GlassCard>

        <Text style={[styles.footer, { color: colors.textMuted }]}>Designed for personal content organization.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 42 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 23 }, back: { width: 43, height: 43, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 13 }, eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }, title: { fontSize: 22, fontWeight: '800', marginTop: 3 },
  card: { marginBottom: 21 }, appHeader: { flexDirection: 'row', alignItems: 'center', gap: 15 }, appIcon: { width: 68, height: 68, borderRadius: 20 }, appHeaderCopy: { flex: 1 }, appName: { fontSize: 21, fontWeight: '900' }, tagline: { fontSize: 11, fontWeight: '700', marginTop: 4 }, version: { fontSize: 10, fontWeight: '600', marginTop: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 }, body: { fontSize: 12, lineHeight: 19 }, featureRow: { minHeight: 49, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, gap: 11 }, lastRow: { borderBottomWidth: 0 }, featureIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, featureTitle: { flex: 1, fontSize: 11, fontWeight: '700' }, infoRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth }, infoLabel: { flex: 1, fontSize: 11 }, infoValue: { fontSize: 11, fontWeight: '700', textAlign: 'right' },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 }, privacyIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, privacyTitle: { flex: 1, fontSize: 12, fontWeight: '800' }, footer: { fontSize: 10, textAlign: 'center', fontWeight: '600', marginTop: 2, marginBottom: 12 },
});
