import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { useTheme } from '../theme/ThemeContext';
import { getAllVideos } from '../database/repositories/videoRepository';
import { getVideoProgress } from '../database/repositories/taskRepository';

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatUploadDate = (date, time) => {
  if (!date) return 'Date not set';
  const [year, month, day] = date.split('-').map(Number);
  const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return time ? `${formattedDate}  |  ${time}` : formattedDate;
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Published': return '#35C99A';
    case 'Ready to Publish': return '#35BDE5';
    case 'Editing': return '#F2A65A';
    case 'Planning': return '#8B78FF';
    default: return '#9A9A9A';
  }
};

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(25)).current;

  const [videos, setVideos] = useState([]);
  const [upcomingVideos, setUpcomingVideos] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [stats, setStats] = useState([
    { title: 'Total Videos', value: '0', icon: 'videocam-outline', color: '#8B78FF' },
    { title: 'In Progress', value: '0', icon: 'create-outline', color: '#F2A65A' },
    { title: 'Scheduled', value: '0', icon: 'calendar-outline', color: '#35BDE5' },
    { title: 'Published', value: '0', icon: 'checkmark-circle-outline', color: '#35C99A' },
  ]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 45,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoadError(false);
      const allVideos = await getAllVideos();

      const videosWithProgress = await Promise.all(
        allVideos.map(async (video) => {
          const progress = await getVideoProgress(video.id);
          return { ...video, progress };
        })
      );

      const today = getLocalDateString();

      const inProgressCount = allVideos.filter(
        (video) => video.status === 'Planning' || video.status === 'Editing'
      ).length;
      const scheduledCount = allVideos.filter(
        (video) => video.status === 'Ready to Publish'
      ).length;
      const publishedCount = allVideos.filter(
        (video) => video.status === 'Published'
      ).length;

      setStats([
        { title: 'Total Videos', value: String(allVideos.length), icon: 'videocam-outline', color: '#8B78FF' },
        { title: 'In Progress', value: String(inProgressCount), icon: 'create-outline', color: '#F2A65A' },
        { title: 'Scheduled', value: String(scheduledCount), icon: 'calendar-outline', color: '#35BDE5' },
        { title: 'Published', value: String(publishedCount), icon: 'checkmark-circle-outline', color: '#35C99A' },
      ]);

      const upcoming = videosWithProgress
        .filter((video) =>
          video.upload_date &&
          video.upload_date >= today &&
          video.status !== 'Published'
        )
        .sort((a, b) => {
          const dateA = `${a.upload_date} ${a.upload_time || '23:59'}`;
          const dateB = `${b.upload_date} ${b.upload_time || '23:59'}`;
          return dateA.localeCompare(dateB);
        })
        .slice(0, 3);

      setVideos(videosWithProgress);
      setUpcomingVideos(upcoming);
      setRecentVideos(videosWithProgress.slice(0, 3));
    } catch (error) {
      console.error('Dashboard loading error:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const renderVideoRow = (video, showDate = false) => {
    const statusColor = getStatusColor(video.status);
    const progress = video.progress || { total: 0, completed: 0, percentage: 0 };

    return (
      <View key={video.id} style={[styles.videoRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.videoIcon, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="videocam-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.videoInfo}>
          <Text numberOfLines={1} style={[styles.videoTitle, { color: colors.text }]}>
            {video.title}
          </Text>
          <Text numberOfLines={1} style={[styles.videoMeta, { color: colors.textSecondary }]}>
            {video.channel_name || 'Unknown channel'}
          </Text>
          {showDate && (
            <Text style={[styles.videoMeta, { color: colors.textMuted }]}>
              {formatUploadDate(video.upload_date, video.upload_time)}
            </Text>
          )}
          <View style={styles.videoBottomRow}>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{video.status || 'Idea'}</Text>
            </View>
            <Text style={[styles.progressText, { color: colors.textMuted }]}>
              {progress.percentage}% tasks
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={[styles.progressFill, { width: `${progress.percentage}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.welcome, { color: colors.textSecondary }]}>YOUR CREATIVE SPACE</Text>
              <Text style={[styles.pageTitle, { color: colors.text }]}>Dashboard</Text>
            </View>
            <View style={styles.profileButton}>
              <LinearGradient colors={['#8B78FF', '#5946D8']} style={styles.profileGradient}>
                <Ionicons name="person" size={21} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </View>

          <LinearGradient
            colors={['#7562F6', '#5141C9', '#352B8C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecoration} />
            <Text style={styles.heroLabel}>CREATORSTUDIO</Text>
            <Text style={styles.heroTitle}>Create something{'\n'}amazing today.</Text>
            <Text style={styles.heroSubtitle}>Plan your content. Track your progress. Stay consistent.</Text>
            <View style={styles.heroBottom}>
              <View style={styles.heroIcon}>
                <Ionicons name="sparkles" size={19} color="#FFFFFF" />
              </View>
              <Text style={styles.heroFooter}>Your ideas, organized.</Text>
            </View>
          </LinearGradient>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Overview</Text>
            <Text style={[styles.sectionCaption, { color: colors.textMuted }]}>ALL CHANNELS</Text>
          </View>

          <View style={styles.statsGrid}>
            {stats.map((item) => (
              <GlassCard key={item.title} style={styles.statCard} padding={15}>
                <View style={[styles.statIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={21} color={item.color} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{loading ? 'â€”' : item.value}</Text>
                <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{item.title}</Text>
              </GlassCard>
            ))}
          </View>

          {loadError && (
            <GlassCard padding={15} style={styles.messageCard}>
              <Text style={[styles.emptyDescription, { color: colors.danger }]}>
                Could not load dashboard data. Please check the database and try again.
              </Text>
            </GlassCard>
          )}

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Uploads</Text>
          </View>

          <GlassCard padding={15}>
            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>Loading upcoming uploads...</Text>
              </View>
            ) : upcomingVideos.length > 0 ? (
              upcomingVideos.map((video) => renderVideoRow(video, true))
            ) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="calendar-outline" size={27} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing scheduled yet</Text>
                <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                  Add a future release date to a video project and it will appear here.
                </Text>
              </View>
            )}
          </GlassCard>

          <View style={[styles.sectionHeader, { marginTop: 25 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Projects</Text>
          </View>

          <GlassCard padding={15}>
            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>Loading recent projects...</Text>
              </View>
            ) : recentVideos.length > 0 ? (
              recentVideos.map((video) => renderVideoRow(video, false))
            ) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSecondary }]}>
                  <Ionicons name="folder-open-outline" size={27} color={colors.textSecondary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Your workspace is ready</Text>
                <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                  Start your first video project and manage everything in one place.
                </Text>
              </View>
            )}
          </GlassCard>

          <Text style={[styles.footer, { color: colors.textMuted }]}>
            CREATORSTUDIO | YOUR CREATIVE WORKSPACE
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  welcome: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  pageTitle: { fontSize: 29, fontWeight: '800', marginTop: 5, letterSpacing: -0.8 },
  profileButton: { width: 47, height: 47, borderRadius: 16, overflow: 'hidden' },
  profileGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroCard: { borderRadius: 25, padding: 23, marginBottom: 30, overflow: 'hidden' },
  heroDecoration: { position: 'absolute', width: 190, height: 190, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.07)', right: -65, top: -75 },
  heroLabel: { color: '#D9D2FF', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  heroTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '800', lineHeight: 34, marginTop: 16 },
  heroSubtitle: { color: '#E0DCFF', fontSize: 12, lineHeight: 19, marginTop: 10, maxWidth: 245 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
  heroIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroFooter: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', marginLeft: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, marginTop: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  sectionCaption: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { width: '48%', marginBottom: 12, borderRadius: 20 },
  statIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  statValue: { fontSize: 27, fontWeight: '800' },
  statTitle: { fontSize: 12, fontWeight: '500', marginTop: 5 },
  emptyState: { alignItems: 'center', paddingVertical: 12 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptyDescription: { fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 7, maxWidth: 260 },
  footer: { textAlign: 'center', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginTop: 30 },
  videoRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  videoIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  videoInfo: { flex: 1 },
  videoTitle: { fontSize: 13, fontWeight: '800' },
  videoMeta: { fontSize: 11, marginTop: 4 },
  videoBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  progressText: { fontSize: 10, fontWeight: '600' },
  progressTrack: { height: 5, borderRadius: 5, overflow: 'hidden', marginTop: 7 },
  progressFill: { height: '100%', borderRadius: 5 },
  loadingState: { alignItems: 'center', paddingVertical: 20 },
  messageCard: { marginBottom: 18 },
});
