import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  StatusBar, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import GlassCard from '../components/GlassCard';
import { getAllVideos } from '../database/repositories/videoRepository';
import { getVideoProgress } from '../database/repositories/taskRepository';

const FILTERS = ['All', 'Idea', 'Planning', 'Editing', 'Ready to Publish', 'Published'];

function getCountdown(video) {
  if (video.status === 'Published') return 'Published';
  if (!video.upload_date) return 'Release date not set';
  const time = video.upload_time || '23:59';
  const target = new Date(`${video.upload_date}T${time}:00`);
  const diff = target.getTime() - Date.now();
  if (Number.isNaN(target.getTime())) return 'Release date not set';
  if (diff < 0) return 'Overdue';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${days}d ${hours}h ${minutes}m remaining`;
}

export default function VideosScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await getAllVideos();
      const enriched = await Promise.all(data.map(async (video) => ({
        ...video,
        progress: await getVideoProgress(video.id),
      })));
      setVideos(enriched);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadVideos(); }, []));

  const channelOptions = useMemo(() => {
    const uniqueChannels = new Map();

    videos.forEach((video) => {
      const id = String(video.channel_id ?? video.channel_name ?? 'unknown');

      if (!uniqueChannels.has(id)) {
        uniqueChannels.set(id, {
          id,
          name: video.channel_name || 'Unknown channel',
        });
      }
    });

    return [
      { id: 'All', name: 'All Channels' },
      ...Array.from(uniqueChannels.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    ];
  }, [videos]);

  const priorityOptions = ['All', 'High', 'Medium', 'Low'];

  const filteredVideos = useMemo(() => videos.filter((video) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      (video.title || '').toLowerCase().includes(query) ||
      (video.channel_name || '').toLowerCase().includes(query);

    const matchesStatus =
      selectedFilter === 'All' || video.status === selectedFilter;

    const channelId = String(
      video.channel_id ?? video.channel_name ?? 'unknown'
    );

    const matchesChannel =
      selectedChannel === 'All' || channelId === selectedChannel;

    const matchesPriority =
      selectedPriority === 'All' || video.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesChannel && matchesPriority;
  }), [videos, search, selectedFilter, selectedChannel, selectedPriority]);

  const statusColor = (status) => {
    if (status === 'Published') return colors.success;
    if (status === 'Ready to Publish') return colors.secondary;
    if (status === 'Editing') return colors.warning;
    if (status === 'Planning') return colors.primary;
    return colors.textSecondary;
  };

  const renderVideo = ({ item }) => {
    const progress = item.progress || { total: 0, completed: 0, percentage: 0 };
    const countdown = getCountdown(item);
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('VideoDetails', { videoId: item.id })}>
        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.thumb, { backgroundColor: colors.surfaceSecondary }]}>
              {item.thumbnail_uri
                ? <Image source={{ uri: item.thumbnail_uri }} style={styles.thumbImage} />
                : <Ionicons name="videocam-outline" size={30} color={colors.textMuted} />}
            </View>
            <View style={styles.info}>
              <Text numberOfLines={2} style={[styles.videoTitle, { color: colors.text }]}>{item.title}</Text>
              <Text numberOfLines={1} style={[styles.channel, { color: colors.textSecondary }]}>{item.channel_name}</Text>
              <View style={styles.badgeRow}>
                <Text style={[styles.badge, { color: statusColor(item.status), backgroundColor: statusColor(item.status) + '20' }]}>{item.status}</Text>
                <Text style={[styles.priority, { color: colors.textSecondary }]}>{item.priority} Priority</Text>
              </View>
            </View>
          </View>

          <View style={styles.progressHeader}>
            <Text style={[styles.smallLabel, { color: colors.textSecondary }]}>Task progress</Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>{progress.percentage}% ({progress.completed}/{progress.total})</Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={[styles.fill, { width: `${progress.percentage}%`, backgroundColor: colors.primary }]} />
          </View>

          <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
            <View style={styles.countdown}>
              <Ionicons name="time-outline" size={15} color={countdown === 'Overdue' ? colors.danger : colors.textSecondary} />
              <Text style={[styles.countdownText, { color: countdown === 'Overdue' ? colors.danger : colors.textSecondary }]}>{countdown}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderVideo}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={<>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR CREATIVE LIBRARY</Text>
          <Text style={[styles.heading, { color: colors.text }]}>My Videos</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your video projects.</Text>
          <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={19} color={colors.textMuted} />
            <TextInput value={search} onChangeText={setSearch} placeholder="Search videos or channels..." placeholderTextColor={colors.textMuted} style={[styles.searchInput, { color: colors.text }]} />
          </View>
          <Text style={[styles.filterHeading, { color: colors.text }]}>Filter by Status</Text>
          <FlatList horizontal data={FILTERS} keyExtractor={(item) => item} showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
            renderItem={({ item }) => {
              const active = selectedFilter === item;
              return <TouchableOpacity onPress={() => setSelectedFilter(item)} style={[styles.filter, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}>
                <Text style={{ color: active ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>{item}</Text>
              </TouchableOpacity>;
            }} />
          {/* ADVANCED FILTERS SECTION */}
          <Text style={[styles.filterHeading, { color: colors.text }]}>
            Filter by Channel
          </Text>

          <FlatList
            horizontal
            data={channelOptions}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.advancedFilterList}
            renderItem={({ item }) => {
              const active = selectedChannel === item.id;

              return (
                <TouchableOpacity
                  onPress={() => setSelectedChannel(item.id)}
                  style={[
                    styles.filter,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{
                    color: active ? '#fff' : colors.textSecondary,
                    fontSize: 12,
                    fontWeight: '700',
                  }}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          <Text style={[styles.filterHeading, { color: colors.text }]}>
            Filter by Priority
          </Text>

          <FlatList
            horizontal
            data={priorityOptions}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.advancedFilterList}
            renderItem={({ item }) => {
              const active = selectedPriority === item;

              return (
                <TouchableOpacity
                  onPress={() => setSelectedPriority(item)}
                  style={[
                    styles.filter,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{
                    color: active ? '#fff' : colors.textSecondary,
                    fontSize: 12,
                    fontWeight: '700',
                  }}>
                    {item === 'All' ? 'All Priorities' : item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {(search.length > 0 ||
            selectedFilter !== 'All' ||
            selectedChannel !== 'All' ||
            selectedPriority !== 'All') && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setSearch('');
                setSelectedFilter('All');
                setSelectedChannel('All');
                setSelectedPriority('All');
              }}
              style={styles.clearFilters}
            >
              <Ionicons name="refresh-outline" size={15} color={colors.primary} />
              <Text style={[styles.clearFiltersText, { color: colors.primary }]}>
                Clear all filters
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Projects Â· {filteredVideos.length}
          </Text>
        </>}
        ListEmptyComponent={<View style={styles.empty}>
          <Ionicons name="videocam-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{loading ? 'Loading projects...' : 'No projects found'}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{loading ? 'Please wait.' : 'Create a project or change your search.'}</Text>
        </View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 130 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  heading: { fontSize: 30, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 6, marginBottom: 18 },
  search: { height: 50, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8, marginBottom: 22 },
  searchInput: { flex: 1, fontSize: 14 },
  filterHeading: { fontSize: 14, fontWeight: '700', marginBottom: 11 },
  filter: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9 },
  advancedFilterList: { gap: 8, paddingBottom: 16 },
  clearFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: -3,
    marginBottom: 16,
  },
  clearFiltersText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  card: { marginBottom: 13 },
  row: { flexDirection: 'row', gap: 12 },
  thumb: { width: 100, height: 90, borderRadius: 13, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  info: { flex: 1, justifyContent: 'center' },
  videoTitle: { fontSize: 14, fontWeight: '800', lineHeight: 20 },
  channel: { fontSize: 11, marginTop: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  badge: { fontSize: 10, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  priority: { fontSize: 10, fontWeight: '600' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, marginBottom: 8 },
  smallLabel: { fontSize: 11, fontWeight: '600' },
  progressPercent: { fontSize: 11, fontWeight: '800' },
  track: { height: 7, borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8 },
  footerRow: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 13, paddingTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countdownText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 12 },
});
