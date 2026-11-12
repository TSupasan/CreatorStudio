
import React from 'react';

import {
  View,
  StyleSheet,
} from 'react-native';
import Text from './ThemedText';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function ComingSoonScreen({ title, icon }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.primaryLight },
        ]}
      >
        <Ionicons
          name={icon}
          size={38}
          color={colors.primaryOnLight}
        />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>

      <Text
        style={[
          styles.description,
          { color: colors.textSecondary },
        ]}
      >
        This workspace is being prepared.
        Your creative journey starts here.
      </Text>

      <View
        style={[
          styles.badge,
          { backgroundColor: colors.surfaceSecondary },
        ]}
      >
        <Text style={[styles.badgeText, { color: colors.primaryOnLight }]}>
          COMING SOON
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  iconContainer: {
    width: 85,
    height: 85,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
  },

  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 270,
  },

  badge: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginTop: 22,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});
