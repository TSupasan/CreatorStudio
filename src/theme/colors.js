const THEME_DEFINITIONS = {
  Aurora: {
    description: 'Electric blue and emerald light on deep, cinematic surfaces.',
    light: { background: '#EDF7F5', backgroundSecondary: '#DDEDEA', surface: '#F9FFFD', surfaceElevated: '#FFFFFF', card: 'rgba(255,255,255,0.86)', text: '#102622', textSecondary: '#4D6B65', textMuted: '#738E88', accent: '#087F79', accentSecondary: '#176FA8', border: '#C9DFDA', divider: '#DCE9E6', success: '#16825D', warning: '#A45D00', error: '#B4233B', inputBackground: '#F3FAF8', tabBarBackground: 'rgba(249,255,253,0.90)' },
    dark: { background: '#071311', backgroundSecondary: '#0C1E1B', surface: '#112522', surfaceElevated: '#18332F', card: 'rgba(17,37,34,0.94)', text: '#E9FFF8', textSecondary: '#A9CEC2', textMuted: '#779D92', accent: '#49E5C3', accentSecondary: '#68BDF4', border: '#244B43', divider: '#1D3933', success: '#65EFAE', warning: '#FFD166', error: '#FF7892', inputBackground: '#0C1C19', tabBarBackground: 'rgba(12,29,26,0.94)' },
  },
  'Frosted Rose': {
    description: 'Soft rose accents, pale blush surfaces and gentle contrast.',
    light: { background: '#FBF3F6', backgroundSecondary: '#F4E8ED', surface: '#FFFBFD', surfaceElevated: '#FFFFFF', card: 'rgba(255,251,253,0.90)', text: '#35252E', textSecondary: '#765E6A', textMuted: '#9D8792', accent: '#A94F77', accentSecondary: '#C47A91', border: '#E9D8E0', divider: '#F0E3E9', success: '#277A59', warning: '#A45D00', error: '#B4233B', inputBackground: '#FFF8FA', tabBarBackground: 'rgba(255,251,253,0.92)' },
    dark: { background: '#1A1419', backgroundSecondary: '#241B22', surface: '#2A2028', surfaceElevated: '#362832', card: 'rgba(42,32,40,0.94)', text: '#FFF5F9', textSecondary: '#D1B9C5', textMuted: '#A58C99', accent: '#E7A0BE', accentSecondary: '#F0B3A3', border: '#513B49', divider: '#3C2C37', success: '#70D6A4', warning: '#F0C16C', error: '#FF879B', inputBackground: '#211820', tabBarBackground: 'rgba(35,26,33,0.95)' },
  },
  'Warm Studio': {
    description: 'Warm orange details with calm stone and charcoal neutrals.',
    light: { background: '#F7F3EE', backgroundSecondary: '#EEE7DE', surface: '#FFFCF8', surfaceElevated: '#FFFFFF', card: 'rgba(255,252,248,0.90)', text: '#302821', textSecondary: '#6F6255', textMuted: '#958779', accent: '#B85F25', accentSecondary: '#7E766B', border: '#E3D8CB', divider: '#EEE5DB', success: '#327A58', warning: '#A45D00', error: '#B4233B', inputBackground: '#FAF6F1', tabBarBackground: 'rgba(255,252,248,0.93)' },
    dark: { background: '#171614', backgroundSecondary: '#211F1B', surface: '#292621', surfaceElevated: '#35312A', card: 'rgba(41,38,33,0.94)', text: '#F8F3EA', textSecondary: '#C9BDAE', textMuted: '#9D9082', accent: '#F1A36A', accentSecondary: '#B7A58E', border: '#4C4439', divider: '#39342D', success: '#78D6A0', warning: '#F4C56E', error: '#FF8791', inputBackground: '#201E1A', tabBarBackground: 'rgba(32,30,26,0.95)' },
  },
  'Ocean Glass': {
    description: 'Cool blue, cyan and teal tones with clear, airy surfaces.',
    light: { background: '#EFF7FA', backgroundSecondary: '#E0EFF4', surface: '#FBFEFF', surfaceElevated: '#FFFFFF', card: 'rgba(251,254,255,0.88)', text: '#18313B', textSecondary: '#55717A', textMuted: '#8199A1', accent: '#147A9C', accentSecondary: '#13A69B', border: '#D2E4E9', divider: '#E2EEF1', success: '#16825D', warning: '#A45D00', error: '#B4233B', inputBackground: '#F5FBFD', tabBarBackground: 'rgba(251,254,255,0.92)' },
    dark: { background: '#0B1920', backgroundSecondary: '#10252E', surface: '#142A34', surfaceElevated: '#1D3944', card: 'rgba(20,42,52,0.94)', text: '#EEFBFF', textSecondary: '#B2CDD5', textMuted: '#7F9EA7', accent: '#64D2ED', accentSecondary: '#5BE0C6', border: '#2B4C58', divider: '#203B45', success: '#69DDA5', warning: '#FFD166', error: '#FF8297', inputBackground: '#10232B', tabBarBackground: 'rgba(16,37,45,0.95)' },
  },
  'Midnight Glass': {
    description: 'Near-black navy with crisp electric blue highlights.',
    light: { background: '#F0F3F9', backgroundSecondary: '#E2E8F2', surface: '#FCFDFF', surfaceElevated: '#FFFFFF', card: 'rgba(252,253,255,0.90)', text: '#1A263A', textSecondary: '#58677E', textMuted: '#8390A5', accent: '#365AA0', accentSecondary: '#477FAE', border: '#D7DFEA', divider: '#E5EAF1', success: '#287A5A', warning: '#A45D00', error: '#B4233B', inputBackground: '#F7F9FC', tabBarBackground: 'rgba(252,253,255,0.92)' },
    dark: { background: '#090E1B', backgroundSecondary: '#10182A', surface: '#141E33', surfaceElevated: '#1C2B46', card: 'rgba(20,30,51,0.95)', text: '#F2F5FF', textSecondary: '#B3C0DD', textMuted: '#7E8DAF', accent: '#83A8FF', accentSecondary: '#54C7E8', border: '#2A3A5B', divider: '#1E2C45', success: '#69DDA5', warning: '#FFD166', error: '#FF8297', inputBackground: '#10192A', tabBarBackground: 'rgba(14,22,39,0.96)' },
  },
  'Minimal Studio': {
    description: 'A restrained neutral palette with a confident blue accent.',
    light: { background: '#F4F5F7', backgroundSecondary: '#E9EBEF', surface: '#FFFFFF', surfaceElevated: '#FFFFFF', card: 'rgba(255,255,255,0.92)', text: '#20242B', textSecondary: '#5F6874', textMuted: '#89919A', accent: '#3659A8', accentSecondary: '#59768E', border: '#DDE1E6', divider: '#EAEDF0', success: '#287A5A', warning: '#A45D00', error: '#B4233B', inputBackground: '#F8F9FA', tabBarBackground: 'rgba(255,255,255,0.94)' },
    dark: { background: '#111317', backgroundSecondary: '#191C22', surface: '#20242B', surfaceElevated: '#292E37', card: 'rgba(32,36,43,0.95)', text: '#F4F5F7', textSecondary: '#BEC3CA', textMuted: '#858D98', accent: '#8AABF2', accentSecondary: '#77B7C8', border: '#373D47', divider: '#2B3039', success: '#69DDA5', warning: '#FFD166', error: '#FF8297', inputBackground: '#191C22', tabBarBackground: 'rgba(26,29,35,0.96)' },
  },
  'Apple Liquid Glass': {
    description: 'Soft frosted surfaces with clear, elegant blue accents.',
    glassMaterial: true,
    glassBorder: 'rgba(255,255,255,0.76)',
    glassHighlight: ['rgba(255,255,255,0.52)', 'rgba(255,255,255,0.08)'],
    glassBlurIntensity: 38,
    glassShadowOpacity: 0.12,
    light: { background: '#EEF3F8', backgroundSecondary: '#E1EAF3', surface: '#F7FAFD', surfaceElevated: '#FFFFFF', card: 'rgba(255,255,255,0.62)', text: '#172437', textSecondary: '#506177', textMuted: '#748197', accent: '#1877E8', accentSecondary: '#54B8E8', border: '#D7E0EA', divider: '#E2E9F0', success: '#13845D', warning: '#9B5C00', error: '#B4233B', inputBackground: 'rgba(255,255,255,0.78)', tabBarBackground: 'rgba(247,250,253,0.72)' },
    dark: { background: '#080E18', backgroundSecondary: '#111C2A', surface: '#172233', surfaceElevated: '#1D2B40', card: 'rgba(25,40,60,0.72)', text: '#F3F7FE', textSecondary: '#B7C5D7', textMuted: '#8494AA', accent: '#70AEFF', accentSecondary: '#61D2EE', border: '#35465D', divider: '#26374D', success: '#65DDA6', warning: '#FFD166', error: '#FF8297', inputBackground: 'rgba(21,34,52,0.88)', tabBarBackground: 'rgba(15,26,40,0.82)' },
  },
  'Liquid Glass Aurora': {
    description: 'A glowing blue and cyan aurora over deep glass surfaces.',
    glassMaterial: true,
    auroraBackdrop: true,
    glassBorder: 'rgba(182,242,255,0.38)',
    glassHighlight: ['rgba(216,250,255,0.25)', 'rgba(85,221,244,0.04)'],
    glassBlurIntensity: 42,
    glassShadowOpacity: 0.16,
    light: { background: '#EAF5FB', backgroundSecondary: '#DDF2F0', surface: '#F5FBFD', surfaceElevated: '#FFFFFF', card: 'rgba(242,252,255,0.68)', text: '#10243A', textSecondary: '#436477', textMuted: '#6E8797', accent: '#087FC4', accentSecondary: '#0FAF9C', border: '#B8DDE5', divider: '#D6E9EC', success: '#13845D', warning: '#9B5C00', error: '#B4233B', inputBackground: 'rgba(245,252,255,0.86)', tabBarBackground: 'rgba(239,250,253,0.78)' },
    dark: { background: '#06121E', backgroundSecondary: '#082730', surface: '#0D2831', surfaceElevated: '#123541', card: 'rgba(10,37,49,0.74)', text: '#E9FBFF', textSecondary: '#A7D4D9', textMuted: '#6FA2AA', accent: '#42C8FF', accentSecondary: '#39E0B5', border: '#235763', divider: '#183D49', success: '#62E3A4', warning: '#FFD166', error: '#FF8297', inputBackground: 'rgba(10,34,45,0.90)', tabBarBackground: 'rgba(7,27,37,0.86)' },
  },
};

