
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import GlassCard from '../components/GlassCard';
import { getDatabase } from '../database/database';
import { getAllChannels } from '../database/repositories/channelRepository';
import {
  addVideo,
  updateVideo,
} from '../database/repositories/videoRepository';

const STATUSES = [
  'Idea',
  'Planning',
  'Editing',
  'Ready to Publish',
  'Published',
];

const PRIORITIES = ['Low', 'Medium', 'High'];

export default function CreateVideoScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();

  const videoId = route?.params?.videoId;

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [uploadDate, setUploadDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [status, setStatus] = useState('Idea');
  const [priority, setPriority] = useState('Medium');

  const [saving, setSaving] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);

  const isEditing = Boolean(videoId);

  const resetForm = () => {
    setSelectedChannel(channels.length > 0 ? channels[0] : null);
    setTitle('');
    setDescription('');
    setUploadDate(null);
    setShowDatePicker(false);
    setStatus('Idea');
    setPriority('Medium');
  };

  const loadScreenData = async () => {
    try {
      const channelData = await getAllChannels();
      setChannels(channelData);

      if (videoId) {
        setLoadingProject(true);

        const db = await getDatabase();

        const video = await db.getFirstAsync(
          'SELECT * FROM videos WHERE id = ?',
          [Number(videoId)]
        );

        if (!video) {
          Alert.alert('Project Not Found', 'This video project could not be found.');
          return;
        }

        const matchingChannel = channelData.find(
          (channel) => channel.id === video.channel_id
        );

        setSelectedChannel(matchingChannel || null);
        setTitle(video.title || '');
        setDescription(video.description || '');
        setStatus(video.status || 'Idea');
        setPriority(video.priority || 'Medium');

        if (video.upload_date) {
          const parts = video.upload_date.split('-');

          if (parts.length === 3) {
            setUploadDate(
              new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2])
              )
            );
          } else {
            setUploadDate(null);
          }
        } else {
          setUploadDate(null);
        }
      } else {
        setSelectedChannel(channelData[0] || null);
        setTitle('');
        setDescription('');
        setUploadDate(null);
        setShowDatePicker(false);
        setStatus('Idea');
        setPriority('Medium');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      Alert.alert('Error', 'Could not load project information.');
    } finally {
      setLoadingProject(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadScreenData();
    }, [videoId])
  );

  const formatDisplayDate = (date) => {
    if (!date) return 'Select upload date';

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDatabaseDate = (date) => {
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      setUploadDate(selectedDate);
    }

    if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const handleSave = async () => {
    if (!selectedChannel) {
      Alert.alert(
        'Channel Required',
        'Please create and select a channel first.'
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter your video title.');
      return;
    }

    setSaving(true);

    const videoData = {
      channel_id: selectedChannel.id,
      title: title.trim(),
      description: description.trim(),
      upload_date: formatDatabaseDate(uploadDate),
      status,
      priority,
      thumbnail_uri: null,
    };

    try {
      if (isEditing) {
        await updateVideo(Number(videoId), videoData);

        Alert.alert(
          'Project Updated',
          'Your video project was updated successfully.'
        );
      } else {
        await addVideo(videoData);

        Alert.alert(
          'Project Created',
          'Your video project was saved successfully.'
        );
      }

      setTitle('');
      setDescription('');
      setUploadDate(null);
      setShowDatePicker(false);
      setStatus('Idea');
      setPriority('Medium');

      navigation.setParams({ videoId: undefined });
      navigation.navigate('MainTabs', {
        screen: 'Videos',
      });
    } catch (error) {
      console.error('Failed to save video:', error);

      Alert.alert(
        'Error',
        'Could not save your video project. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const renderOptions = (options, selected, onSelect) => (
    <View style={styles.optionsContainer}>
      {options.map((option) => {
        const active = selected === option;

        return (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            style={[
              styles.optionChip,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.optionText,
                { color: active ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (loadingProject) {
    return (
      <View style={[
        styles.loadingContainer,
        { backgroundColor: colors.background },
      ]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
          Loading project...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          {isEditing ? 'UPDATE YOUR PROJECT' : 'BUILD YOUR NEXT IDEA'}
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>
          {isEditing ? 'Edit Project' : 'Create Project'}
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isEditing
            ? 'Update your video information and project settings.'
            : 'Plan your next video and keep everything organized.'}
        </Text>

        {/* CHANNEL SELECTION */}
        <GlassCard style={styles.formCard}>
          <View style={styles.sectionHeading}>
            <View style={[
              styles.sectionIcon,
              { backgroundColor: colors.primaryLight },
            ]}>
              <Ionicons name="logo-youtube" size={19} color={colors.primary} />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Select Channel
            </Text>
          </View>

          {channels.length === 0 ? (
            <View style={[
              styles.emptyChannel,
              { backgroundColor: colors.surfaceSecondary },
            ]}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color={colors.warning}
              />

              <Text style={[
                styles.emptyChannelText,
                { color: colors.textSecondary },
              ]}>
                No channels available. Please create a channel first.
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('Channels')}
                style={[
                  styles.createChannelButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.createChannelText}>Go to Channels</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.channelList}>
              {channels.map((channel) => {
                const active = selectedChannel?.id === channel.id;

                return (
                  <TouchableOpacity
                    key={channel.id}
                    onPress={() => setSelectedChannel(channel)}
                    style={[
                      styles.channelOption,
                      {
                        backgroundColor: active
                          ? colors.primaryLight
                          : colors.surface,
                        borderColor: active
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="logo-youtube"
                      size={18}
                      color={active ? colors.primary : colors.textSecondary}
                    />

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.channelOptionText,
                        { color: active ? colors.primary : colors.text },
                      ]}
                    >
                      {channel.name}
                    </Text>

                    {active && (
                      <Ionicons
                        name="checkmark-circle"
                        size={19}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </GlassCard>

        {/* VIDEO INFORMATION */}
        <GlassCard style={styles.formCard}>
          <View style={styles.sectionHeading}>
            <View style={[
              styles.sectionIcon,
              { backgroundColor: colors.primaryLight },
            ]}>
              <Ionicons
                name="videocam-outline"
                size={19}
                color={colors.primary}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Video Information
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>
            Video Title *
          </Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter your video title"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          />

          <Text style={[styles.label, { color: colors.text }]}>
            Description / Notes
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Write your video ideas or notes..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.descriptionInput,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          />

          {/* DATE PICKER */}
          <Text style={[styles.label, { color: colors.text }]}>
            Planned Upload Date
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateInputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.primary}
            />

            <Text
              style={[
                styles.dateDisplay,
                {
                  color: uploadDate ? colors.text : colors.textMuted,
                },
              ]}
            >
              {formatDisplayDate(uploadDate)}
            </Text>

            <Ionicons
              name="chevron-down"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {uploadDate && (
            <TouchableOpacity
              onPress={() => setUploadDate(null)}
              style={styles.clearDateButton}
            >
              <Ionicons
                name="close-circle-outline"
                size={15}
                color={colors.danger}
              />
              <Text style={[styles.clearDateText, { color: colors.danger }]}>
                Clear date
              </Text>
            </TouchableOpacity>
          )}

          {showDatePicker && (
            <View style={[
              styles.datePickerWrapper,
              { backgroundColor: colors.surfaceSecondary },
            ]}>
              <DateTimePicker
                value={uploadDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleDateChange}
                themeVariant={isDark ? 'dark' : 'light'}
              />

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={[
                    styles.dateDoneButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.dateDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </GlassCard>

        {/* PROJECT SETTINGS */}
        <GlassCard style={styles.formCard}>
          <View style={styles.sectionHeading}>
            <View style={[
              styles.sectionIcon,
              { backgroundColor: colors.primaryLight },
            ]}>
              <Ionicons
                name="options-outline"
                size={19}
                color={colors.primary}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Project Settings
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>
            Project Status
          </Text>

          {renderOptions(STATUSES, status, setStatus)}

          <Text style={[styles.label, { color: colors.text }]}>
            Priority Level
          </Text>

          {renderOptions(PRIORITIES, priority, setPriority)}
        </GlassCard>

        {/* SAVE / UPDATE BUTTON */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || channels.length === 0}
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.primary,
              opacity: saving || channels.length === 0 ? 0.5 : 1,
            },
          ]}
        >
          <Ionicons
            name={isEditing ? 'save-outline' : 'add-circle-outline'}
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.saveButtonText}>
            {saving
              ? 'Saving Project...'
              : isEditing
                ? 'Update Video Project'
                : 'Create Video Project'}
          </Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.cancelButton,
              { borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
              Cancel Editing
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Your project is saved locally on this device.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 130,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },

  heading: {
    fontSize: 30,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 25,
  },

  formCard: {
    marginBottom: 17,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 20,
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 9,
    marginTop: 7,
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 17,
  },

  descriptionInput: {
    minHeight: 105,
  },

  dateInputContainer: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },

  dateDisplay: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },

  clearDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 5,
    paddingVertical: 5,
    marginBottom: 10,
  },

  clearDateText: {
    fontSize: 12,
    fontWeight: '600',
  },

  datePickerWrapper: {
    borderRadius: 16,
    padding: 10,
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'center',
  },

  dateDoneButton: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  dateDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  channelList: {
    gap: 10,
  },

  channelOption: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  channelOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },

  emptyChannel: {
    borderRadius: 14,
    padding: 15,
    gap: 10,
  },

  emptyChannelText: {
    fontSize: 13,
    lineHeight: 20,
  },

  createChannelButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },

  createChannelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 18,
  },

  optionChip: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  optionText: {
    fontSize: 12,
    fontWeight: '600',
  },

  saveButton: {
    minHeight: 55,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 5,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  cancelButton: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  footerText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 15,
  },
});
