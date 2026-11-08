import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import GlassCard from '../components/GlassCard';
import { getDatabase } from '../database/database';
import { getAllChannels } from '../database/repositories/channelRepository';
import { addVideo, updateVideo } from '../database/repositories/videoRepository';
import {
  getTasksByVideoId,
  saveVideoTasks,
  replaceVideoTasks,
} from '../database/repositories/taskRepository';

const STATUSES = ['Idea', 'Planning', 'Editing', 'Ready to Publish', 'Published'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const TASK_OPTIONS = [
  'Script Writing', 'Research', 'Video Recording', 'Video Editing',
  'Audio Editing', 'Color Grading', 'Thumbnail Designing',
  'Title & Description', 'Subtitles', 'Final Review',
];

export default function CreateVideoScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const videoId = route?.params?.videoId;
  const isEditing = Boolean(videoId);

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadDate, setUploadDate] = useState(null);
  const [uploadTime, setUploadTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [status, setStatus] = useState('Idea');
  const [priority, setPriority] = useState('Medium');
  const [thumbnailUri, setThumbnailUri] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [customTask, setCustomTask] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);

  const formatDate = (date) => {
    if (!date) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatTime = (date) =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  const loadScreenData = async () => {
    try {
      const channelData = await getAllChannels();
      setChannels(channelData);

      if (videoId) {
        setLoadingProject(true);
        const db = await getDatabase();
        const video = await db.getFirstAsync('SELECT * FROM videos WHERE id = ?', [Number(videoId)]);
        if (!video) {
          Alert.alert('Project Not Found', 'This video project could not be found.');
          return;
        }

        setSelectedChannel(channelData.find((channel) => channel.id === video.channel_id) || null);
        setTitle(video.title || '');
        setDescription(video.description || '');
        setStatus(video.status || 'Idea');
        setPriority(video.priority || 'Medium');
        setThumbnailUri(video.thumbnail_uri || null);

        if (video.upload_date) {
          const [year, month, day] = video.upload_date.split('-').map(Number);
          setUploadDate(new Date(year, month - 1, day));
        } else setUploadDate(null);

        if (video.upload_time) {
          const [hour, minute] = video.upload_time.split(':').map(Number);
          const time = new Date();
          time.setHours(hour, minute, 0, 0);
          setUploadTime(time);
        }

        const savedTasks = await getTasksByVideoId(Number(videoId));
        setSelectedTasks(savedTasks.map((task) => task.task_name));
      } else {
        setSelectedChannel(channelData[0] || null);
        setTitle('');
        setDescription('');
        setUploadDate(null);
        setUploadTime(new Date());
        setStatus('Idea');
        setPriority('Medium');
        setThumbnailUri(null);
        setSelectedTasks([]);
      }
    } catch (error) {
      console.error('Load project error:', error);
      Alert.alert('Error', 'Could not load project information.');
    } finally {
      setLoadingProject(false);
    }
  };

  useFocusEffect(useCallback(() => { loadScreenData(); }, [videoId]));

  const toggleTask = (name) => {
    setSelectedTasks((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
    );
  };

  const addCustomTask = () => {
    const name = customTask.trim();
    if (!name) return;
    if (selectedTasks.some((task) => task.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Already added', 'This task is already selected.');
      return;
    }
    setSelectedTasks((current) => [...current, name]);
    setCustomTask('');
  };

  const chooseThumbnail = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to select a thumbnail.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;

      const pickedUri = result.assets[0].uri;
      const extension = pickedUri.split('.').pop()?.split('?')[0] || 'jpg';
      const destination = `${FileSystem.documentDirectory}thumbnail_${Date.now()}.${extension}`;
      await FileSystem.copyAsync({ from: pickedUri, to: destination });
      setThumbnailUri(destination);
    } catch (error) {
      console.error('Thumbnail selection error:', error);
      Alert.alert('Thumbnail error', 'Could not save the selected image.');
    }
  };

  const handleSave = async () => {
    if (!selectedChannel) {
      Alert.alert('Channel Required', 'Please create and select a channel first.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter your video title.');
      return;
    }
    if (selectedTasks.length === 0) {
      Alert.alert('Tasks Required', 'Select at least one task for this video.');
      return;
    }

    setSaving(true);
    const videoData = {
      channel_id: selectedChannel.id,
      title: title.trim(),
      description: description.trim(),
      upload_date: formatDate(uploadDate),
      upload_time: uploadDate ? formatTime(uploadTime) : null,
      status,
      priority,
      thumbnail_uri: thumbnailUri,
    };

    try {
      if (isEditing) {
        await updateVideo(Number(videoId), videoData);
        await replaceVideoTasks(Number(videoId), selectedTasks);
        Alert.alert('Project Updated', 'Your video project was updated successfully.');
      } else {
        const newVideoId = await addVideo(videoData);
        await saveVideoTasks(newVideoId, selectedTasks);
        Alert.alert('Project Created', 'Your video project was saved successfully.');
      }

      navigation.setParams({ videoId: undefined });
      navigation.navigate('MainTabs', { screen: 'Videos' });
    } catch (error) {
      console.error('Save video error:', error);
      Alert.alert('Error', 'Could not save your video project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderChips = (options, selected, onSelect) => (
    <View style={styles.chips}>
      {options.map((option) => {
        const active = selected === option;
        return (
          <TouchableOpacity key={option} onPress={() => onSelect(option)}
            style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}>
            <Text style={{ color: active ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (loadingProject) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>{isEditing ? 'UPDATE YOUR PROJECT' : 'BUILD YOUR NEXT IDEA'}</Text>
        <Text style={[styles.heading, { color: colors.text }]}>{isEditing ? 'Edit Project' : 'Create Project'}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Organize your video, tasks and release plan.</Text>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Channel</Text>
          {channels.length === 0 ? (
            <TouchableOpacity onPress={() => navigation.navigate('Channels')}><Text style={{ color: colors.primary }}>Create a channel first</Text></TouchableOpacity>
          ) : channels.map((channel) => (
            <TouchableOpacity key={channel.id} onPress={() => setSelectedChannel(channel)} style={[styles.channel, { borderColor: selectedChannel?.id === channel.id ? colors.primary : colors.border, backgroundColor: selectedChannel?.id === channel.id ? colors.primaryLight : colors.surface }]}>
              <Ionicons name="logo-youtube" color={colors.primary} size={18} />
              <Text style={{ color: colors.text, flex: 1, marginLeft: 10 }}>{channel.name}</Text>
              {selectedChannel?.id === channel.id && <Ionicons name="checkmark-circle" color={colors.primary} size={19} />}
            </TouchableOpacity>
          ))}
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Video Information</Text>
          <Text style={[styles.label, { color: colors.text }]}>Video Title *</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Enter video title" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]} />
          <Text style={[styles.label, { color: colors.text }]}>Description / Notes</Text>
          <TextInput value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder="Write your ideas or notes..." placeholderTextColor={colors.textMuted} style={[styles.input, styles.description, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]} />

          <Text style={[styles.label, { color: colors.text }]}>Thumbnail</Text>
          {thumbnailUri ? (
            <View style={[styles.thumbnailPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Image source={{ uri: thumbnailUri }} style={styles.thumbnailImage} />
              <View style={styles.thumbnailActions}>
                <TouchableOpacity
                  onPress={chooseThumbnail}
                  activeOpacity={0.8}
                  style={[styles.thumbnailActionButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                >
                  <Ionicons name="image-outline" size={17} color={colors.primary} />
                  <Text style={[styles.thumbnailActionText, { color: colors.primary }]}>Change Thumbnail</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setThumbnailUri(null)}
                  activeOpacity={0.8}
                  style={[styles.thumbnailActionButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                >
                  <Ionicons name="trash-outline" size={17} color={colors.danger} />
                  <Text style={[styles.thumbnailActionText, { color: colors.danger }]}>Remove Thumbnail</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={chooseThumbnail}
              activeOpacity={0.8}
              style={[styles.thumbnailEmpty, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
              <View style={[styles.thumbnailEmptyIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="image-outline" size={25} color={colors.primary} />
              </View>
              <Text style={{ color: colors.text, fontWeight: '700', marginTop: 9 }}>Add Thumbnail</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>Choose a 16:9 image from your gallery</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Expected Release Date</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="calendar-outline" size={19} color={colors.primary} />
            <Text style={{ color: uploadDate ? colors.text : colors.textMuted, flex: 1 }}>{uploadDate ? uploadDate.toLocaleDateString('en-GB') : 'Select date'}</Text>
            {uploadDate && <TouchableOpacity onPress={() => { setUploadDate(null); setShowTimePicker(false); }}><Ionicons name="close-circle" color={colors.danger} size={18} /></TouchableOpacity>}
          </TouchableOpacity>
          {showDatePicker && <DateTimePicker value={uploadDate || new Date()} mode="date" display="default" minimumDate={new Date(2000, 0, 1)} onChange={(event, date) => { setShowDatePicker(Platform.OS === 'ios'); if (event.type === 'set' && date) setUploadDate(date); }} />}
          {uploadDate && <>
            <Text style={[styles.label, { color: colors.text }]}>Expected Release Time</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={19} color={colors.primary} />
              <Text style={{ color: colors.text, flex: 1 }}>{formatTime(uploadTime)}</Text>
            </TouchableOpacity>
            {showTimePicker && <DateTimePicker value={uploadTime} mode="time" display="default" onChange={(event, time) => { setShowTimePicker(Platform.OS === 'ios'); if (event.type === 'set' && time) setUploadTime(time); }} />}
          </>}
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Tasks for This Video</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Select only the tasks needed for this project. You can add your own task too.</Text>
          {TASK_OPTIONS.map((task) => {
            const active = selectedTasks.includes(task);
            return <TouchableOpacity key={task} onPress={() => toggleTask(task)} style={styles.taskOption}>
              <Ionicons name={active ? 'checkbox' : 'square-outline'} size={21} color={active ? colors.primary : colors.textMuted} />
              <Text style={{ color: colors.text, marginLeft: 10, flex: 1 }}>{task}</Text>
            </TouchableOpacity>;
          })}
          <Text style={[styles.label, { color: colors.text }]}>Add Custom Task</Text>
          <View style={styles.customRow}>
            <TextInput value={customTask} onChangeText={setCustomTask} placeholder="e.g. Add intro animation" placeholderTextColor={colors.textMuted} style={[styles.input, styles.customInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]} />
            <TouchableOpacity onPress={addCustomTask} style={[styles.addButton, { backgroundColor: colors.primary }]}><Ionicons name="add" size={22} color="#fff" /></TouchableOpacity>
          </View>
          {selectedTasks.filter((task) => !TASK_OPTIONS.includes(task)).map((task) => (
            <TouchableOpacity key={task} onPress={() => toggleTask(task)} style={styles.taskOption}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
              <Text style={{ color: colors.text, marginLeft: 10 }}>{task}</Text>
            </TouchableOpacity>
          ))}
          <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 8 }}>{selectedTasks.length} tasks selected</Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Settings</Text>
          <Text style={[styles.label, { color: colors.text }]}>Status</Text>
          {renderChips(STATUSES, status, setStatus)}
          <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
          {renderChips(PRIORITIES, priority, setPriority)}
        </GlassCard>

        <TouchableOpacity disabled={saving || channels.length === 0} onPress={handleSave} style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name={isEditing ? 'save-outline' : 'add-circle-outline'} color="#fff" size={21} />}
          <Text style={styles.saveText}>{saving ? 'Saving...' : isEditing ? 'Update Video Project' : 'Create Video Project'}</Text>
        </TouchableOpacity>
        {isEditing && <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.cancelButton, { borderColor: colors.border }]}><Text style={{ color: colors.textSecondary }}>Cancel Editing</Text></TouchableOpacity>}
        <Text style={[styles.footer, { color: colors.textMuted }]}>Saved locally on this device.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 62, paddingBottom: 130 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  heading: { fontSize: 30, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 7, marginBottom: 22 },
  card: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  input: { minHeight: 49, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14, marginBottom: 12 },
  description: { minHeight: 95, paddingTop: 12 },
  channel: { minHeight: 47, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  thumbnailPreview: { borderWidth: 1, borderRadius: 15, padding: 8, overflow: 'hidden' },
  thumbnailImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: 10, resizeMode: 'cover', backgroundColor: '#222' },
  thumbnailActions: { flexDirection: 'row', gap: 9, marginTop: 10 },
  thumbnailActionButton: { flex: 1, minHeight: 43, borderWidth: 1, borderRadius: 11, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  thumbnailActionText: { fontSize: 11, fontWeight: '700' },
  thumbnailEmpty: { minHeight: 145, borderWidth: 1, borderStyle: 'dashed', borderRadius: 15, alignItems: 'center', justifyContent: 'center', padding: 16 },
  thumbnailEmptyIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pickerButton: { minHeight: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  hint: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  taskOption: { minHeight: 42, flexDirection: 'row', alignItems: 'center' },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  customInput: { flex: 1, marginBottom: 0 },
  addButton: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 },
  saveButton: { minHeight: 54, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 4 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cancelButton: { minHeight: 46, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  footer: { textAlign: 'center', fontSize: 11, marginTop: 15 },
});
