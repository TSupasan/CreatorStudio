import React, { useCallback, useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import Text from '../components/ThemedText';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import GlassCard from '../components/GlassCard';
import { getVideoById, deleteVideo } from '../database/repositories/videoRepository';
import { getTasksByVideoId, updateTaskStatus, getVideoProgress } from '../database/repositories/taskRepository';
import { cancelVideoReminder } from '../services/notificationService';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { formatStoredDateTime } from '../utils/datePreferences';

function countdown(video) {
  if (video.status === 'Published') return 'Already published';
  if (!video.upload_date) return 'No release date scheduled';
  const time = video.upload_time || '23:59';
  const target = new Date(`${video.upload_date}T${time}:00`);
  const diff = target.getTime() - Date.now();
  if (Number.isNaN(target.getTime())) return 'No release date scheduled';
  if (diff < 0) return 'Release time has passed';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${days} days · ${hours} hours · ${minutes} minutes`;
}

export default function VideoDetailsScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { preferences } = useAppPreferences();
  const { videoId } = route.params;
  const [video, setVideo] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const videoData = await getVideoById(videoId);
      setVideo(videoData);
      if (videoData) {
        const [taskData, progressData] = await Promise.all([
          getTasksByVideoId(videoId),
          getVideoProgress(videoId),
        ]);
        setTasks(taskData);
        setProgress(progressData);
      }
    } catch (error) {
      console.error('Video details error:', error);
      Alert.alert('Error', 'Unable to load video details.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadDetails(); }, [videoId]));

  const toggleTask = async (task) => {
    if (updatingTaskId !== null) return;
    try {
      setUpdatingTaskId(task.id);
      await updateTaskStatus(task.id, task.is_completed !== 1);
      const [taskData, progressData] = await Promise.all([
        getTasksByVideoId(videoId),
        getVideoProgress(videoId),
      ]);
      setTasks(taskData);
      setProgress(progressData);
    } catch (error) {
      Alert.alert('Error', 'Could not update this task.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Project', `Delete "${video.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteVideo(videoId);
          try {
            await cancelVideoReminder(videoId);
          } catch (notificationError) {
            console.warn('Notification cancellation error:', notificationError);
          }
          navigation.goBack();
        } catch (error) {
          Alert.alert('Error', 'Could not delete this project.');
        }
      }},
    ]);
  };

  if (loading) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primaryText} /></View>;
  if (!video) return <View style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.text }}>Video not found.</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: colors.surface }]}><Ionicons name="arrow-back" size={21} color={colors.text} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Video Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <GlassCard padding={0}>
          <View style={[styles.hero, { backgroundColor: colors.surfaceSecondary }]}>
            {video.thumbnail_uri ? <Image source={{ uri: video.thumbnail_uri }} style={styles.heroImage} /> : <Ionicons name="videocam-outline" size={45} color={colors.textMuted} />}
          </View>
          <View style={{ padding: 17 }}>
            <Text style={[styles.title, { color: colors.text }]}>{video.title}</Text>
            <Text style={[styles.channel, { color: colors.textSecondary }]}>{video.channel_name}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{video.description || 'No description added yet.'}</Text>
          </View>
        </GlassCard>

        <Text style={[styles.section, { color: colors.text }]}>Release Countdown</Text>
        <GlassCard>
          <View style={styles.inline}>
            <Ionicons name="time-outline" size={21} color={colors.primaryText} />
            <Text style={[styles.countdown, { color: colors.text }]}>{countdown(video)}</Text>
          </View>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {video.upload_date ? `Planned: ${formatStoredDateTime(video.upload_date, video.upload_time, preferences)}` : 'Set a release date by editing this project.'}
          </Text>
        </GlassCard>

        <Text style={[styles.section, { color: colors.text }]}>Project Information</Text>
        <GlassCard>
          <InfoRow label="Status" value={video.status} colors={colors} />
          <InfoRow label="Priority" value={video.priority} colors={colors} />
          <InfoRow label="Created" value={video.created_at || 'Unknown'} colors={colors} />
        </GlassCard>

        <Text style={[styles.section, { color: colors.text }]}>Editing Progress</Text>
        <GlassCard>
          <View style={styles.inlineBetween}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Overall Progress</Text>
            <Text style={{ color: colors.primaryText, fontSize: 20, fontWeight: '900' }}>{progress.percentage}%</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={[styles.fill, { width: `${progress.percentage}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{progress.completed} of {progress.total} selected tasks completed</Text>
        </GlassCard>

        <Text style={[styles.section, { color: colors.text }]}>Your Editing Tasks</Text>
        <GlassCard>
          {tasks.length === 0 ? <Text style={{ color: colors.textSecondary }}>No tasks selected. Edit this project to add tasks.</Text> : tasks.map((task, index) => {
            const completed = task.is_completed === 1;
            return <TouchableOpacity key={task.id} disabled={updatingTaskId === task.id} onPress={() => toggleTask(task)} style={[styles.task, index !== tasks.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <Ionicons name={completed ? 'checkbox' : 'square-outline'} size={23} color={completed ? colors.success : colors.textMuted} />
              <Text style={[styles.taskText, { color: completed ? colors.textMuted : colors.text, textDecorationLine: completed ? 'line-through' : 'none' }]}>{task.task_name}</Text>
              {updatingTaskId === task.id && <ActivityIndicator size="small" color={colors.primaryText} />}
            </TouchableOpacity>;
          })}
          {progress.total > 0 && progress.percentage === 100 && <Text style={{ color: colors.success, fontWeight: '800', marginTop: 12 }}>All selected tasks completed!</Text>}
        </GlassCard>

        <TouchableOpacity onPress={() => navigation.navigate('EditVideo', { videoId: video.id })} style={[styles.editButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="create-outline" size={19} color={colors.onPrimary} /><Text style={[styles.buttonText, { color: colors.onPrimary }]}>Edit Project</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={[styles.deleteButton, { borderColor: colors.danger }]}>
          <Ionicons name="trash-outline" size={19} color={colors.danger} /><Text style={{ color: colors.danger, fontWeight: '800' }}>Delete Project</Text>
        </TouchableOpacity>
        <View style={{ height: 35 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, colors }) {
  return <View style={styles.infoRow}><Text style={{ color: colors.textSecondary }}>{label}</Text><Text style={{ color: colors.text, fontWeight: '700', textAlign: 'right', flexShrink: 1 }}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginTop: 55, marginBottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '800' },
  hero: { height: 190, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  title: { fontSize: 21, fontWeight: '900' },
  channel: { fontSize: 13, marginTop: 7 },
  description: { fontSize: 13, lineHeight: 21, marginTop: 13 },
  section: { fontSize: 17, fontWeight: '800', marginTop: 24, marginBottom: 12 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inlineBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  countdown: { fontSize: 15, fontWeight: '800', flex: 1 },
  meta: { fontSize: 12, marginTop: 11 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  track: { height: 9, borderRadius: 9, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 9 },
  task: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
  taskText: { flex: 1, fontSize: 14, fontWeight: '600' },
  editButton: { minHeight: 51, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9, marginTop: 24 },
  deleteButton: { minHeight: 51, borderRadius: 15, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9, marginTop: 11 },
  buttonText: { fontWeight: '800' },
});
