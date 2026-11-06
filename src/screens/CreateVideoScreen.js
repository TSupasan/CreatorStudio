
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
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import GlassCard from '../components/GlassCard';
import { getAllChannels } from '../database/repositories/channelRepository';
import { addVideo } from '../database/repositories/videoRepository';

const STATUSES = ['Idea', 'Planning', 'Editing', 'Ready to Publish'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export default function CreateVideoScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [status, setStatus] = useState('Idea');
  const [priority, setPriority] = useState('Medium');

  const [saving, setSaving] = useState(false);

  const loadChannels = async () => {
    try {
      const data = await getAllChannels();
      setChannels(data);

      if (data.length > 0) {
        setSelectedChannel((current) => {
          if (current && data.some((channel) => channel.id === current.id)) {
            return current;
          }
          return data[0];
        });
      } else {
        setSelectedChannel(null);
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadChannels();
    }, [])
  );

  const handleSave = async () => {
    if (!selectedChannel) {
      Alert.alert('Channel Required', 'Please create and select a channel first.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter your video title.');
      return;
    }

    if (
      uploadDate.trim() &&
      !/^\d{4}-\d{2}-\d{2}$/.test(uploadDate.trim())
    ) {
      Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format.');
      return;
    }

    setSaving(true);

    try {
      await addVideo({
        channel_id: selectedChannel.id,
        title: title.trim(),
        description: description.trim(),
        upload_date: uploadDate.trim() || null,
        status,
        priority,
        thumbnail_uri: null,
      });

      Alert.alert('Project Created', 'Your video project was saved successfully.');

      setTitle('');
      setDescription('');
      setUploadDate('');
      setStatus('Idea');
      setPriority('Medium');

      navigation.navigate('Videos');
    } catch (error) {
      console.error('Failed to save video:', error);
      Alert.alert('Error', 'Could not save your video project. Please try again.');
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
          BUILD YOUR NEXT IDEA
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>
          Create Project
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Plan your next video and keep everything organized.
        </Text>

        <GlassCard style={styles.formCard}>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="logo-youtube" size={19} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Select Channel
            </Text>
          </View>

          {channels.length === 0 ? (
            <View style={[styles.emptyChannel, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="alert-circle-outline" size={22} color={colors.warning} />
              <Text style={[styles.emptyChannelText, { color: colors.textSecondary }]}>
                No channels available. Please create a channel first.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Channels')}
                style={[styles.createChannelButton, { backgroundColor: colors.primary }]}
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
                        backgroundColor: active ? colors.primaryLight : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
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
                      <Ionicons name="checkmark-circle" size={19} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </GlassCard>

        <GlassCard style={styles.formCard}>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="videocam-outline" size={19} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Video Information
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Video Title *</Text>
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

          <Text style={[styles.label, { color: colors.text }]}>Description / Notes</Text>
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

          <Text style={[styles.label, { color: colors.text }]}>
            Planned Upload Date
          </Text>
          <View
            style={[
              styles.dateInputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="calendar-outline" size={19} color={colors.textMuted} />
            <TextInput
              value={uploadDate}
              onChangeText={setUploadDate}
              placeholder="YYYY-MM-DD (Optional)"
              placeholderTextColor={colors.textMuted}
              style={[styles.dateInput, { color: colors.text }]}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.formCard}>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="options-outline" size={19} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Project Settings
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Project Status</Text>
          {renderOptions(STATUSES, status, setStatus)}

          <Text style={[styles.label, { color: colors.text }]}>Priority Level</Text>
          {renderOptions(PRIORITIES, priority, setPriority)}
        </GlassCard>

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
          <Ionicons name="add-circle-outline" size={21} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving Project...' : 'Create Video Project'}
          </Text>
        </TouchableOpacity>

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
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
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
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 15,
  },
});
