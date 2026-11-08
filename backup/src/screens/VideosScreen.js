
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import GlassCard from '../components/GlassCard';
import { getAllVideos } from '../database/repositories/videoRepository';

const FILTERS = [
  'All',
  'Idea',
  'Planning',
  'Editing',
  'Ready to Publish',
  'Published',
];

export default function VideosScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await getAllVideos();
      setVideos(data);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadVideos();
    }, [])
  );

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesSearch =
        video.title.toLowerCase().includes(search.toLowerCase()) ||
        (video.channel_name || '')
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        selectedFilter === 'All' || video.status === selectedFilter;

      return matchesSearch && matchesStatus;
    });
  }, [videos, search, selectedFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published':
        return colors.success;
      case 'Ready to Publish':
        return colors.secondary;
      case 'Editing':
        return colors.warning;
      case 'Planning':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const renderVideo = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate('VideoDetails', {
          videoId: item.id,
        })
      }
    >
      <GlassCard style={styles.videoCard}>
        <View style={styles.videoRow}>
          <View
            style={[
              styles.thumbnail,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Ionicons
              name="videocam-outline"
              size={30}
              color={colors.textMuted}
            />

            <Text style={[styles.thumbnailText, { color: colors.textMuted }]}>
              NO THUMBNAIL
            </Text>
          </View>

          <View style={styles.videoInfo}>
            <Text
              style={[styles.videoTitle, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            <View style={styles.channelRow}>
              <Ionicons
                name="logo-youtube"
                size={13}
                color={colors.textSecondary}
              />

              <Text
                style={[styles.channelName, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.channel_name}
              </Text>
            </View>

            <View style={styles.metadataRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {item.status}
                </Text>
              </View>

              <Text
                style={[styles.priorityText, { color: colors.textSecondary }]}
              >
                {item.priority} Priority
              </Text>
            </View>
          </View>
        </View>

        {item.upload_date ? (
          <View style={[styles.dateRow, { borderTopColor: colors.border }]}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={colors.textSecondary}
            />

            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              Upload: {item.upload_date}
            </Text>
          </View>
        ) : null}

        <View style={styles.viewDetailsRow}>
          <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
            View Details
          </Text>

          <Ionicons
            name="chevron-forward"
            size={17}
            color={colors.primary}
          />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderVideo}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>
              YOUR CREATIVE LIBRARY
            </Text>

            <View style={styles.headingRow}>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>
                  My Videos
                </Text>

                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Manage your video projects.
                </Text>
              </View>

              <View
                style={[
                  styles.totalBadge,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="videocam"
                  size={18}
                  color={colors.primary}
                />

                <Text style={[styles.totalNumber, { color: colors.primary }]}>
                  {videos.length}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.textMuted}
              />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search videos or channels..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
              />

              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons
                    name="close-circle"
                    size={19}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.filterHeading, { color: colors.text }]}>
              Filter by Status
            </Text>

            <FlatList
              horizontal
              data={FILTERS}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => {
                const active = selectedFilter === item;

                return (
                  <TouchableOpacity
                    onPress={() => setSelectedFilter(item)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.surface,
                        borderColor: active
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: active ? '#FFFFFF' : colors.textSecondary,
                        },
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <View style={styles.resultsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Projects
              </Text>

              <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                {filteredVideos.length} RESULTS
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons
                name="videocam-outline"
                size={36}
                color={colors.primary}
              />
            </View>

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {loading
                ? 'Loading projects...'
                : search || selectedFilter !== 'All'
                  ? 'No matching projects'
                  : 'Your creative space is empty'}
            </Text>

            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {loading
                ? 'Please wait a moment.'
                : search || selectedFilter !== 'All'
                  ? 'Try changing your search or filter.'
                  : 'Your video projects will appear here once you create them.'}
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

  listContent: {
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

  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 14,
    marginTop: 7,
  },

  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 14,
  },

  totalNumber: {
    fontSize: 16,
    fontWeight: '800',
  },

  searchContainer: {
    height: 52,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
    marginBottom: 25,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
  },

  filterHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 13,
  },

  filterList: {
    gap: 9,
    paddingBottom: 24,
  },

  filterChip: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },

  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },

  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
  },

  resultsCount: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  videoCard: {
    marginBottom: 14,
  },

  videoRow: {
    flexDirection: 'row',
    gap: 14,
  },

  thumbnail: {
    width: 105,
    height: 105,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  thumbnailText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  videoInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  videoTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },

  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
  },

  channelName: {
    fontSize: 11,
    flexShrink: 1,
  },

  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },

  dateRow: {
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  dateText: {
    fontSize: 11,
  },

  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 13,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#88888840',
    gap: 5,
  },

  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 35,
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 17,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
});
