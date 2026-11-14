import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ThemeBackdrop({ colors }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary, colors.background]}
        start={{ x: 0.04, y: 0 }}
        end={{ x: 0.96, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.topGlow, { backgroundColor: `${colors.accent}0B` }]} />
      <View style={[styles.glow, styles.bottomGlow, { backgroundColor: `${colors.accentSecondary}0A` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', borderRadius: 999 },
  topGlow: { width: 280, height: 280, top: -180, right: -120 },
  bottomGlow: { width: 250, height: 250, bottom: -180, left: -140 },
});
