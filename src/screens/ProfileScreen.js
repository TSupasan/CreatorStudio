import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import GlassCard from '../components/GlassCard';
import { defaultCreatorProfile, getCreatorProfile, saveCreatorProfile } from '../database/repositories/settingsRepository';
import { useTheme } from '../theme/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';

export default function ProfileScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { channels, channelId, refreshWorkspace, selectWorkspace, selectedChannel } = useWorkspace();
  const [profile, setProfile] = useState(defaultCreatorProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const showPicker = pickerVisible || Boolean(route?.params?.openWorkspacePicker);

  useEffect(() => {
    let active = true;
    getCreatorProfile().then((value) => { if (active) setProfile(value); })
      .catch((error) => { console.warn('Profile loading error:', error); Alert.alert('Profile unavailable', 'Could not load your saved profile.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => {
    refreshWorkspace().catch((error) => console.warn('Profile workspace loading error:', error));
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

  const chooseImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Allow photo library access to choose a profile image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const pickedUri = result.assets[0].uri;
      const extension = pickedUri.split('.').pop()?.split('?')[0] || 'jpg';
      const destination = `${FileSystem.documentDirectory}creator_profile_${Date.now()}.${extension}`;
      await FileSystem.copyAsync({ from: pickedUri, to: destination });
      setProfile((current) => ({ ...current, imageUri: destination }));
    } catch (error) {
      console.warn('Profile image selection error:', error);
      Alert.alert('Image unavailable', 'Could not save the selected image on this device.');
    }
  };

  const saveProfile = async () => {
    if (!profile.name.trim()) return Alert.alert('Creator name required', 'Enter a creator name before saving.');
    setSaving(true);
    try {
      setProfile(await saveCreatorProfile(profile));
      Alert.alert('Profile saved', 'Your profile is stored on this device.');
    } catch (error) {
      console.warn('Profile save error:', error);
      Alert.alert('Could not save profile', 'Please try again.');
    } finally { setSaving(false); }
  };

  const navRow = (icon, title, subtitle, onPress, last = false) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.navRow, { borderBottomColor: colors.border }, last && styles.lastRow]}>
      <View style={[styles.navIcon, { backgroundColor: colors.primaryLight }]}><Ionicons name={icon} size={19} color={colors.primary} /></View>
      <View style={styles.navCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>{subtitle ? <Text style={[styles.description, { color: colors.textSecondary }]}>{subtitle}</Text> : null}</View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable>
          <View style={{ flex: 1 }}><Text style={[styles.eyebrow, { color: colors.textSecondary }]}>YOUR CREATOR WORKSPACE</Text><Text style={[styles.title, { color: colors.text }]}>Profile</Text></View>
        </View>
        {loading ? <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.textSecondary, marginTop: 10 }}>Loading your profile...</Text></View> : <>
          <GlassCard padding={17} style={styles.card}>
            <View style={styles.identity}><Image source={require('../../assets/icon.png')} style={styles.appIcon} /><View style={{ flex: 1 }}><Text style={[styles.identityTitle, { color: colors.text }]}>CreatorStudio</Text><Text style={[styles.description, { color: colors.textSecondary }]}>Your personal content workspace</Text></View></View>
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>CURRENT WORKSPACE</Text>
            <Pressable accessibilityRole="button" onPress={() => setPickerVisible(true)} style={[styles.workspace, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.workspaceIcon, { backgroundColor: colors.primaryLight }]}>{selectedChannel?.profile_image_uri ? <Image source={{ uri: selectedChannel.profile_image_uri }} style={styles.workspaceImage} /> : <Ionicons name={selectedChannel ? 'logo-youtube' : 'apps-outline'} size={20} color={colors.primary} />}</View>
              <View style={{ flex: 1 }}><Text style={[styles.rowTitle, { color: colors.text }]}>{selectedChannel?.name || 'All Channels'}</Text><Text style={[styles.description, { color: colors.textMuted }]}>Tap to switch channel workspace</Text></View>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
            {navRow('people-outline', 'Manage Channels', 'Add or organize your channels', () => navigation.navigate('ManageChannels'), true)}
          </GlassCard>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Creator profile</Text>
          <GlassCard padding={17} style={styles.card}>
            <View style={styles.profileTop}>
              <Pressable accessibilityRole="button" accessibilityLabel="Choose profile image" onPress={chooseImage} style={[styles.avatar, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>{profile.imageUri ? <Image source={{ uri: profile.imageUri }} style={styles.avatarImage} /> : <Ionicons name="person-outline" size={30} color={colors.primary} />}<View style={[styles.photoBadge, { backgroundColor: colors.primary }]}><Ionicons name="camera-outline" size={13} color="#fff" /></View></Pressable>
              <View style={{ flex: 1, marginLeft: 13 }}><Text style={[styles.rowTitle, { color: colors.text }]}>{profile.name || 'Your creator profile'}</Text><Text style={[styles.description, { color: colors.textSecondary }]}>Tap the photo to choose an image</Text></View>
            </View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>CREATOR NAME</Text>
            <TextInput accessibilityLabel="Creator name" value={profile.name} onChangeText={(name) => setProfile((current) => ({ ...current, name }))} placeholder="Your name or channel identity" placeholderTextColor={colors.textMuted} maxLength={50} style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} />
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 15 }]}>SHORT BIO</Text>
            <TextInput accessibilityLabel="Short bio" value={profile.bio} onChangeText={(bio) => setProfile((current) => ({ ...current, bio }))} placeholder="A few words about your creative work" placeholderTextColor={colors.textMuted} maxLength={180} multiline textAlignVertical="top" style={[styles.input, styles.bio, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} />
            <Text style={[styles.count, { color: colors.textMuted }]}>{profile.bio.length}/180</Text>
            <Pressable accessibilityRole="button" disabled={saving} onPress={saveProfile} style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.65 : 1 }]}>{saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark-circle-outline" size={19} color="#fff" />}<Text style={styles.saveText}>{saving ? 'Saving...' : 'Save profile'}</Text></Pressable>
          </GlassCard>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>App</Text>
          <GlassCard padding={17} style={styles.card}>
            {navRow('settings-outline', 'Settings', 'Appearance, reminders, preferences and data', () => navigation.navigate('Settings'), true)}
          </GlassCard>
        </>}
      </ScrollView>
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={closePicker}>
        <Pressable style={styles.overlay} onPress={closePicker}><Pressable style={[styles.modal, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={styles.modalHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>Switch workspace</Text><Pressable accessibilityRole="button" onPress={closePicker} hitSlop={10}><Ionicons name="close" size={22} color={colors.textSecondary} /></Pressable></View>
          <ScrollView>
            {[{ id: null, name: 'All Channels' }, ...channels].map((channel) => <Pressable key={String(channel.id)} onPress={() => switchWorkspace(channel.id)} style={[styles.option, { borderBottomColor: colors.border }]}><View style={[styles.workspaceIcon, { backgroundColor: colors.primaryLight }]}>{channel.profile_image_uri ? <Image source={{ uri: channel.profile_image_uri }} style={styles.workspaceImage} /> : <Ionicons name={channel.id === null ? 'apps-outline' : 'logo-youtube'} size={20} color={colors.primary} />}</View><Text numberOfLines={1} style={[styles.rowTitle, { color: colors.text, flex: 1 }]}>{channel.name}</Text>{channelId === channel.id ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}</Pressable>)}
          </ScrollView>
        </Pressable></Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 }, back: { width: 43, height: 43, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 13 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.6 }, title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginTop: 3 },
  card: { marginBottom: 22, borderRadius: 20 }, identity: { flexDirection: 'row', alignItems: 'center', gap: 12 }, appIcon: { width: 50, height: 50, borderRadius: 15 }, identityTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 7 }, workspace: { minHeight: 62, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 9, gap: 10, marginBottom: 5 }, workspaceIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, workspaceImage: { width: '100%', height: '100%' },
  rowTitle: { fontSize: 13, fontWeight: '800' }, description: { fontSize: 11, lineHeight: 16, marginTop: 4 }, navRow: { minHeight: 64, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 }, lastRow: { borderBottomWidth: 0 }, navIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, navCopy: { flex: 1 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 }, profileTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, avatar: { width: 70, height: 70, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, avatarImage: { width: '100%', height: '100%' }, photoBadge: { position: 'absolute', right: 3, bottom: 3, width: 23, height: 23, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  input: { minHeight: 47, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, fontSize: 13 }, bio: { minHeight: 88, maxHeight: 130 }, count: { textAlign: 'right', fontSize: 9, marginTop: 5 }, saveButton: { height: 48, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 15 }, saveText: { color: '#fff', fontSize: 13, fontWeight: '800' }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }, modal: { maxHeight: '72%', minHeight: '35%', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28 }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, option: { minHeight: 59, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
});
