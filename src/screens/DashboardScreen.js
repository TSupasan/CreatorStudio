import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  Animated,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import Text from '../components/ThemedText';
import AppLogo from '../components/AppLogo';
import ThemeBackdrop from '../components/ThemeBackdrop';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { useTheme } from '../theme/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { getAllVideos } from '../database/repositories/videoRepository';
import { getVideoProgress } from '../database/repositories/taskRepository';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { formatStoredDateTime } from '../utils/datePreferences';

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStatusColor = (status, colors) => {
  switch (status) {
    case 'Published': return colors.statusPublished;
    case 'Ready to Publish': return colors.statusReady;
    case 'Editing': return colors.statusEditing;
    case 'Planning': return colors.statusPlanning;
    default: return colors.statusIdea;
  }
};

export default function DashboardScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { preferences } = useAppPreferences();
  const { channelId: selectedChannelId, refreshWorkspace } = useWorkspace();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(25)).current;

  const [videos, setVideos] = useState([]);
  const [upcomingVideos, setUpcomingVideos] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [stats, setStats] = useState(() => [
    { title: 'Total Videos', value: '0', icon: 'videocam-outline', color: colors.primaryText },
    { title: 'In Progress', value: '0', icon: 'create-outline', color: colors.statusPlanning },
    { title: 'Scheduled', value: '0', icon: 'calendar-outline', color: colors.statusReady },
    { title: 'Published', value: '0', icon: 'checkmark-circle-outline', color: colors.statusPublished },
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
      setLoading(true);
      setLoadError(false);
      await refreshWorkspace();
      const allVideos = await getAllVideos(selectedChannelId);

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
        { title: 'Total Videos', value: String(allVideos.length), icon: 'videocam-outline', color: colors.primaryText },
        { title: 'In Progress', value: String(inProgressCount), icon: 'create-outline', color: colors.statusPlanning },
        { title: 'Scheduled', value: String(scheduledCount), icon: 'calendar-outline', color: colors.statusReady },
        { title: 'Published', value: String(publishedCount), icon: 'checkmark-circle-outline', color: colors.statusPublished },
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
  }, [selectedChannelId, refreshWorkspace, colors]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  // VIDEO ANALYTICS SECTION
  const statusAnalytics = [
    { label: 'Idea', color: colors.statusIdea },
    { label: 'Planning', color: colors.statusPlanning },
    { label: 'Editing', color: colors.statusEditing },
    { label: 'Ready to Publish', color: colors.statusReady },
    { label: 'Published', color: colors.statusPublished },
  ].map((item) => ({
    ...item,
    count: videos.filter((video) =>
      (video.status || 'Idea') === item.label
    ).length,
  }));

  const priorityAnalytics = [
    { label: 'High', color: colors.priorityHigh },
    { label: 'Medium', color: colors.priorityMedium },
    { label: 'Low', color: colors.priorityLow },
  ].map((item) => ({
    ...item,
    count: videos.filter((video) =>
      (video.priority || 'Medium') === item.label
    ).length,
  }));

  const publishedVideos = videos.filter(
    (video) => video.status === 'Published'
  );

  const completionRate = videos.length > 0
    ? Math.round((publishedVideos.length / videos.length) * 100)
    : 0;

  const monthlyAnalytics = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;

    return {
      key,
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      count: publishedVideos.filter(
        (video) => video.upload_date && video.upload_date.startsWith(key)
      ).length,
    };
  });

  const maxMonthlyCount = Math.max(
    1,
    ...monthlyAnalytics.map((item) => item.count)
  );

  const channelAnalytics = Object.values(
    videos.reduce((groups, video) => {
      const name = video.channel_name || 'Unknown channel';

      if (!groups[name]) {
        groups[name] = { name, total: 0, published: 0 };
      }

      groups[name].total += 1;

      if (video.status === 'Published') {
        groups[name].published += 1;
      }

      return groups;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const maxChannelCount = Math.max(
    1,
    ...channelAnalytics.map((item) => item.total)
  );
  const renderVideoRow = (video, showDate = false) => {
    const statusColor = getStatusColor(video.status, colors);
    const progress = video.progress || { total: 0, completed: 0, percentage: 0 };

    return (
      <View key={video.id} style={[styles.videoRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.videoIcon, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="videocam-outline" size={20} color={colors.primaryOnLight} />
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
              {formatStoredDateTime(video.upload_date, video.upload_time, preferences) || 'Date not set'}
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
      <ThemeBackdrop colors={colors} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.topBar}>
            <AppLogo width={50} style={styles.dashboardLogo} />
            <View style={styles.topBarCopy}>
              <Text style={[styles.welcome, { color: colors.textSecondary }]}>YOUR CREATIVE SPACE</Text>
              <Text style={[styles.pageTitle, { color: colors.text }]}>Dashboard</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open Profile"
              onPress={() => navigation.navigate('Profile')}
              style={styles.profileButton}
            >
              <LinearGradient colors={colors.heroGradient} style={styles.profileGradient}>
                <Ionicons name="person-outline" size={21} color={colors.heroText} />
              </LinearGradient>
            </Pressable>
          </View>

          <LinearGradient
            colors={colors.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={[styles.heroDecoration, { backgroundColor: colors.heroDecoration }]} />
            <Text style={[styles.heroLabel, { color: colors.heroMuted }]}>CREATORSTUDIO</Text>
            <Text style={[styles.heroTitle, { color: colors.heroText }]}>Create something{'\n'}amazing today.</Text>
            <Text style={[styles.heroSubtitle, { color: colors.heroMuted }]}>Plan your content. Track your progress. Stay consistent.</Text>
            <View style={styles.heroBottom}>
              <View style={[styles.heroIcon, { backgroundColor: colors.heroIconBackground }]}>
                <Ionicons name="sparkles" size={19} color={colors.heroText} />
              </View>
              <Text style={[styles.heroFooter, { color: colors.heroText }]}>Your ideas, organized.</Text>
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

          {/* VIDEO ANALYTICS SECTION */}
          <View style={[styles.sectionHeader, { marginTop: 8 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Content Analytics
            </Text>
            <Text style={[styles.sectionCaption, { color: colors.textMuted }]}>
              INSIGHTS
            </Text>
          </View>

          <GlassCard padding={17} style={styles.analyticsCard}>
            <View style={styles.analyticsHeader}>
              <View>
                <Text style={[styles.analyticsTitle, { color: colors.text }]}>
                  Publishing Progress
                </Text>
                <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
                  Overall completion rate
                </Text>
              </View>
              <View style={[styles.completionBadge, { backgroundColor: `${colors.success}20` }]}>
                <Ionicons name="trending-up" size={17} color={colors.success} />
                <Text style={[styles.completionBadgeText, { color: colors.success }]}>{completionRate}%</Text>
              </View>
            </View>

            <View style={[styles.analyticsTrack, { backgroundColor: colors.surfaceSecondary }]}>
              <View
                style={[
                  styles.analyticsFill,
                  { width: `${completionRate}%`, backgroundColor: colors.success },
                ]}
              />
            </View>

            <Text style={[styles.analyticsFootnote, { color: colors.textSecondary }]}>
              {publishedVideos.length} of {videos.length} videos published
            </Text>
          </GlassCard>

          <GlassCard padding={17} style={styles.analyticsCard}>
            <Text style={[styles.analyticsTitle, { color: colors.text }]}>
              Video Status Distribution
            </Text>
            <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
              Projects grouped by current status
            </Text>

            {statusAnalytics.map((item) => {
              const percentage = videos.length > 0
                ? (item.count / videos.length) * 100
                : 0;

              return (
                <View key={item.label} style={styles.analyticsRow}>
                  <View style={styles.analyticsLabelRow}>
                    <View style={[styles.analyticsDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.analyticsLabel, { color: colors.text }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.analyticsCount, { color: colors.textSecondary }]}>
                      {item.count}
                    </Text>
                  </View>
                  <View style={[styles.analyticsTrack, { backgroundColor: colors.surfaceSecondary }]}>
                    <View
                      style={[
                        styles.analyticsFill,
                        { width: `${percentage}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </GlassCard>

          <GlassCard padding={17} style={styles.analyticsCard}>
            <Text style={[styles.analyticsTitle, { color: colors.text }]}>
              Priority Distribution
            </Text>
            <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
              Video projects by priority level
            </Text>

            <View style={styles.priorityGrid}>
              {priorityAnalytics.map((item) => (
                <View
                  key={item.label}
                  style={[styles.priorityItem, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <View style={[styles.analyticsDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.priorityCount, { color: colors.text }]}>
                    {item.count}
                  </Text>
                  <Text style={[styles.priorityLabel, { color: colors.textSecondary }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>

          <GlassCard padding={17} style={styles.analyticsCard}>
            <Text style={[styles.analyticsTitle, { color: colors.text }]}>
              Monthly Publishing Activity
            </Text>
            <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
              Published videos over the last 6 months
            </Text>

            <View style={styles.monthlyChart}>
              {monthlyAnalytics.map((item) => (
                <View key={item.key} style={styles.monthColumn}>
                  <Text style={[styles.monthCount, { color: colors.textSecondary }]}>
                    {item.count}
                  </Text>
                  <View style={[styles.monthBarBackground, { backgroundColor: colors.surfaceSecondary }]}>
                    <View
                      style={[
                        styles.monthBar,
                        {
                          height: `${(item.count / maxMonthlyCount) * 100}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>

          <GlassCard padding={17} style={styles.analyticsCard}>
            <Text style={[styles.analyticsTitle, { color: colors.text }]}>
              Channel Performance
            </Text>
            <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>
              Project activity across your channels
            </Text>

            {channelAnalytics.length > 0 ? (
              channelAnalytics.map((item) => (
                <View key={item.name} style={styles.channelAnalyticsRow}>
                  <View style={styles.channelAnalyticsHeader}>
                    <Text
                      numberOfLines={1}
                      style={[styles.channelAnalyticsName, { color: colors.text }]}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.channelAnalyticsCount, { color: colors.textSecondary }]}>
                      {item.published}/{item.total} published
                    </Text>
                  </View>
                  <View style={[styles.analyticsTrack, { backgroundColor: colors.surfaceSecondary }]}>
                    <View
                      style={[
                        styles.analyticsFill,
                        {
                          width: `${(item.total / maxChannelCount) * 100}%`,
                          backgroundColor: colors.secondary,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.analyticsFootnote, { color: colors.textSecondary }]}>
                No channel data available yet.
              </Text>
            )}
          </GlassCard>
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
                <ActivityIndicator color={colors.primaryText} />
                <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>Loading upcoming uploads...</Text>
              </View>
            ) : upcomingVideos.length > 0 ? (
              upcomingVideos.map((video) => renderVideoRow(video, true))
            ) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="calendar-outline" size={27} color={colors.primaryOnLight} />
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
                <ActivityIndicator color={colors.primaryText} />
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
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dashboardLogo: { marginRight: 13 },
  topBarCopy: { flex: 1, minWidth: 0 },
  welcome: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  pageTitle: { fontSize: 29, fontWeight: '800', marginTop: 5, letterSpacing: -0.8 },
  profileButton: { width: 47, height: 47, borderRadius: 16, overflow: 'hidden' },
  profileGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroCard: { borderRadius: 25, padding: 23, marginBottom: 30, overflow: 'hidden' },
  heroDecoration: { position: 'absolute', width: 190, height: 190, borderRadius: 100, right: -65, top: -75 },
  heroLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  heroTitle: { fontSize: 27, fontWeight: '800', lineHeight: 34, marginTop: 16 },
  heroSubtitle: { fontSize: 12, lineHeight: 19, marginTop: 10, maxWidth: 245 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
  heroIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  heroFooter: { fontSize: 11, fontWeight: '600', marginLeft: 10 },
  backupEntry: { minHeight: 70, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', marginTop: -12, marginBottom: 25 },
  backupEntryIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  backupEntryText: { flex: 1 },
  backupEntryTitle: { fontSize: 13, fontWeight: '800' },
  backupEntrySubtitle: { fontSize: 10, marginTop: 4 },
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
  analyticsCard: { marginBottom: 14, borderRadius: 20 },
  analyticsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  analyticsTitle: { fontSize: 15, fontWeight: '800' },
  analyticsSubtitle: { fontSize: 11, marginTop: 5 },
  completionBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12, gap: 5 },
  completionBadgeText: { fontSize: 15, fontWeight: '800' },
  analyticsTrack: { height: 7, borderRadius: 8, overflow: 'hidden', marginTop: 9 },
  analyticsFill: { height: '100%', borderRadius: 8 },
  analyticsFootnote: { fontSize: 11, marginTop: 10 },
  analyticsRow: { marginTop: 16 },
  analyticsLabelRow: { flexDirection: 'row', alignItems: 'center' },
  analyticsDot: { width: 9, height: 9, borderRadius: 5, marginRight: 8 },
  analyticsLabel: { flex: 1, fontSize: 12, fontWeight: '600' },
  analyticsCount: { fontSize: 12, fontWeight: '700' },
  priorityGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17, gap: 8 },
  priorityItem: { flex: 1, borderRadius: 13, paddingVertical: 14, paddingHorizontal: 9, alignItems: 'center' },
  priorityCount: { fontSize: 23, fontWeight: '800', marginTop: 7 },
  priorityLabel: { fontSize: 11, marginTop: 3 },
  monthlyChart: { height: 150, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18 },
  monthColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  monthCount: { fontSize: 10, fontWeight: '700', marginBottom: 6 },
  monthBarBackground: { width: 19, height: 95, borderRadius: 7, overflow: 'hidden', justifyContent: 'flex-end' },
  monthBar: { width: '100%', borderRadius: 7, minHeight: 0 },
  monthLabel: { fontSize: 10, marginTop: 8 },
  channelAnalyticsRow: { marginTop: 17 },
  channelAnalyticsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  channelAnalyticsName: { flex: 1, fontSize: 12, fontWeight: '700', marginRight: 8 },
  channelAnalyticsCount: { fontSize: 10 },
  messageCard: { marginBottom: 18 },
});
