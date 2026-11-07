
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

export default function VideoDetailsScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { videoId } = route.params;

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideoDetails();
  }, [videoId]);

  const loadVideoDetails = async () => {
    try {
      const db = await getDatabase();

      const result = await db.getFirstAsync(
        `SELECT videos.*, channels.name AS channel_name
         FROM videos
         INNER JOIN channels ON videos.channel_id = channels.id
         WHERE videos.id = ?`,
        [Number(videoId)]
      );

      setVideo(result);
    } catch (error) {
      console.error('Video details error:', error);
      Alert.alert('Error', 'Unable to load video details.');
    } finally {
      setLoading(false);
    }
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
          <View style={[
            styles.thumbnail,
            { backgroundColor: colors.surfaceSecondary }
          ]}>
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

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Editing Progress
        </Text>

        <GlassCard>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.text }]}>
              Overall Progress
            </Text>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>
              Coming Soon
            </Text>
          </View>

          <View style={[
            styles.progressTrack,
            { backgroundColor: colors.surfaceSecondary }
          ]}>
            <View style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: '0%' }
            ]} />
          </View>

          <Text style={[styles.progressNote, { color: colors.textMuted }]}>
            Your editing checklist will appear here.
          </Text>
        </GlassCard>

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

      <Text style={[
        styles.infoValue,
        { color: valueColor || colors.text }
      ]}>
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
    marginBottom: 14,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    height: 9,
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
