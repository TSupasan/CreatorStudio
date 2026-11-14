import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, ScrollView, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BlurTargetView, BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/ThemedText';
import AppLogo from '../components/AppLogo';
import { useTheme } from '../theme/ThemeContext';

function LiquidGlassButton({ colors, isDark, blurTarget, onPress }) {
  const travel = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const started = useRef(false);
  const maxTravel = Math.max(0, trackWidth - 70);

  const start = () => {
    if (started.current) return;
    started.current = true;
    if (maxTravel === 0) {
      onPress();
      return;
    }
    Animated.timing(travel, { toValue: maxTravel, duration: 170, useNativeDriver: false }).start(({ finished }) => {
      if (finished) onPress();
      else started.current = false;
    });
  };

  const resetHandle = () => {
    Animated.spring(travel, { toValue: 0, useNativeDriver: false, speed: 22, bounciness: 3 }).start();
  };

  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !started.current,
    onMoveShouldSetPanResponder: (_, gesture) => !started.current && Math.abs(gesture.dx) > 3,
    onPanResponderGrant: () => travel.setValue(0),
    onPanResponderMove: (_, gesture) => travel.setValue(Math.max(0, Math.min(maxTravel, gesture.dx))),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx >= maxTravel * 0.78) start();
      else if (Math.abs(gesture.dx) < 8 && Math.abs(gesture.dy) < 8) start();
      else resetHandle();
    },
    onPanResponderTerminate: resetHandle,
    onPanResponderTerminationRequest: () => false,
  }), [maxTravel, travel, onPress]);

  const fillWidth = travel.interpolate({
    inputRange: [0, Math.max(maxTravel, 1)],
    outputRange: [63, Math.max(maxTravel + 63, 63)],
    extrapolate: 'clamp',
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Let's Go"
      accessibilityHint="Tap the button or drag its handle to the right to open your Dashboard."
      accessibilityActions={[{ name: 'activate', label: 'Open Dashboard' }]}
      onAccessibilityAction={({ nativeEvent }) => { if (nativeEvent.actionName === 'activate') start(); }}
      onPress={start}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      style={({ pressed }) => [styles.ctaOuter, {
        borderColor: `${colors.primary}90`,
        borderRadius: colors.cardRadius + 12,
        shadowColor: colors.primary,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      }]}
    >
      <BlurView
        pointerEvents="none"
        intensity={Math.min(68, colors.blurIntensity)}
        tint={isDark ? 'dark' : 'light'}
        {...(Platform.OS === 'android' ? { blurTarget, blurMethod: 'dimezisBlurViewSdk31Plus' } : {})}
        style={[StyleSheet.absoluteFill, { borderRadius: colors.cardRadius + 12 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={isDark
          ? ['rgba(255,255,255,0.15)', `${colors.primary}38`, 'rgba(255,255,255,0.05)']
          : ['rgba(255,255,255,0.94)', `${colors.primary}27`, 'rgba(255,255,255,0.47)']}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: colors.cardRadius + 12 }]}
      />
      <Animated.View pointerEvents="none" style={[styles.slideProgress, { width: fillWidth, backgroundColor: `${colors.primary}25` }]} />
      <View pointerEvents="none" style={styles.ctaCopy}>
        <Text style={[styles.ctaTitle, { color: colors.text }]}>Let's Go</Text>
        <Text style={[styles.ctaHint, { color: colors.textSecondary }]}>Slide or tap to start</Text>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.slideHandle, { backgroundColor: isDark ? '#F7FFFF' : '#FFFFFF', borderColor: `${colors.primary}55`, shadowColor: colors.primary, transform: [{ translateX: travel }] }]}
      >
        <Ionicons name="chevron-forward" size={22} color={colors.primaryText} />
      </Animated.View>
      <View pointerEvents="none" style={[styles.buttonEdge, { borderColor: `${colors.surface}B8`, borderRadius: colors.cardRadius + 12 }]} />
    </Pressable>
  );
}

