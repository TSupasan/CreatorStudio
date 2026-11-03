
import React from 'react';

import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function GlassCard({
  children,
  style,
  padding = 18,
}) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.glass,
          borderColor: colors.border,
          padding,
          shadowColor: isDark ? '#000000' : '#7770B8',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',

    ...Platform.select({
      ios: {
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: {
          width: 0,
          height: 6,
        },
      },

      android: {
        elevation: 3,
      },
    }),
  },
});
