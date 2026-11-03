
import React, { useEffect } from 'react';

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import GlassCard from '../components/GlassCard';
import { useTheme } from '../theme/ThemeContext';
import { typography } from '../theme/typography';

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();

  const fadeAnim = React.useRef(
    new Animated.Value(0)
  ).current;

  const slideAnim = React.useRef(
    new Animated.Value(25)
  ).current;

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

  const stats = [
    {
      title: 'Total Videos',
      value: '0',
      icon: 'videocam-outline',
      color: '#8B78FF',
    },
    {
      title: 'In Progress',
      value: '0',
      icon: 'create-outline',
      color: '#F2A65A',
    },
    {
      title: 'Scheduled',
      value: '0',
      icon: 'calendar-outline',
      color: '#35BDE5',
    },
    {
      title: 'Published',
      value: '0',
      icon: 'checkmark-circle-outline',
      color: '#35C99A',
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >

          {/* Header */}

          <View style={styles.topBar}>
            <View>
              <Text
                style={[
                  styles.welcome,
                  { color: colors.textSecondary },
                ]}
              >
                YOUR CREATIVE SPACE
              </Text>

              <Text
                style={[
                  styles.pageTitle,
                  { color: colors.text },
                ]}
              >
                Dashboard
              </Text>
            </View>

            <View style={styles.profileButton}>
              <LinearGradient
                colors={['#8B78FF', '#5946D8']}
                style={styles.profileGradient}
              >
                <Ionicons
                  name="person"
                  size={21}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </View>
          </View>

          {/* Welcome Card */}

          <LinearGradient
            colors={['#7562F6', '#5141C9', '#352B8C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroDecoration} />

            <Text style={styles.heroLabel}>
              CREATORSTUDIO
            </Text>

            <Text style={styles.heroTitle}>
              Create something{'\n'}amazing today.
            </Text>

            <Text style={styles.heroSubtitle}>
              Plan your content. Track your progress.
              Stay consistent.
            </Text>

            <View style={styles.heroBottom}>
              <View style={styles.heroIcon}>
                <Ionicons
                  name="sparkles"
                  size={19}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.heroFooter}>
                Your ideas, organized.
              </Text>
            </View>
          </LinearGradient>

          {/* Statistics */}

          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              Your Overview
            </Text>

            <Text
              style={[
                styles.sectionCaption,
                { color: colors.textMuted },
              ]}
            >
              ALL CHANNELS
            </Text>
          </View>

          <View style={styles.statsGrid}>
            {stats.map((item, index) => (
              <GlassCard
                key={item.title}
                style={styles.statCard}
                padding={15}
              >
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: item.color + '20' },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={21}
                    color={item.color}
                  />
                </View>

                <Text
                  style={[
                    styles.statValue,
                    { color: colors.text },
                  ]}
                >
                  {item.value}
                </Text>

                <Text
                  style={[
                    styles.statTitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {item.title}
                </Text>
              </GlassCard>
            ))}
          </View>

          {/* Upcoming Uploads */}

          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              Upcoming Uploads
            </Text>
          </View>

          <GlassCard padding={20}>
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={27}
                  color={colors.primary}
                />
              </View>

              <Text
                style={[
                  styles.emptyTitle,
                  { color: colors.text },
                ]}
              >
                Nothing scheduled yet
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Your upcoming video uploads will
                appear here.
              </Text>
            </View>
          </GlassCard>

          {/* Recent Projects */}

          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              Recent Projects
            </Text>
          </View>

          <GlassCard padding={20}>
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Ionicons
                  name="folder-open-outline"
                  size={27}
                  color={colors.textSecondary}
                />
              </View>

              <Text
                style={[
                  styles.emptyTitle,
                  { color: colors.text },
                ]}
              >
                Your workspace is ready
              </Text>

              <Text
                style={[
                  styles.emptyDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Start your first video project and
                manage everything in one place.
              </Text>
            </View>
          </GlassCard>

          <Text
            style={[
              styles.footer,
              { color: colors.textMuted },
            ]}
          >
            CREATORSTUDIO • YOUR CREATIVE WORKSPACE
          </Text>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 40,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  welcome: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },

  pageTitle: {
    fontSize: 29,
    fontWeight: '800',
    marginTop: 5,
    letterSpacing: -0.8,
  },

  profileButton: {
    width: 47,
    height: 47,
    borderRadius: 16,
    overflow: 'hidden',
  },

  profileGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroCard: {
    borderRadius: 25,
    padding: 23,
    marginBottom: 30,
    overflow: 'hidden',
  },

  heroDecoration: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    right: -65,
    top: -75,
  },

  heroLabel: {
    color: '#D9D2FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 34,
    marginTop: 16,
  },

  heroSubtitle: {
    color: '#E0DCFF',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
    maxWidth: 245,
  },

  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
  },

  heroIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroFooter: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 10,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  sectionCaption: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  statCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 20,
  },

  statIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  statValue: {
    fontSize: 27,
    fontWeight: '800',
  },

  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 240,
  },

  footer: {
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 30,
  },
});