export const visualThemeNames = Object.keys(THEME_DEFINITIONS);
export const defaultVisualTheme = 'Minimal Studio';

const legacyThemeMap = {
  Minimal: 'Minimal Studio',
  Glassmorphism: 'Frosted Rose',
  'Modern Professional': 'Minimal Studio',
  Nature: 'Aurora',
  Luxury: 'Frosted Rose',
  Neon: 'Aurora',
  'Soft Pastel': 'Frosted Rose',
  Midnight: 'Midnight Glass',
  Ocean: 'Ocean Glass',
  Sunset: 'Warm Studio',
};

export function normalizeVisualThemeName(value) {
  if (visualThemeNames.includes(value)) return value;
  return legacyThemeMap[value] || defaultVisualTheme;
}

function normalizeHex(value) {
  if (typeof value !== 'string') return null;
  const hex = value.trim().replace(/^#/, '');
  if (/^[0-9A-Fa-f]{3}$/.test(hex)) return `#${hex.split('').map((part) => `${part}${part}`).join('').toUpperCase()}`;
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) return `#${hex.toUpperCase()}`;
  return null;
}

function getLuminance(hex) {
  const rgb = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255).map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function getContrastText(hex) {
  return getLuminance(hex) > 0.179 ? '#17202A' : '#FFFFFF';
}

