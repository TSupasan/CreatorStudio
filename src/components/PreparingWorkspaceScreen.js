import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './ThemedText';
import AppLogo from './AppLogo';
import ThemeBackdrop from './ThemeBackdrop';
import { useTheme } from '../theme/ThemeContext';

export default function PreparingWorkspaceScreen({ error, onRetry }) {
  const { colors, isDark } = useTheme();
  const pulse = useRef(new Animated.Value(0.96)).current;
  const dots = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const logoBreathing = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1250, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.96, duration: 1250, useNativeDriver: true }),
    ]));
    const loadingDots = Animated.loop(Animated.sequence([
      Animated.timing(dots, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(dots, { toValue: 0.45, duration: 700, useNativeDriver: true }),
    ]));
    logoBreathing.start();
    loadingDots.start();
    return () => { logoBreathing.stop(); loadingDots.stop(); };
  }, [pulse, dots]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemeBackdrop colors={colors} />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={[styles.ambient, styles.ambientTop, { backgroundColor: colors.primaryLight }]} />
      <View style={[styles.ambient, styles.ambientBottom, { backgroundColor: colors.secondary }]} />
      <Animated.View style={{ transform: [{ scale: pulse }] }}><AppLogo width={96} /></Animated.View>
      {error ? (
        <View style={[styles.errorPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.errorIcon, { backgroundColor: `${colors.danger}18` }]}>
            <Ionicons name="alert-circle-outline" size={23} color={colors.danger} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Could not open your local workspace</Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>CreatorStudio could not initialize its local database. Your data has not been changed. Check available device storage, then retry.</Text>
          {error.message ? <Text selectable style={[styles.errorDetail, { color: colors.textMuted }]}>{error.message}</Text> : null}
          <Pressable accessibilityRole="button" onPress={onRetry} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="refresh" size={17} color={colors.onPrimary} />
            <Text style={[styles.retryText, { color: colors.onPrimary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : <>
        <Text style={[styles.message, { color: colors.textSecondary }]}>Preparing your creative workspace...</Text>
        <Animated.View style={[styles.loadingMark, { backgroundColor: colors.primary, opacity: dots }]} />
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, overflow: 'hidden' },
  ambient: { position: 'absolute', width: 210, height: 210, borderRadius: 120 },
  ambientTop: { right: -120, top: 40, opacity: 0.3 },
  ambientBottom: { left: -140, bottom: 15, opacity: 0.1 },
  message: { fontSize: 12, fontWeight: '600', marginTop: 26, textAlign: 'center' },
  loadingMark: { width: 28, height: 3, borderRadius: 2, marginTop: 14 },
  errorPanel: { width: '100%', maxWidth: 360, borderWidth: 1, borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 24 },
  errorIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  errorTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  errorMessage: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  errorDetail: { fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 8 },
  retryButton: { minHeight: 46, minWidth: 120, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, marginTop: 17 },
  retryText: { fontSize: 12, fontWeight: '800' },
});
