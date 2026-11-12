import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/ThemedText';
import TextInput from '../components/ThemedTextInput';
import GlassCard from '../components/GlassCard';
import { getThemePalette, normalizeCustomHex, visualThemeNames, defaultVisualTheme } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useAppPreferences } from '../context/AppPreferencesContext';

const THEME_DESCRIPTIONS = {
  Minimal: 'Clean, simple and professional',
  Glassmorphism: 'Soft translucent surfaces',
  'Modern Professional': 'Confident blue and slate',
  Nature: 'Grounded greens and warm neutrals',
  Luxury: 'Deep violet with golden accents',
  Neon: 'Dark surfaces with vivid highlights',
  'Soft Pastel': 'Gentle, comfortable colors',
  Midnight: 'Deep navy and cool blue',
  Ocean: 'Fresh blue and teal tones',
  Sunset: 'Warm coral and amber shades',
};

const TYPOGRAPHY_OPTIONS = [
  { value: 'default', label: 'Default', description: 'Clean professional system text' },
  { value: 'modern', label: 'Modern', description: 'Crisp system sans serif' },
  { value: 'rounded', label: 'Rounded', description: 'Friendly rounded system text' },
];

const ACCENT_COLORS = [
  { name: 'Green', hex: '#15803D' },
  { name: 'Blue', hex: '#3659C9' },
  { name: 'Purple', hex: '#8055C7' },
  { name: 'Pink', hex: '#DB4C85' },
  { name: 'Orange', hex: '#EA7835' },
  { name: 'Red', hex: '#C43D4D' },
  { name: 'Teal', hex: '#0F8B8D' },
  { name: 'Yellow', hex: '#D4A017' },
  { name: 'Cyan', hex: '#0891B2' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Black', hex: '#1F2937' },
  { name: 'Gray', hex: '#64748B' },
  { name: 'Brown', hex: '#A16207' },
  { name: 'Coral', hex: '#F97373' },
  { name: 'Lavender', hex: '#A78BFA' },
];

function getSwatchCheckColor(hex) {
  const channels = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.179 ? '#17202A' : '#FFFFFF';
}

function ThemeSwatch({ name, colors, selected, onPress }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.themeTile, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border }]}>
    <View style={[styles.swatchHeader, { backgroundColor: colors.background }]}>
      <View style={[styles.swatchLine, { backgroundColor: colors.text }]} />
      <View style={[styles.swatchLineShort, { backgroundColor: colors.textMuted }]} />
      <View style={[styles.swatchCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <View style={[styles.swatchDot, { backgroundColor: colors.primary }]} />
        <View style={[styles.swatchDot, { backgroundColor: colors.secondary }]} />
        <View style={[styles.swatchDot, { backgroundColor: colors.success }]} />
      </View>
      {selected ? <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}><Ionicons name="checkmark" size={13} color={colors.onPrimary} /></View> : null}
    </View>
    <Text style={[styles.tileTitle, { color: colors.text }]}>{name}</Text>
    <Text style={[styles.tileDescription, { color: colors.textSecondary }]}>{THEME_DESCRIPTIONS[name]}</Text>
  </Pressable>;
}