export default function WelcomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const blurTarget = useRef(null);
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const auroraShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const logoEntrance = Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 4 });
    const float = Animated.loop(Animated.sequence([
      Animated.timing(logoFloat, { toValue: -3, duration: 2100, useNativeDriver: true }),
      Animated.timing(logoFloat, { toValue: 0, duration: 2100, useNativeDriver: true }),
    ]));
    const aurora = Animated.loop(Animated.sequence([
      Animated.timing(auroraShift, { toValue: 1, duration: 7200, useNativeDriver: true }),
      Animated.timing(auroraShift, { toValue: 0, duration: 7200, useNativeDriver: true }),
    ]));
    logoEntrance.start();
    float.start();
    aurora.start();
    return () => { logoEntrance.stop(); float.stop(); aurora.stop(); };
  }, [logoScale, logoFloat, auroraShift]);

  const openHome = () => navigation.replace('MainTabs', { screen: 'Home' });
  const logoWidth = Math.min(178, width * 0.46);
  const auroraGradient = isDark ? ['#050B13', '#0B1B24', '#071410'] : ['#EAF5F8', '#E9F7F1', '#F6FAFC'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <BlurTargetView ref={blurTarget} collapsable={false} pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient colors={auroraGradient} start={{ x: 0.08, y: 0 }} end={{ x: 0.92, y: 1 }} style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.ambientGlow, styles.glowTop, { backgroundColor: isDark ? '#128FC7' : '#62B8D7', transform: [{ translateX: auroraShift.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }) }, { translateY: auroraShift.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) }] }]} />
        <Animated.View style={[styles.ambientGlow, styles.glowBottom, { backgroundColor: isDark ? '#00A77D' : '#59C99E', transform: [{ translateX: auroraShift.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }, { translateY: auroraShift.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) }] }]} />
        <View style={[styles.ambientCore, { backgroundColor: isDark ? '#19799F' : '#7BD5D8' }]} />
        <Animated.View style={[styles.ambientRing, { borderColor: isDark ? '#3CBFDA' : '#51AFAF', transform: [{ rotate: auroraShift.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '12deg'] }) }] }]} />
      </BlurTargetView>

      <ScrollView
        contentContainerStyle={[styles.content, {
          minHeight: height,
          paddingTop: (Platform.OS === 'ios' ? 54 : StatusBar.currentHeight || 24) + 18,
          paddingBottom: (Platform.OS === 'ios' ? 30 : 20) + 18,
          paddingHorizontal: width < 360 ? 22 : 28,
        }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainArea}>
          <View style={styles.brandBlock}>
            <Animated.View style={{ transform: [{ scale: logoScale }, { translateY: logoFloat }] }}>
              <AppLogo width={logoWidth} />
            </Animated.View>
            <Text style={[styles.brandName, { color: colors.text }]}>CreatorStudio</Text>
            <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>Your Personal Content Workspace</Text>
          </View>

          <View style={[styles.greetingPill, { backgroundColor: colors.primaryLight, borderColor: `${colors.primary}48` }]}>
            <Text style={[styles.greeting, { color: colors.primaryOnLight }]}>Hey Creator! 👋</Text>
          </View>
        </View>

        <View style={styles.actionArea}>
          <LiquidGlassButton colors={colors} isDark={isDark} blurTarget={blurTarget} onPress={openHome} />
          <Text style={[styles.footer, { color: colors.textMuted }]}>Plan <Text style={{ color: colors.primary }}>•</Text> Create <Text style={{ color: colors.primary }}>•</Text> Grow</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'space-between' },
  mainArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', paddingBottom: 28 },
  brandBlock: { width: '100%', alignItems: 'center' },
  brandName: { fontSize: 25, fontWeight: '900', letterSpacing: -0.3, marginTop: 14 },
  brandTagline: { fontSize: 11, fontWeight: '600', letterSpacing: 0.25, marginTop: 6 },
  greetingPill: { minHeight: 40, borderWidth: 1, borderRadius: 20, paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center', marginTop: 42 },
  greeting: { fontSize: 14, fontWeight: '800', letterSpacing: 0.1 },
  actionArea: { width: '100%', alignItems: 'center', gap: 18 },
  ctaOuter: { height: 82, width: '100%', maxWidth: 430, overflow: 'hidden', borderWidth: 1.2, justifyContent: 'center', shadowOpacity: 0.25, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 8, backgroundColor: 'transparent' },
  slideProgress: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 44 },
  ctaCopy: { position: 'absolute', left: 75, right: 58, alignItems: 'center', justifyContent: 'center' },
  ctaTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.1 },
  ctaHint: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2, marginTop: 4 },
  slideHandle: { position: 'absolute', left: 9, top: 13, width: 54, height: 54, borderWidth: 1, borderRadius: 27, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  buttonEdge: { ...StyleSheet.absoluteFillObject, borderWidth: 1, opacity: 0.58 },
  footer: { fontSize: 10, fontWeight: '800', letterSpacing: 1.25, marginBottom: 2 },
  ambientGlow: { position: 'absolute', borderRadius: 999 },
  glowTop: { width: 280, height: 280, top: -110, right: -105, opacity: 0.36 },
  glowBottom: { width: 240, height: 240, bottom: -70, left: -125, opacity: 0.12 },
  ambientCore: { position: 'absolute', width: 190, height: 190, right: -90, top: '37%', borderRadius: 100, opacity: 0.08 },
  ambientRing: { position: 'absolute', width: 260, height: 260, right: -155, top: '34%', borderWidth: 1, borderRadius: 140, opacity: 0.3 },
});
