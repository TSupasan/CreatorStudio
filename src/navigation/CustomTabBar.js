
import React, { useEffect, useRef } from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';

const tabs = [
  {
    name: 'Home',
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    name: 'Video',
    label: 'Video',
    icon: 'videocam-outline',
    activeIcon: 'videocam',
  },
  {
    name: 'Create',
    label: 'Create',
    icon: 'add-circle-outline',
    activeIcon: 'add-circle',
  },
  {
    name: 'Calendar',
    label: 'Calendar',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
  },
  {
    name: 'Idea',
    label: 'Idea',
    icon: 'bulb-outline',
    activeIcon: 'bulb',
  },
];

function TabItem({ route, index, isFocused, onPress, colors }) {
  const animation = useRef(
    new Animated.Value(isFocused ? 1 : 0)
  ).current;

  useEffect(() => {
    Animated.spring(animation, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      tension: 70,
      friction: 8,
    }).start();
  }, [isFocused, animation]);

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.13],
  });

  const iconColor = isFocused
    ? colors.primary
    : colors.textMuted;

  const iconName = isFocused
    ? route.activeIcon
    : route.icon;

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabItem}
      accessibilityRole="button"
      accessibilityLabel={route.label}
      accessibilityState={{ selected: isFocused }}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale }],
            backgroundColor: isFocused
              ? colors.primaryLight
              : 'transparent',
          },
        ]}
      >
        <Ionicons
          name={iconName}
          size={22}
          color={iconColor}
        />
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          {
            color: isFocused
              ? colors.primary
              : colors.textMuted,
            fontWeight: isFocused ? '700' : '500',
          },
        ]}
      >
        {route.label}
      </Text>
    </Pressable>
  );
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      <BlurView
        intensity={isDark ? 55 : 75}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.tabBar,
          {
            borderColor: colors.border,
            backgroundColor: colors.tabBar,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const tab = tabs.find(
            item => item.name === route.name
          );

          if (!tab) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              route={tab}
              index={index}
              isFocused={isFocused}
              onPress={onPress}
              colors={colors}
            />
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 18 : 12,
    left: 16,
    right: 16,
  },

  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 25,
    borderWidth: 1,
    overflow: 'hidden',

    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: {
          width: 0,
          height: 7,
        },
      },
      android: {
        elevation: 10,
      },
    }),
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
  },

  iconContainer: {
    width: 38,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabLabel: {
    fontSize: 9,
  },
});
