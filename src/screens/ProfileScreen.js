import React, { useCallback, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/ThemedText';
import GlassCard from '../components/GlassCard';
import { useTheme } from '../theme/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';

export default function ProfileScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { channels, channelId, refreshWorkspace, selectWorkspace, selectedChannel } = useWorkspace();
  const [pickerVisible, setPickerVisible] = useState(false);
  const showPicker = pickerVisible || Boolean(route?.params?.openWorkspacePicker);

  useFocusEffect(useCallback(() => {
    refreshWorkspace().catch((error) => console.warn('Workspace loading error:', error));
  }, [refreshWorkspace]));

  const closePicker = () => {
    setPickerVisible(false);
    if (route?.params?.openWorkspacePicker) navigation.setParams({ openWorkspacePicker: undefined });
  };

  const switchWorkspace = async (nextId) => {
    try {
      await selectWorkspace(nextId);
      closePicker();
      navigation.navigate('MainTabs', { screen: 'Home', params: { screen: 'Dashboard' } });
    } catch (error) {
      Alert.alert('Could not switch workspace', error.message || 'Please choose an available channel.');
    }
  };

  const navRow = (icon, title, subtitle, onPress, last = false) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.navRow, { borderBottomColor: colors.border }, last && styles.lastRow]}>
      <View style={[styles.navIcon, { backgroundColor: colors.primaryLight }]}><Ionicons name={icon} size={19} color={colors.primaryOnLight} /></View>
      <View style={styles.navCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.description, { color: colors.textSecondary }]}>{subtitle}</Text></View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable>
          <View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: colors.textSecondary }]}>YOUR CREATOR WORKSPACE</Text><Text style={[styles.title, { color: colors.text }]}>Workspace & Preferences</Text></View>
        </View>

        <GlassCard padding={17} style={styles.card}>
          <View style={styles.identity}><Image source={require('../../assets/icon.png')} style={styles.appIcon} /><View style={{ flex: 1 }}><Text style={[styles.identityTitle, { color: colors.text }]}>CreatorStudio</Text><Text style={[styles.description, { color: colors.textSecondary }]}>Your Personal Content Workspace</Text></View></View>
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>CURRENT WORKSPACE</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Switch workspace. Current workspace: ${selectedChannel?.name || 'All Channels'}`} onPress={() => setPickerVisible(true)} style={[styles.workspace, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.workspaceIcon, { backgroundColor: colors.primaryLight }]}>{selectedChannel?.profile_image_uri ? <Image source={{ uri: selectedChannel.profile_image_uri }} style={styles.workspaceImage} /> : <Ionicons name={selectedChannel ? 'logo-youtube' : 'apps-outline'} size={20} color={colors.primaryOnLight} />}</View>
            <View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: colors.text }]}>{selectedChannel?.name || 'All Channels'}</Text><Text style={[styles.description, { color: colors.textMuted }]}>Tap to switch channel workspace</Text></View>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </Pressable>
          {navRow('people-outline', 'Manage Channels', 'Add or organize your channels', () => navigation.navigate('ManageChannels'), true)}
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
        <GlassCard padding={17} style={styles.card}>
          {navRow('settings-outline', 'Settings', 'Appearance, notifications, reminders and data', () => navigation.navigate('Settings'))}
          {navRow('information-circle-outline', 'About CreatorStudio', 'App details, features and privacy', () => navigation.navigate('AboutCreatorStudio'), true)}
        </GlassCard>
      </ScrollView>

      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={closePicker}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.modalOverlay }]} onPress={closePicker}><Pressable style={[styles.modal, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={styles.modalHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>Switch workspace</Text><Pressable accessibilityRole="button" accessibilityLabel="Close workspace selector" onPress={closePicker} hitSlop={10}><Ionicons name="close" size={22} color={colors.textSecondary} /></Pressable></View>
          <ScrollView>
            {[{ id: null, name: 'All Channels' }, ...channels].map((channel) => <Pressable key={String(channel.id)} accessibilityRole="radio" accessibilityState={{ checked: channelId === channel.id }} onPress={() => switchWorkspace(channel.id)} style={[styles.option, { borderBottomColor: colors.border }]}><View style={[styles.workspaceIcon, { backgroundColor: colors.primaryLight }]}>{channel.profile_image_uri ? <Image source={{ uri: channel.profile_image_uri }} style={styles.workspaceImage} /> : <Ionicons name={channel.id === null ? 'apps-outline' : 'logo-youtube'} size={20} color={colors.primaryOnLight} />}</View><Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text, flex: 1 }]}>{channel.name}</Text>{channelId === channel.id ? <Ionicons name="checkmark-circle" size={20} color={colors.primaryText} /> : null}</Pressable>)}
          </ScrollView>
        </Pressable></Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 }, back: { width: 43, height: 43, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 13 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.6 }, title: { fontSize: 23, fontWeight: '800', letterSpacing: -0.5, marginTop: 3 },
  card: { marginBottom: 22, borderRadius: 20 }, identity: { flexDirection: 'row', alignItems: 'center', gap: 12 }, appIcon: { width: 50, height: 50, borderRadius: 15 }, identityTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 7 }, workspace: { minHeight: 62, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 9, gap: 10, marginBottom: 5 }, workspaceIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, workspaceImage: { width: '100%', height: '100%' },
  rowTitle: { fontSize: 13, fontWeight: '800' }, description: { fontSize: 11, lineHeight: 16, marginTop: 4 }, navRow: { minHeight: 64, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 }, lastRow: { borderBottomWidth: 0 }, navIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, navCopy: { flex: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 }, overlay: { flex: 1, justifyContent: 'flex-end' }, modal: { maxHeight: '72%', minHeight: '35%', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28 }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, option: { minHeight: 59, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
});