function contrastRatio(first, second) {
  const [lighter, darker] = [getLuminance(first), getLuminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function blendHex(hex, target, ratio) {
  const sourceRgb = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  const targetRgb = [1, 3, 5].map((index) => parseInt(target.slice(index, index + 2), 16));
  return `#${sourceRgb.map((channel, index) => Math.round(channel * (1 - ratio) + targetRgb[index] * ratio).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function ensureAccessibleAccent(accent, surface) {
  if (contrastRatio(accent, surface) >= 4.5) return accent;
  const toward = getLuminance(surface) > 0.5 ? '#000000' : '#FFFFFF';
  for (let step = 1; step <= 20; step += 1) {
    const candidate = blendHex(accent, toward, step / 20);
    if (contrastRatio(candidate, surface) >= 4.5) return candidate;
  }
  return getContrastText(surface);
}

function createCompatibilityPalette(theme, mode) {
  const base = THEME_DEFINITIONS[normalizeVisualThemeName(theme)][mode === 'dark' ? 'dark' : 'light'];
  const primaryLight = blendHex(base.accent, mode === 'dark' ? '#FFFFFF' : '#FFFFFF', mode === 'dark' ? 0.78 : 0.88);
  const onPrimary = getContrastText(base.accent);
  return {
    ...base,
    primary: base.accent,
    secondary: base.accentSecondary,
    danger: base.error,
    glass: base.card,
    tabBar: base.tabBarBackground,
    surfaceSecondary: base.backgroundSecondary,
    primaryLight,
    primaryText: ensureAccessibleAccent(base.accent, base.surface),
    primaryOnLight: getContrastText(primaryLight),
    onPrimary,
    statusIdea: base.textMuted,
    statusPlanning: base.warning,
    statusEditing: mode === 'dark' ? '#6CA8E8' : '#3975C6',
    statusReady: base.accent,
    statusPublished: base.success,
    priorityLow: base.success,
    priorityMedium: base.warning,
    priorityHigh: base.error,
    heroGradient: [blendHex(base.accent, '#000000', 0.12), base.accent, blendHex(base.accent, '#FFFFFF', 0.16)],
    heroText: onPrimary,
    heroMuted: onPrimary,
    heroDecoration: `${onPrimary}18`,
    heroIconBackground: `${onPrimary}24`,
    modalOverlay: mode === 'dark' ? 'rgba(0,0,0,0.58)' : 'rgba(23,32,42,0.34)',
    cardRadius: 22,
    buttonRadius: 15,
    cardElevation: mode === 'dark' ? 3 : 2,
    shadowColor: mode === 'dark' ? '#000000' : base.accent,
    blurIntensity: mode === 'dark' ? 52 : 68,
  };
}

export function getThemePalette(themeName = defaultVisualTheme, mode = 'light', customAccent = null) {
  const palette = createCompatibilityPalette(themeName, mode);
  const accent = normalizeHex(customAccent);
  if (!accent) return palette;

  const primaryLight = blendHex(accent, '#FFFFFF', mode === 'dark' ? 0.78 : 0.88);
  const onPrimary = getContrastText(accent);
  const accessibleAccent = ensureAccessibleAccent(accent, palette.surface);
  return {
    ...palette,
    accent,
    primary: accent,
    primaryText: accessibleAccent,
    onPrimary,
    primaryLight,
    primaryOnLight: getContrastText(primaryLight),
    accentSecondary: blendHex(accent, palette.accentSecondary, 0.45),
    secondary: blendHex(accent, palette.accentSecondary, 0.45),
    heroGradient: [blendHex(accent, '#000000', 0.12), accent, blendHex(accent, '#FFFFFF', 0.16)],
    heroText: onPrimary,
    heroMuted: onPrimary,
    heroDecoration: `${onPrimary}18`,
    heroIconBackground: `${onPrimary}24`,
  };
}

export function normalizeCustomHex(value) {
  return normalizeHex(value);
}