export default function ThemeSelectionScreen({ navigation }) {
  const { colors, isDark, themeName, customAccent, typographyStyle, setVisualPreferences } = useTheme();
  const { ready: preferencesReady } = useAppPreferences();
  const [draftTheme, setDraftTheme] = useState(themeName || defaultVisualTheme);
  const [accentInput, setAccentInput] = useState(customAccent || '');
  const [draftTypography, setDraftTypography] = useState(typographyStyle || 'default');
  const [saving, setSaving] = useState(false);
  const [showAccentError, setShowAccentError] = useState(false);

  useEffect(() => {
    if (!preferencesReady) return;
    setDraftTheme(themeName || defaultVisualTheme);
    setAccentInput(customAccent || '');
    setDraftTypography(typographyStyle || 'default');
    setShowAccentError(false);
  }, [preferencesReady, themeName, customAccent, typographyStyle]);

  const normalizedAccent = normalizeCustomHex(accentInput);
  const previewColors = useMemo(() => getThemePalette(draftTheme, isDark ? 'dark' : 'light', normalizedAccent), [draftTheme, isDark, normalizedAccent]);

  const apply = async () => {
    if (accentInput.trim() && !normalizedAccent) {
      setShowAccentError(true);
      return;
    }
    setShowAccentError(false);
    setSaving(true);
    try {
      await setVisualPreferences({ visualTheme: draftTheme, customAccent: normalizedAccent, typographyStyle: draftTypography });
      Alert.alert('Theme applied', `${draftTheme} is now active throughout CreatorStudio.`);
      navigation.goBack();
    } catch (error) {
      console.warn('Could not save visual theme:', error);
      Alert.alert('Could not apply theme', 'Your previous appearance is still active. Please try again.');
    } finally { setSaving(false); }
  };

  const confirmReset = async () => {
    setSaving(true);
    try {
      await setVisualPreferences({ visualTheme: defaultVisualTheme, customAccent: null, typographyStyle: 'default' });
      setDraftTheme(defaultVisualTheme);
      setAccentInput('');
      setDraftTypography('default');
      setShowAccentError(false);
      Alert.alert('Theme reset', 'Your theme customizations have been restored to the defaults.');
    } catch (error) {
      console.warn('Could not reset theme customization:', error);
      Alert.alert('Could not reset theme', 'Your current theme settings are unchanged. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const requestReset = () => {
    Alert.alert(
      'Reset Theme?',
      'Are you sure you want to reset your theme customization? Your current custom color and typography selections will be replaced with the default settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: confirmReset },
      ]
    );
  };

  const selectedAccent = ACCENT_COLORS.find((color) => color.hex === normalizedAccent) || null;

  return <View style={[styles.container, { backgroundColor: colors.background }]}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable>
        <View style={styles.headerCopy}><Text style={[styles.eyebrow, { color: colors.textSecondary }]}>MAKE IT YOURS</Text><Text style={[styles.title, { color: colors.text }]}>Theme Selection</Text></View>
      </View>

      <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: colors.text }]}>Choose a visual theme</Text><Text style={[styles.sectionHint, { color: colors.textMuted }]}>{isDark ? 'Dark palette preview' : 'Light palette preview'}</Text></View>
      <View style={styles.themeGrid}>
        {visualThemeNames.map((name) => <ThemeSwatch key={name} name={name} colors={getThemePalette(name, isDark ? 'dark' : 'light', normalizedAccent)} selected={draftTheme === name} onPress={() => setDraftTheme(name)} />)}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12, marginTop: 10 }]}>Custom accent color</Text>
      <GlassCard padding={16} style={styles.card}>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>Choose a color to update the main accent, buttons, selected icons and highlights. You can also enter a custom color below.</Text>
        <View style={styles.colorGrid}>
          {ACCENT_COLORS.map((color) => {
            const selected = color.hex === normalizedAccent;
            return <Pressable key={color.name} accessibilityRole="radio" accessibilityLabel={`${color.name}, ${color.hex}`} accessibilityState={{ checked: selected }} onPress={() => { setAccentInput(color.hex); setShowAccentError(false); }} style={styles.swatchOption}>
              <View style={[styles.swatchRing, { borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.surface }]}>
                <View style={[styles.colorSwatch, { backgroundColor: color.hex }]}>
                  {selected ? <Ionicons name="checkmark" size={18} color={getSwatchCheckColor(color.hex)} /> : null}
                </View>
              </View>
              <Text numberOfLines={1} style={[styles.swatchName, { color: selected ? colors.text : colors.textSecondary }]}>{color.name}</Text>
            </Pressable>;
          })}
        </View>
        <View style={[styles.selectedColorSummary, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={[styles.colorPreview, { backgroundColor: normalizedAccent || previewColors.primary, borderColor: colors.border }]} />
          <View style={styles.selectedColorCopy}>
            <Text style={[styles.selectedColorName, { color: colors.text }]}>{normalizedAccent ? selectedAccent?.name || 'Custom color' : 'No custom color selected'}</Text>
            <Text style={[styles.helperText, { color: colors.textMuted }]}>{normalizedAccent || 'Choose a color or enter a HEX value'}</Text>
          </View>
        </View>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Or enter a custom HEX code</Text>
        <View style={styles.customRow}>
          <TextInput accessibilityLabel="Custom accent HEX color" value={accentInput} onChangeText={(value) => { setAccentInput(value); setShowAccentError(false); }} autoCapitalize="characters" autoCorrect={false} maxLength={7} placeholder="#7057F5" placeholderTextColor={colors.textMuted} style={[styles.hexInput, { backgroundColor: colors.surface, borderColor: showAccentError ? colors.danger : colors.border, color: colors.text }]} />
        </View>
        {showAccentError ? <Text style={[styles.errorText, { color: colors.danger }]}>Enter a valid HEX color, such as #7057F5.</Text> : <Text style={[styles.helperText, { color: colors.textMuted }]}>Accepts #RGB or #RRGGBB.</Text>}
        <View style={[styles.livePreview, { backgroundColor: previewColors.background, borderColor: previewColors.border }]}>
          <Text style={[styles.previewTitle, { color: previewColors.text }]}>Live preview</Text>
          <Text style={[styles.bodyText, { color: previewColors.textSecondary }]}>Cards, text and surfaces keep the selected theme contrast.</Text>
          <View style={styles.previewActions}><View style={[styles.previewPill, { backgroundColor: previewColors.primaryLight }]}><Text style={[styles.previewPillText, { color: previewColors.primaryOnLight }]}>Selected</Text></View><View style={[styles.previewButton, { backgroundColor: previewColors.primary }]}><Text style={[styles.previewButtonText, { color: previewColors.onPrimary }]}>Apply color</Text></View></View>
          <View style={[styles.previewTrack, { backgroundColor: previewColors.surfaceSecondary }]}><View style={[styles.previewProgress, { backgroundColor: previewColors.secondary }]} /></View>
        </View>
      </GlassCard>

      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Typography</Text>
      <GlassCard padding={14} style={styles.card}>
        {TYPOGRAPHY_OPTIONS.map((option, index) => {
          const selected = draftTypography === option.value;
          const optionFont = option.value === 'rounded' ? (Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-rounded') : option.value === 'modern' ? (Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif') : undefined;
          return <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => setDraftTypography(option.value)} style={[styles.typeRow, { borderBottomColor: colors.border }, index === TYPOGRAPHY_OPTIONS.length - 1 && styles.lastTypeRow]}>
            <View style={{ flex: 1 }}><Text style={[styles.typeTitle, { color: colors.text, fontFamily: optionFont }]}>{option.label}</Text><Text style={[styles.tileDescription, { color: colors.textSecondary }]}>{option.description}</Text></View>
            <Text style={[styles.typeSample, { color: colors.primaryText, fontFamily: optionFont }]}>Aa</Text>
            {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primaryText} /> : <View style={[styles.radioEmpty, { borderColor: colors.border }]} />}
          </Pressable>;
        })}
      </GlassCard>

      <View style={styles.footerActions}>
        <Pressable accessibilityRole="button" disabled={saving || !preferencesReady} onPress={requestReset} style={[styles.resetButton, { borderColor: colors.border, backgroundColor: colors.surface, opacity: preferencesReady && !saving ? 1 : 0.6 }]}><Text style={[styles.resetText, { color: colors.textSecondary }]}>Reset</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={saving || !preferencesReady} onPress={apply} style={[styles.applyButton, { backgroundColor: colors.primary, opacity: saving || !preferencesReady ? 0.65 : 1 }]}>{saving ? <Text style={[styles.applyText, { color: colors.onPrimary }]}>Applying…</Text> : <><Ionicons name="checkmark-circle-outline" size={18} color={colors.onPrimary} /><Text style={[styles.applyText, { color: colors.onPrimary }]}>{preferencesReady ? 'Apply theme' : 'Loading…'}</Text></>}</Pressable>
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { paddingHorizontal: 20, paddingTop: 58, paddingBottom: 42 }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 }, backButton: { width: 43, height: 43, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 13 }, headerCopy: { flex: 1 }, eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.6 }, title: { fontSize: 24, fontWeight: '800', marginTop: 3 }, sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }, sectionTitle: { fontSize: 17, fontWeight: '800' }, sectionHint: { fontSize: 10, fontWeight: '600' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }, themeTile: { width: '48.5%', borderWidth: 1.5, borderRadius: 18, overflow: 'hidden', marginBottom: 10 }, swatchHeader: { height: 94, padding: 11, position: 'relative' }, swatchLine: { height: 8, width: '54%', borderRadius: 5, marginTop: 3 }, swatchLineShort: { height: 5, width: '36%', borderRadius: 4, marginTop: 6 }, swatchCard: { height: 31, borderRadius: 10, borderWidth: 1, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 8 }, swatchDot: { width: 12, height: 12, borderRadius: 6 }, selectedBadge: { position: 'absolute', right: 8, top: 8, width: 23, height: 23, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, tileTitle: { fontSize: 12, fontWeight: '800', marginHorizontal: 10, marginTop: 9 }, tileDescription: { fontSize: 9, lineHeight: 14, marginHorizontal: 10, marginTop: 3, marginBottom: 10 },
  card: { marginBottom: 20, borderRadius: 19 }, bodyText: { fontSize: 11, lineHeight: 17 }, colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 16, marginBottom: 16 }, swatchOption: { width: '19%', alignItems: 'center', gap: 5 }, swatchRing: { width: 43, height: 43, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, colorSwatch: { width: 34, height: 34, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, swatchName: { maxWidth: '100%', fontSize: 9, fontWeight: '700', textAlign: 'center' }, selectedColorSummary: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 13, padding: 10, gap: 11 }, selectedColorCopy: { flex: 1 }, selectedColorName: { fontSize: 11, fontWeight: '800' }, inputLabel: { fontSize: 11, fontWeight: '700', marginTop: 15 }, customRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }, hexInput: { flex: 1, minHeight: 45, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13, fontWeight: '700' }, colorPreview: { width: 42, height: 42, borderWidth: 1, borderRadius: 13 }, errorText: { fontSize: 10, marginTop: 6 }, helperText: { fontSize: 10, marginTop: 4 }, livePreview: { marginTop: 15, borderWidth: 1, borderRadius: 16, padding: 13 }, previewTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 }, previewActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 }, previewPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }, previewPillText: { fontSize: 10, fontWeight: '800' }, previewButton: { minHeight: 35, borderRadius: 11, paddingHorizontal: 13, justifyContent: 'center', alignItems: 'center' }, previewButtonText: { fontSize: 10, fontWeight: '800' }, previewTrack: { height: 7, borderRadius: 5, overflow: 'hidden', marginTop: 13 }, previewProgress: { width: '62%', height: '100%', borderRadius: 5 },
  typeRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8, gap: 10 }, lastTypeRow: { borderBottomWidth: 0 }, typeTitle: { fontSize: 12, fontWeight: '800' }, typeSample: { fontSize: 21, fontWeight: '800', marginHorizontal: 3 }, radioEmpty: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5 }, footerActions: { flexDirection: 'row', gap: 10 }, resetButton: { minHeight: 49, borderWidth: 1, borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }, resetText: { fontSize: 12, fontWeight: '800' }, applyButton: { flex: 1, minHeight: 49, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 }, applyText: { fontSize: 12, fontWeight: '800' },
});
