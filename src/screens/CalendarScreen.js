import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import Text from '../components/ThemedText';
import AppLogo from '../components/AppLogo';
import ThemeBackdrop from '../components/ThemeBackdrop';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getAllVideos } from '../database/repositories/videoRepository';
import { useTheme } from '../theme/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { formatStoredDate, formatStoredTime, getWeekdayLabels } from '../utils/datePreferences';

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthLabel(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function CalendarScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { preferences } = useAppPreferences();
  const { channelId: workspaceChannelId, refreshWorkspace } = useWorkspace();

  const scrollRef = useRef(null);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));

  const background = colors.background;
  const cardBackground = colors.glass;
  const textColor = colors.text;
  const mutedColor = colors.textSecondary;
  const borderColor = colors.border;
  const accentColor = colors.primary;

  const loadVideos = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      setError('');

      await refreshWorkspace();
      const result = await getAllVideos(workspaceChannelId);
      setVideos(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Calendar loading error:', err);
      setError('Unable to load calendar data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceChannelId, refreshWorkspace]);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({
        y: 0,
        animated: false,
      });

      loadVideos();
    }, [loadVideos])
  );

  const videosByDate = useMemo(() => {
    const grouped = {};

    videos.forEach(video => {
      if (!video.upload_date) return;

      const date = String(video.upload_date);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;

      if (!grouped[date]) grouped[date] = [];

      grouped[date].push(video);
    });

    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) =>
        String(a.upload_time || '').localeCompare(
          String(b.upload_time || '')
        )
      );
    });

    return grouped;
  }, [videos]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDay = (firstDay.getDay() - (preferences.weekStartsOn || 0) + 7) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    for (let i = 0; i < 42; i++) {
      const dayNumber = i - startDay + 1;

      if (dayNumber < 1 || dayNumber > daysInMonth) {
        cells.push(null);
      } else {
        cells.push(new Date(year, month, dayNumber));
      }
    }

    return cells;
  }, [currentMonth, preferences.weekStartsOn]);

  const weekdayLabels = getWeekdayLabels(preferences.weekStartsOn);

  const selectedVideos = videosByDate[selectedDate] || [];

  const today = formatDate(new Date());

  const changeMonth = direction => {
    setCurrentMonth(previous =>
      new Date(
        previous.getFullYear(),
        previous.getMonth() + direction,
        1
      )
    );
  };

  const openVideo = video => {
    const parentNavigation = navigation?.getParent?.();

    parentNavigation?.navigate('VideoDetails', {
      videoId: video.id,
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVideos(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 35,
    },
    heading: {
      fontSize: 26,
      fontWeight: '800',
      color: textColor,
    },
    brandHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 22,
    },
    headerLogo: {
      marginRight: 12,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    subtitle: {
      color: mutedColor,
      fontSize: 13,
      marginTop: 5,
      marginBottom: 0,
    },
    calendarCard: {
      backgroundColor: cardBackground,
      borderRadius: 20,
      padding: 15,
      borderWidth: 1,
      borderColor,
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
    },
    monthTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: textColor,
    },
    arrowButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    weekdayRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    weekday: {
      width: '14.2857%',
      textAlign: 'center',
      color: mutedColor,
      fontSize: 11,
      fontWeight: '700',
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.2857%',
      height: 51,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedDay: {
      backgroundColor: accentColor,
    },
    todayDay: {
      borderWidth: 1.5,
      borderColor: accentColor,
    },
    dayText: {
      color: textColor,
      fontSize: 13,
      fontWeight: '600',
    },
    selectedDayText: {
      color: colors.onPrimary,
    },
    todayText: {
      color: accentColor,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 5,
      backgroundColor: accentColor,
      marginTop: 2,
    },
    selectedDot: {
      backgroundColor: colors.onPrimary,
    },
    agendaHeader: {
      marginTop: 27,
      marginBottom: 15,
    },
    agendaTitle: {
      color: textColor,
      fontSize: 19,
      fontWeight: '800',
    },
    agendaSubtitle: {
      color: mutedColor,
      fontSize: 12,
      marginTop: 5,
    },
    videoCard: {
      backgroundColor: cardBackground,
      borderRadius: 16,
      padding: 15,
      marginBottom: 12,
      borderWidth: 1,
      borderColor,
    },
    videoTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    videoTitle: {
      color: textColor,
      fontSize: 15,
      fontWeight: '700',
      flex: 1,
      marginRight: 10,
    },
    time: {
      color: accentColor,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 9,
    },
    channel: {
      color: mutedColor,
      fontSize: 12,
      marginTop: 7,
    },
    badges: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
      gap: 7,
    },
    badge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 8,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    emptyCard: {
      backgroundColor: cardBackground,
      padding: 25,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor,
    },
    emptyTitle: {
      color: textColor,
      fontSize: 15,
      fontWeight: '700',
      marginTop: 12,
    },
    emptyText: {
      color: mutedColor,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 6,
    },
    errorText: {
      color: colors.danger,
      textAlign: 'center',
      marginVertical: 20,
    },
  });

  return (
    <View style={styles.container}>
      <ThemeBackdrop colors={colors} />
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={background}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accentColor}
          />
        }
      >
        <View style={styles.brandHeading}>
          <AppLogo width={48} style={styles.headerLogo} />
          <View style={styles.headerCopy}>
            <Text style={styles.heading}>Content Calendar</Text>
            <Text style={styles.subtitle}>Keep track of your upcoming content schedule.</Text>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => changeMonth(-1)}
            >
              <Ionicons name="chevron-back" size={19} color={textColor} />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>
              {getMonthLabel(currentMonth)}
            </Text>

            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => changeMonth(1)}
            >
              <Ionicons name="chevron-forward" size={19} color={textColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {weekdayLabels.map(day => (
              <Text key={day} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const dateKey = formatDate(date);
              const isSelected = selectedDate === dateKey;
              const isToday = today === dateKey;
              const hasVideos = Boolean(videosByDate[dateKey]?.length);

              return (
                <View key={dateKey} style={styles.dayCell}>
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      isToday && styles.todayDay,
                      isSelected && styles.selectedDay,
                    ]}
                    onPress={() => setSelectedDate(dateKey)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && styles.todayText,
                        isSelected && styles.selectedDayText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>

                    {hasVideos && (
                      <View
                        style={[
                          styles.dot,
                          isSelected && styles.selectedDot,
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.agendaHeader}>
          <Text style={styles.agendaTitle}>Scheduled Videos</Text>
          <Text style={styles.agendaSubtitle}>
            {formatStoredDate(selectedDate, preferences.dateFormat)}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={accentColor}
            style={{ marginTop: 25 }}
          />
        ) : error ? (
          <View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadVideos()}>
              <Text style={{ color: accentColor, textAlign: 'center' }}>
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        ) : selectedVideos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-clear-outline"
              size={34}
              color={mutedColor}
            />
            <Text style={styles.emptyTitle}>No videos scheduled</Text>
            <Text style={styles.emptyText}>
              There are no videos planned for this date.
            </Text>
          </View>
        ) : (
          selectedVideos.map(video => {
            const statusColor = ({
              Idea: colors.statusIdea,
              Planning: colors.statusPlanning,
              Editing: colors.statusEditing,
              'Ready to Publish': colors.statusReady,
              Published: colors.statusPublished,
            })[video.status] || colors.statusIdea;

            const priorityColor = ({
              Low: colors.priorityLow,
              Medium: colors.priorityMedium,
              High: colors.priorityHigh,
            })[video.priority] || colors.textMuted;

            return (
              <TouchableOpacity
                key={video.id}
                style={styles.videoCard}
                activeOpacity={0.75}
                onPress={() => openVideo(video)}
              >
                <View style={styles.videoTop}>
                  <Text style={styles.videoTitle}>
                    {video.title || 'Untitled video'}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={mutedColor}
                  />
                </View>

                <Text style={styles.time}>
                  <Ionicons name="time-outline" size={13} />
                  {'  '}
                  {formatStoredTime(video.upload_time, preferences.timeFormat) || 'Time not set'}
                </Text>

                <Text style={styles.channel}>
                  <Ionicons name="logo-youtube" size={13} />
                  {'  '}
                  {video.channel_name || 'Unknown channel'}
                </Text>

                <View style={styles.badges}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: `${statusColor}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: statusColor },
                      ]}
                    >
                      {video.status || 'Idea'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: `${priorityColor}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: priorityColor },
                      ]}
                    >
                      {video.priority || 'Medium'} Priority
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}


