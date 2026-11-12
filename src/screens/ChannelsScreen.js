
import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import Text from '../components/ThemedText';
import TextInput from '../components/ThemedTextInput';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import GlassCard from '../components/GlassCard';

import {
  getAllChannels,
  addChannel,
  updateChannel,
  deleteChannel,
} from '../database/repositories/channelRepository';
import { useWorkspace } from '../context/WorkspaceContext';

export default function ChannelsScreen({ navigation }) {
  const { colors } = useTheme();
  const { refreshWorkspace } = useWorkspace();

  const [channels, setChannels] = useState([]);
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [profileImageUri, setProfileImageUri] = useState(null);

  const loadChannels = async () => {
    try {
      const data = await getAllChannels();
      setChannels(data);
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadChannels();
      refreshWorkspace().catch((error) => console.error('Workspace refresh error:', error));
    }, [refreshWorkspace])
  );

  const resetForm = () => {
    setChannelName('');
    setDescription('');
    setEditingChannelId(null);
    setProfileImageUri(null);
  };

  const handleAddChannel = async () => {
    if (!channelName.trim()) {
      Alert.alert('Missing Name', 'Please enter a channel name.');
      return;
    }

    try {
      if (editingChannelId !== null) {
        await updateChannel(
          editingChannelId,
          channelName.trim(),
          description.trim(),
          profileImageUri
        );

        Alert.alert('Success', 'Channel updated successfully!');
      } else {
        await addChannel(channelName.trim(), description.trim(), profileImageUri);

        Alert.alert('Success', 'Channel added successfully!');
      }

      resetForm();
      await loadChannels();
      await refreshWorkspace();
    } catch (error) {
      Alert.alert('Error', 'Could not save channel.');
      console.error(error);
    }
  };

  const handleEditChannel = (item) => {
    setChannelName(item.name);
    setDescription(item.description || '');
    setEditingChannelId(item.id);
    setProfileImageUri(item.profile_image_uri || null);
  };

  const chooseChannelLogo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Allow photo access to choose a channel logo.');
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
      const destination = `${FileSystem.documentDirectory}channel_logo_${Date.now()}.${extension}`;
      await FileSystem.copyAsync({ from: pickedUri, to: destination });
      setProfileImageUri(destination);
    } catch (error) {
      console.error('Channel logo selection error:', error);
      Alert.alert('Image unavailable', 'Could not save the selected channel logo.');
    }
  };

  const handleDeleteChannel = (id) => {
    Alert.alert(
      'Delete Channel',
      'Are you sure you want to delete this channel and its related videos?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChannel(id);
              await refreshWorkspace();

              if (editingChannelId === id) {
                resetForm();
              }

              await loadChannels();
            } catch (error) {
              Alert.alert('Error', 'Could not delete channel.');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const renderChannel = ({ item }) => (
    <GlassCard style={styles.channelCard}>
      <View style={styles.channelRow}>
        <View style={[styles.channelIcon, { backgroundColor: colors.primaryLight }]}>
          {item.profile_image_uri
            ? <Image source={{ uri: item.profile_image_uri }} style={styles.channelLogo} />
            : <Ionicons name="logo-youtube" size={25} color={colors.primaryOnLight} />}
        </View>

        <View style={styles.channelInfo}>
          <Text style={[styles.channelName, { color: colors.text }]}>
            {item.name}
          </Text>

          <Text
            style={[
              styles.channelDescription,
              { color: colors.textSecondary },
            ]}
          >
            {item.description || 'No description added'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handleEditChannel(item)}
          style={styles.actionButton}
        >
          <Ionicons name="create-outline" size={20} color={colors.primaryText} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeleteChannel(item.id)}
          style={styles.actionButton}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={channels}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChannel}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back to Profile" onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.eyebrow, { color: colors.primaryText }]}>
              YOUR CONTENT NETWORK
            </Text>

            <Text style={[styles.title, { color: colors.text }]}>
              My Channels
            </Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage all your creative channels in one place.
            </Text>

            <GlassCard style={styles.formCard}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {editingChannelId !== null
                  ? 'Edit Channel'
                  : 'Add New Channel'}
              </Text>

              <TextInput
                value={channelName}
                onChangeText={setChannelName}
                placeholder="Enter channel name"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
              />

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Channel description (optional)"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  styles.descriptionInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
                multiline
              />

              <View style={styles.logoRow}>
                <View style={[styles.logoPreview, { backgroundColor: colors.primaryLight }]}>
                  {profileImageUri
                    ? <Image source={{ uri: profileImageUri }} style={styles.channelLogo} />
                    : <Ionicons name="logo-youtube" size={22} color={colors.primaryOnLight} />}
                </View>
                <View style={styles.logoActions}>
                  <TouchableOpacity onPress={chooseChannelLogo} style={[styles.logoButton, { borderColor: colors.border }]}>
                    <Text style={[styles.logoButtonText, { color: colors.primaryText }]}>{profileImageUri ? 'Change logo' : 'Add channel logo'}</Text>
                  </TouchableOpacity>
                  {profileImageUri ? <TouchableOpacity onPress={() => setProfileImageUri(null)} style={styles.removeLogoButton}><Text style={[styles.logoButtonText, { color: colors.danger }]}>Remove</Text></TouchableOpacity> : null}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleAddChannel}
                style={[
                  styles.addButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons
                  name={editingChannelId !== null ? 'save-outline' : 'add'}
                  size={21}
                  color={colors.onPrimary}
                />

                <Text style={[styles.addButtonText, { color: colors.onPrimary }]}>
                  {editingChannelId !== null
                    ? 'Update Channel'
                    : 'Add Channel'}
                </Text>
              </TouchableOpacity>

              {editingChannelId !== null && (
                <TouchableOpacity
                  onPress={resetForm}
                  style={styles.cancelButton}
                >
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                    Cancel Editing
                  </Text>
                </TouchableOpacity>
              )}
            </GlassCard>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Channels
              </Text>

              <Text style={[styles.count, { color: colors.primaryText }]}>
                {channels.length} CHANNELS
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="logo-youtube"
              size={38}
              color={colors.textMuted}
            />

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No channels yet
            </Text>

            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Add your first channel to get started.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 130,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 25,
    lineHeight: 21,
  },
  formCard: {
    marginBottom: 28,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    marginBottom: 12,
  },
  descriptionInput: {
    minHeight: 75,
    textAlignVertical: 'top',
  },
  addButton: {
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingTop: 13,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  count: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  channelCard: {
    marginBottom: 12,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  channelLogo: { width: '100%', height: '100%' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 13 },
  logoPreview: { width: 54, height: 54, borderRadius: 17, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  logoActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoButton: { minHeight: 38, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, justifyContent: 'center' },
  logoButtonText: { fontSize: 11, fontWeight: '700' },
  removeLogoButton: { padding: 8 },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '700',
  },
  channelDescription: {
    fontSize: 12,
    marginTop: 5,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    marginTop: 6,
  },
});
