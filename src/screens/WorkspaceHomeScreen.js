import React, { useCallback } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import Text from '../components/ThemedText';
import AppLogo from '../components/AppLogo';
import ThemeBackdrop from '../components/ThemeBackdrop';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { useTheme } from '../theme/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';

function WorkspaceAvatar({ channel, colors }) {
  return (
    <View style={[styles.workspaceAvatar, { backgroundColor: colors.primaryLight }]}>
      {channel?.profile_image_uri
        ? <Image source={{ uri: channel.profile_image_uri }} style={styles.channelImage} />
        : <Ionicons name={channel ? 'logo-youtube' : 'apps-outline'} size={25} color={colors.primaryOnLight} />}
    </View>
  );
}

function QuickAction({ colors, icon, title, description, onPress, accent }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, { backgroundColor: pressed ? colors.surfaceSecondary : colors.surface, borderColor: colors.border }]}>
      <View style={[styles.quickIcon, { backgroundColor: accent }]}>
        <Ionicons name={icon} size={21} color={colors.primaryText} />
      </View>
      <Text style={[styles.quickTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.quickDescription, { color: colors.textSecondary }]}>{description}</Text>
      <Ionicons name="arrow-forward" size={16} color={colors.primaryText} style={styles.quickArrow} />
    </Pressable>
  );
}

function Shortcut({ colors, icon, title, onPress, last = false }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.shortcut, { backgroundColor: pressed ? colors.surfaceSecondary : colors.surface, borderColor: colors.border }, last && styles.lastShortcut]}>
      <View style={[styles.shortcutIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon} size={18} color={colors.primaryOnLight} />
      </View>
      <Text style={[styles.shortcutTitle, { color: colors.text }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
    </Pressable>
  );
}

export default function WorkspaceHomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { refreshWorkspace, selectedChannel } = useWorkspace();

  useFocusEffect(useCallback(() => {
    refreshWorkspace().catch((error) => console.error('Could not refresh workspace:', error));
  }, [refreshWorkspace]));

  const openProfileSwitcher = () => navigation.navigate('Profile', { openWorkspacePicker: true });
  const tabNavigation = navigation.getParent();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeBackdrop colors={colors} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppLogo width={48} style={styles.homeLogo} />
          <View style={styles.headerCopy}>
            <Text style={[styles.welcome, { color: colors.textSecondary }]}>WELCOME BACK</Text>
            <Text style={[styles.title, { color: colors.text }]}>Your creative workspace</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open Profile" onPress={() => navigation.navigate('Profile')} style={[styles.profileButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={21} color={colors.primaryText} />
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel={`Current workspace: ${selectedChannel?.name || 'All Channels'}. Tap to switch channels.`} onPress={openProfileSwitcher}>
          <GlassCard padding={15} style={styles.workspaceCard}>
            <WorkspaceAvatar channel={selectedChannel} colors={colors} />
            <View style={styles.workspaceCopy}>
              <Text style={[styles.workspaceLabel, { color: colors.textMuted }]}>CURRENT WORKSPACE</Text>
              <Text numberOfLines={1} style={[styles.workspaceName, { color: colors.text }]}>{selectedChannel?.name || 'All Channels'}</Text>
              <View style={styles.activeRow}>
                <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                <Text style={[styles.activeText, { color: colors.success }]}>Active workspace</Text>
              </View>
            </View>
            <View style={[styles.switchIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="swap-horizontal" size={18} color={colors.primaryOnLight} />
            </View>
          </GlassCard>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick actions</Text>
          <Text style={[styles.sectionHint, { color: colors.textMuted }]}>Start creating</Text>
        </View>
        <View style={styles.quickActions}>
          <QuickAction
            colors={colors}
            icon="videocam-outline"
            title="Create Video"
            description="Plan your next project"
            onPress={() => tabNavigation?.navigate('Create')}
            accent={`${colors.primary}18`}
          />
          <QuickAction
            colors={colors}
            icon="bulb-outline"
            title="Idea Vault"
            description="Explore your saved ideas"
            onPress={() => tabNavigation?.navigate('Idea')}
            accent={`${colors.secondary}20`}
          />
        </View>

        <View style={[styles.sectionHeader, styles.shortcutHeading]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Workspace shortcuts</Text>
        </View>
        <View style={[styles.shortcutList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Shortcut colors={colors} icon="albums-outline" title="Manage Videos" onPress={() => tabNavigation?.navigate('Video')} />
          <Shortcut colors={colors} icon="calendar-outline" title="Content Calendar" onPress={() => tabNavigation?.navigate('Calendar')} />
          <Shortcut colors={colors} icon="stats-chart-outline" title="View Analytics Dashboard" onPress={() => navigation.navigate('Dashboard')} last />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 125 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  homeLogo: { marginRight: 11 },
  headerCopy: { flex: 1, minWidth: 0, paddingRight: 12 },
  welcome: { fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: 5 },
  profileButton: { width: 44, height: 44, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  workspaceCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 19, marginBottom: 27 },
  workspaceAvatar: { width: 53, height: 53, borderRadius: 17, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  channelImage: { width: '100%', height: '100%' },
  workspaceCopy: { flex: 1, minWidth: 0, marginLeft: 12 },
  workspaceLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  workspaceName: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  activeText: { fontSize: 9, fontWeight: '700' },
  switchIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionHint: { fontSize: 10, fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 11 },
  quickAction: { flex: 1, minHeight: 157, borderWidth: 1, borderRadius: 18, padding: 13 },
  quickIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  quickTitle: { fontSize: 12, fontWeight: '800' },
  quickDescription: { fontSize: 9, lineHeight: 14, marginTop: 5, paddingRight: 4 },
  quickArrow: { position: 'absolute', right: 13, bottom: 13 },
  shortcutHeading: { marginTop: 27 },
  shortcutList: { borderWidth: 1, borderRadius: 17, paddingHorizontal: 12 },
  shortcut: { minHeight: 59, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, gap: 11 },
  lastShortcut: { borderBottomWidth: 0 },
  shortcutIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  shortcutTitle: { flex: 1, fontSize: 11, fontWeight: '700' },
});
