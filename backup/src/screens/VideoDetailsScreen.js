
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import GlassCard from '../components/GlassCard';
import { getDatabase } from '../database/database';
import { deleteVideo } from '../database/repositories/videoRepository';

import {
  initializeVideoTasks,
  getTasksByVideoId,
  updateTaskStatus,
  getVideoProgress,
} from '../database/repositories/taskRepository';

export default function VideoDetailsScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { videoId } = route.params;

  const [video, setVideo] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    percentage: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  useEffect(() => {
    loadVideoDetails();
  }, [videoId]);

  const loadVideoDetails = async () => {
    try {
      setLoading(true);

      const db = await getDatabase();

      const result = await db.getFirstAsync(
        `SELECT videos.*, channels.name AS channel_name
         FROM videos
         INNER JOIN channels ON videos.channel_id = channels.id
         WHERE videos.id = ?`,
        [Number(videoId)]
      );

      setVideo(result);

      if (result) {
        await initializeVideoTasks(Number(videoId));

        await loadChecklist();
      }
    } catch (error) {
      console.error('Video details error:', error);
      Alert.alert('Error', 'Unable to load video details.');
    } finally {
      setLoading(false);
    }
  };

  const loadChecklist = async () => {
    const taskData = await getTasksByVideoId(Number(videoId));
    const progressData = await getVideoProgress(Number(videoId));

    setTasks(taskData);
    setProgress(progressData);
  };

  const handleTaskToggle = async (task) => {
    if (updatingTaskId !== null) return;

    try {
      setUpdatingTaskId(task.id);

      const newStatus = task.is_completed === 1 ? 0 : 1;

      await updateTaskStatus(task.id, newStatus);

      await loadChecklist();
    } catch (error) {
      console.error('Task update error:', error);
      Alert.alert('Error', 'Could not update this task.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleSkipOptionalTask = (task) => {
    Alert.alert(
      'Skip Optional Task',
      `Do you want to skip "${task.task_name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          onPress: async () => {
            try {
              setUpdatingTaskId(task.id);

              const db = await getDatabase();

              await db.runAsync(
                'DELETE FROM tasks WHERE id = ?',
                [task.id]
              );

              await loadChecklist();
            } catch (error) {
              console.error('Skip task error:', error);
              Alert.alert('Error', 'Could not skip this task.');
            } finally {
              setUpdatingTaskId(null);
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditVideo', {
      videoId: video.id,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${video.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVideo(Number(videoId));

              Alert.alert(
                'Project Deleted',
                'Your video project was deleted successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              console.error('Delete video error:', error);
              Alert.alert('Error', 'Could not delete this project.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published':
        return colors.success;
      case 'Ready to Publish':
        return colors.secondary;
      case 'Editing':
        return colors.warning;
      default:
        return colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!video) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Video not found.</Text>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary, marginTop: 15 }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Video Details
          </Text>

          <View style={{ width: 42 }} />
        </View>

        <GlassCard padding={0}>
          <View
            style={[
              styles.thumbnail,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Ionicons
              name="videocam-outline"
              size={48}
              color={colors.textMuted}
            />

            <Text style={[styles.thumbnailText, { color: colors.textMuted }]}>
              NO THUMBNAIL
            </Text>
          </View>

          <View style={styles.videoInfo}>
            <Text style={[styles.videoTitle, { color: colors.text }]}>
              {video.title}
            </Text>

            <Text style={[styles.channelName, { color: colors.textSecondary }]}>
              <Ionicons name="logo-youtube" size={15} color="#FF4444" />
              {' '}{video.channel_name}
            </Text>

            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {video.description || 'No description added yet.'}
            </Text>
          </View>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Project Information
        </Text>

        <GlassCard>
          <InfoRow
            icon="calendar-outline"
            label="Planned Upload"
            value={video.upload_date || 'Not scheduled'}
            colors={colors}
          />

          <InfoRow
            icon="flag-outline"
            label="Status"
            value={video.status}
            colors={colors}
            valueColor={getStatusColor(video.status)}
          />

          <InfoRow
            icon="alert-circle-outline"
            label="Priority"
            value={video.priority}
            colors={colors}
          />

          <InfoRow
            icon="time-outline"
            label="Created"
            value={video.created_at || 'Unknown'}
            colors={colors}
          />
        </GlassCard>

        {/* EDITING PROGRESS */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Editing Progress
        </Text>

        <GlassCard>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.text }]}>
              Overall Progress
            </Text>

            <Text style={[styles.percentage, { color: colors.primary }]}>
              {progress.percentage}%
            </Text>
          </View>

          <View
            style={[
              styles.progressTrack,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${progress.percentage}%`,
                },
              ]}
            />
          </View>

          <Text style={[styles.progressNote, { color: colors.textSecondary }]}>
            {progress.completed} of {progress.total} required tasks completed
          </Text>

          {progress.percentage === 100 && (
            <View style={styles.completeMessage}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={{ color: colors.success, fontWeight: '700' }}>
                All required tasks completed!
              </Text>
            </View>
          )}
        </GlassCard>

        {/* EDITING CHECKLIST */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Editing Checklist
        </Text>

        <GlassCard>
          {tasks.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              No editing tasks available.
            </Text>
          ) : (
            tasks.map((task, index) => {
              const completed = task.is_completed === 1;
              const optional = task.is_optional === 1;
              const updating = updatingTaskId === task.id;

              return (
                <View
                  key={task.id}
                  style={[
                    styles.taskRow,
                    index !== tasks.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={updating}
                    onPress={() => handleTaskToggle(task)}
                    style={styles.taskMain}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: completed
                            ? colors.primary
                            : 'transparent',
                          borderColor: completed
                            ? colors.primary
                            : colors.textMuted,
                        },
                      ]}
                    >
                      {completed && (
                        <Ionicons
                          name="checkmark"
                          size={17}
                          color="#FFFFFF"
                        />
                      )}
                    </View>

                    <View style={styles.taskTextContainer}>
                      <Text
                        style={[
                          styles.taskName,
                          {
                            color: completed
                              ? colors.textMuted
                              : colors.text,
                            textDecorationLine: completed
                              ? 'line-through'
                              : 'none',
                          },
                        ]}
                      >
                        {task.task_name}
                      </Text>

                      {optional && (
                        <Text
                          style={[
                            styles.optionalLabel,
                            { color: colors.secondary },
                          ]}
                        >
                          Optional
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  {updating ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.primary}
                    />
                  ) : optional ? (
                    <TouchableOpacity
                      onPress={() => handleSkipOptionalTask(task)}
                      style={styles.skipButton}
                    >
                      <Text style={[styles.skipText, { color: colors.danger }]}>
                        Skip
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Ionicons
                      name={completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={completed ? colors.success : colors.textMuted}
                    />
                  )}
                </View>
              );
            })
          )}
        </GlassCard>

        {/* ACTION BUTTONS */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Edit Project</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: colors.danger }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={[styles.deleteText, { color: colors.danger }]}>
              Delete Project
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 35 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, colors, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={19} color={colors.primary} />

        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>

      <Text
        style={[
          styles.infoValue,
          { color: valueColor || colors.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 55,
    marginBottom: 25,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  thumbnail: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  thumbnailText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: 1.5,
  },

  videoInfo: {
    padding: 18,
  },

  videoTitle: {
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 10,
  },

  channelName: {
    fontSize: 14,
    marginBottom: 15,
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 27,
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#88888840',
  },

  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  infoLabel: {
    fontSize: 13,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 10,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  percentage: {
    fontSize: 21,
    fontWeight: '800',
  },

  progressTrack: {
    height: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 10,
  },

  progressNote: {
    fontSize: 12,
    marginTop: 12,
  },

  completeMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
  },

  taskRow: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },

  taskMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  checkbox: {
    width: 25,
    height: 25,
    borderWidth: 1.7,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  taskTextContainer: {
    flex: 1,
  },

  taskName: {
    fontSize: 14,
    fontWeight: '600',
  },

  optionalLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },

  skipButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  skipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  actionContainer: {
    marginTop: 25,
    gap: 12,
  },

  editButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },

  deleteButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  deleteText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
