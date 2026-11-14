
import React from 'react';

import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useTheme } from '../theme/ThemeContext';

export default function GlassCard({
  children,
  style,
  padding = 18,
}) {
  const { colors, isDark } = useTheme();
  const glassMaterial = Boolean(colors.glassMaterial);

  return (
    <View
      style={[
        styles.card,
        style,
        {
          backgroundColor: colors.card || colors.glass,
          borderColor: glassMaterial ? colors.glassBorder : colors.border,
          padding,
          shadowColor: colors.shadowColor,
          borderRadius: colors.cardRadius,
          elevation: colors.cardElevation,
          ...(glassMaterial ? { shadowOpacity: colors.glassShadowOpacity } : {}),
        },
      ]}
    >
      {glassMaterial && Platform.OS === 'ios' ? (
        <BlurView
          pointerEvents="none"
          intensity={colors.glassBlurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: colors.cardRadius }]}
        />
      ) : null}
      <LinearGradient
        pointerEvents="none"
        colors={glassMaterial ? colors.glassHighlight : ['rgba(255,255,255,0.075)', 'rgba(255,255,255,0.015)']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: colors.cardRadius }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
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
