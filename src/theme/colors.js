
export const lightColors = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF0F6',

  primary: '#7057F5',
  primaryLight: '#EAE5FF',
  secondary: '#18B8A4',

  text: '#171827',
  textSecondary: '#777B8D',
  textMuted: '#A2A5B3',

  border: '#E7E8EF',
  glass: 'rgba(255, 255, 255, 0.72)',

  success: '#20A879',
  warning: '#F0A33A',
  danger: '#E85D75',

  tabBar: 'rgba(255, 255, 255, 0.88)',
  overlay: 'rgba(20, 20, 40, 0.08)',
};

export const darkColors = {
  background: '#10111B',
  surface: '#1B1D2B',
  surfaceSecondary: '#25283A',

  primary: '#9B87FF',
  primaryLight: '#302957',
  secondary: '#38D9C5',

  text: '#F5F5FC',
  textSecondary: '#B1B3C4',
  textMuted: '#777B91',

  border: '#303246',
  glass: 'rgba(35, 37, 55, 0.78)',

  success: '#43D6A0',
  warning: '#FFC16B',
  danger: '#FF718A',

  tabBar: 'rgba(27, 29, 43, 0.90)',
  overlay: 'rgba(0, 0, 0, 0.30)',
};

const makePalette = (values, effects = {}) => {
  const onPrimary = values.onPrimary || getContrastText(values.primary);
  return {
    ...values,
    onPrimary,
    primaryText: values.primaryText || ensureAccessibleAccent(values.primary, values.surface),
    primaryOnLight: values.primaryOnLight || getContrastText(values.primaryLight),
    success: values.success || '#16825D',
    warning: values.warning || '#A45D00',
    danger: values.danger || '#B4233B',
    statusIdea: values.statusIdea || values.textMuted,
    statusPlanning: values.statusPlanning || values.warning || '#C47A1A',
    statusEditing: values.statusEditing || '#3975C6',
    statusReady: values.statusReady || values.primary,
    statusPublished: values.statusPublished || values.success || '#16825D',
    priorityLow: values.priorityLow || values.success || '#16825D',
    priorityMedium: values.priorityMedium || values.warning || '#C47A1A',
    priorityHigh: values.priorityHigh || values.danger || '#C43F54',
    heroGradient: values.heroGradient || [values.primary, values.secondary, values.primary],
    heroText: values.heroText || onPrimary,
    heroMuted: values.heroMuted || onPrimary,
    heroDecoration: values.heroDecoration || 'rgba(255,255,255,0.10)',
    heroIconBackground: values.heroIconBackground || 'rgba(255,255,255,0.18)',
    modalOverlay: values.modalOverlay || 'rgba(0, 0, 0, 0.46)',
    cardRadius: values.cardRadius || 22,
    buttonRadius: values.buttonRadius || effects.buttonRadius || Math.max(10, (effects.cardRadius || 22) - 8),
    cardElevation: values.cardElevation || 3,
    shadowColor: values.shadowColor || '#000000',
    blurIntensity: values.blurIntensity || 65,
    ...effects,
  };
};

const palettes = {
  Minimal: {
    light: makePalette(lightColors, { cardRadius: 22, cardElevation: 3, shadowColor: '#7770B8', blurIntensity: 75 }),
    dark: makePalette(darkColors, { cardRadius: 22, cardElevation: 3, shadowColor: '#000000', blurIntensity: 55 }),
  },
  Glassmorphism: {
    light: makePalette({ ...lightColors, background: '#EEF2F8', surface: '#FFFFFF', surfaceSecondary: '#E7ECF5', primary: '#5A5DD8', primaryLight: '#E4E5FF', secondary: '#2BAFAD', glass: 'rgba(255, 255, 255, 0.68)', tabBar: 'rgba(255, 255, 255, 0.72)', border: '#DDE4F0', overlay: 'rgba(39, 47, 83, 0.12)' }, { cardRadius: 26, cardElevation: 5, shadowColor: '#727BB3', blurIntensity: 82 }),
    dark: makePalette({ ...darkColors, background: '#171A2B', surface: '#252A40', surfaceSecondary: '#303650', primary: '#A8A5FF', primaryLight: '#39385F', secondary: '#67D8CF', glass: 'rgba(44, 49, 75, 0.72)', tabBar: 'rgba(38, 43, 65, 0.76)', border: '#454B6B', overlay: 'rgba(0, 0, 0, 0.38)' }, { cardRadius: 26, cardElevation: 4, shadowColor: '#050611', blurIntensity: 62 }),
  },
  'Modern Professional': {
    light: makePalette({ ...lightColors, background: '#F3F6FA', surface: '#FFFFFF', surfaceSecondary: '#E9EFF7', primary: '#1769AA', primaryLight: '#DCEEFF', secondary: '#247F85', text: '#15263A', textSecondary: '#526579', textMuted: '#77889A', border: '#D9E2EC', glass: '#FFFFFF', tabBar: '#FFFFFF', overlay: 'rgba(17, 42, 66, 0.12)' }, { cardRadius: 15, cardElevation: 2, shadowColor: '#476781', blurIntensity: 72 }),
    dark: makePalette({ ...darkColors, background: '#111B27', surface: '#1B2A3A', surfaceSecondary: '#25384C', primary: '#62B7F0', primaryLight: '#254967', secondary: '#54C8BB', text: '#EFF6FC', textSecondary: '#B0C2D2', textMuted: '#8197AA', border: '#31475B', glass: '#1B2A3A', tabBar: '#1B2A3A', overlay: 'rgba(2, 11, 20, 0.42)' }, { cardRadius: 15, cardElevation: 2, shadowColor: '#020A11', blurIntensity: 55 }),
  },
  Nature: {
    light: makePalette({ ...lightColors, background: '#F2F7F0', surface: '#FCFFFA', surfaceSecondary: '#E6F0E2', primary: '#34764C', primaryLight: '#DCEEDD', secondary: '#8A9F43', text: '#203127', textSecondary: '#5D7163', textMuted: '#829187', border: '#D6E4D4', glass: '#FCFFFA', tabBar: '#F8FFF7', overlay: 'rgba(24, 52, 31, 0.12)' }, { cardRadius: 21, cardElevation: 2, shadowColor: '#54745B', blurIntensity: 70 }),
    dark: makePalette({ ...darkColors, background: '#121D17', surface: '#1E2D23', surfaceSecondary: '#2A3B30', primary: '#86C68F', primaryLight: '#2E5037', secondary: '#C4C879', text: '#EFF8EF', textSecondary: '#B7CABA', textMuted: '#849B88', border: '#3B5141', glass: '#1E2D23', tabBar: '#1B2A20', overlay: 'rgba(0, 0, 0, 0.40)' }, { cardRadius: 21, cardElevation: 2, shadowColor: '#050C07', blurIntensity: 52 }),
  },
  Luxury: {
    light: makePalette({ ...lightColors, background: '#F6F2F8', surface: '#FFFCF8', surfaceSecondary: '#EFE7F0', primary: '#70429A', primaryLight: '#EDE1F5', secondary: '#B88B3D', text: '#2B1E34', textSecondary: '#75677B', textMuted: '#A195A5', border: '#E5D9E8', glass: '#FFFCF8', tabBar: '#FFFDF9', overlay: 'rgba(39, 22, 51, 0.14)' }, { cardRadius: 19, cardElevation: 4, shadowColor: '#71527F', blurIntensity: 74 }),
    dark: makePalette({ ...darkColors, background: '#17121D', surface: '#261E2E', surfaceSecondary: '#352A3C', primary: '#D0A9F4', primaryLight: '#443052', secondary: '#E0BD70', text: '#FBF6FF', textSecondary: '#CCBFD3', textMuted: '#97899D', border: '#4A3A51', glass: '#261E2E', tabBar: '#241B2B', overlay: 'rgba(0, 0, 0, 0.44)' }, { cardRadius: 19, cardElevation: 3, shadowColor: '#050207', blurIntensity: 55 }),
  },
  Neon: {
    light: makePalette({ ...lightColors, background: '#F1F7F7', surface: '#FFFFFF', surfaceSecondary: '#E3F1F0', primary: '#087F79', primaryLight: '#CFF5EF', secondary: '#6153D8', text: '#10272A', textSecondary: '#4F6A6A', textMuted: '#7D9694', border: '#CDE1DF', glass: '#FFFFFF', tabBar: '#F8FFFF', overlay: 'rgba(6, 44, 44, 0.14)', success: '#087E58', warning: '#A35A00', danger: '#B52B59' }, { cardRadius: 14, cardElevation: 1, shadowColor: '#2D7773', blurIntensity: 68 }),
    dark: makePalette({ ...darkColors, background: '#080D13', surface: '#111B24', surfaceSecondary: '#1A2832', primary: '#49F2D1', primaryLight: '#153F3B', secondary: '#B5FF4D', text: '#E9FFF9', textSecondary: '#A5C8C1', textMuted: '#70958F', border: '#24443F', glass: '#111B24', tabBar: '#0D171E', overlay: 'rgba(0, 0, 0, 0.55)', success: '#65EFAE', warning: '#FFD166', danger: '#FF6F91' }, { cardRadius: 14, cardElevation: 4, shadowColor: '#00DAB8', blurIntensity: 45 }),
  },
  'Soft Pastel': {
    light: makePalette({ ...lightColors, background: '#FAF5F8', surface: '#FFFCFD', surfaceSecondary: '#F2EAF1', primary: '#906AA7', primaryLight: '#F0E3F5', secondary: '#5F9D9A', text: '#352B3A', textSecondary: '#756A7B', textMuted: '#A095A4', border: '#E9DDE8', glass: '#FFFCFD', tabBar: '#FFFBFE', overlay: 'rgba(70, 46, 77, 0.11)' }, { cardRadius: 25, cardElevation: 2, shadowColor: '#A38AA1', blurIntensity: 76 }),
    dark: makePalette({ ...darkColors, background: '#1B1720', surface: '#29232F', surfaceSecondary: '#39313F', primary: '#D5B3E6', primaryLight: '#493951', secondary: '#9BD6CE', text: '#FBF5FC', textSecondary: '#CCBFCE', textMuted: '#95889A', border: '#4B3E4D', glass: '#29232F', tabBar: '#28222E', overlay: 'rgba(0, 0, 0, 0.42)' }, { cardRadius: 25, cardElevation: 2, shadowColor: '#09060A', blurIntensity: 55 }),
  },
  Midnight: {
    light: makePalette({ ...lightColors, background: '#EDF1F8', surface: '#FFFFFF', surfaceSecondary: '#E1E8F3', primary: '#324E83', primaryLight: '#DDE7FA', secondary: '#5A7FA6', text: '#1A263D', textSecondary: '#586781', textMuted: '#8390A4', border: '#D5DFED', glass: '#FFFFFF', tabBar: '#F6F8FC', overlay: 'rgba(14, 27, 51, 0.15)' }, { cardRadius: 18, cardElevation: 3, shadowColor: '#556987', blurIntensity: 72 }),
    dark: makePalette({ ...darkColors, background: '#090F20', surface: '#111B32', surfaceSecondary: '#1A2842', primary: '#90ACFF', primaryLight: '#27395E', secondary: '#62C9D3', text: '#F3F6FF', textSecondary: '#AEBBD5', textMuted: '#7786A5', border: '#2A3A58', glass: '#111B32', tabBar: '#101A30', overlay: 'rgba(0, 0, 0, 0.52)' }, { cardRadius: 18, cardElevation: 3, shadowColor: '#02050B', blurIntensity: 48 }),
  },
  Ocean: {
    light: makePalette({ ...lightColors, background: '#EFF7FA', surface: '#FAFEFF', surfaceSecondary: '#E0F0F5', primary: '#137CA3', primaryLight: '#D6F1FA', secondary: '#16A79B', text: '#15313C', textSecondary: '#53717D', textMuted: '#8199A1', border: '#D3E6EC', glass: '#FAFEFF', tabBar: '#F5FCFE', overlay: 'rgba(11, 54, 72, 0.12)' }, { cardRadius: 20, cardElevation: 2, shadowColor: '#4C8795', blurIntensity: 76 }),
    dark: makePalette({ ...darkColors, background: '#0D1B23', surface: '#142832', surfaceSecondary: '#1E3842', primary: '#60CAE9', primaryLight: '#1D4653', secondary: '#57D7BE', text: '#EDFAFF', textSecondary: '#B2CED6', textMuted: '#7D9EA8', border: '#2A4A55', glass: '#142832', tabBar: '#132731', overlay: 'rgba(0, 0, 0, 0.44)' }, { cardRadius: 20, cardElevation: 2, shadowColor: '#020B0F', blurIntensity: 52 }),
  },
  Sunset: {
    light: makePalette({ ...lightColors, background: '#FFF5F0', surface: '#FFFCFA', surfaceSecondary: '#F9E7DF', primary: '#C95145', primaryLight: '#FBE1DA', secondary: '#E28A38', text: '#3B2526', textSecondary: '#806160', textMuted: '#AA8D8A', border: '#EED8D2', glass: '#FFFCFA', tabBar: '#FFFAF7', overlay: 'rgba(69, 32, 28, 0.12)' }, { cardRadius: 23, cardElevation: 3, shadowColor: '#A56D61', blurIntensity: 78 }),
    dark: makePalette({ ...darkColors, background: '#1D1317', surface: '#2C1E22', surfaceSecondary: '#3B292E', primary: '#FF9A7D', primaryLight: '#573239', secondary: '#FFC269', text: '#FFF4EF', textSecondary: '#D5B9B0', textMuted: '#A88A84', border: '#51383A', glass: '#2C1E22', tabBar: '#291B20', overlay: 'rgba(0, 0, 0, 0.45)' }, { cardRadius: 23, cardElevation: 3, shadowColor: '#090405', blurIntensity: 55 }),
  },
};

export const visualThemeNames = Object.keys(palettes);
export const defaultVisualTheme = 'Minimal';

function normalizeHex(value) {
  if (typeof value !== 'string') return null;
  const hex = value.trim().replace(/^#/, '');
  if (/^[0-9A-Fa-f]{3}$/.test(hex)) return `#${hex.split('').map((part) => `${part}${part}`).join('').toUpperCase()}`;
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) return `#${hex.toUpperCase()}`;
  return null;
}

function blendHex(hex, target, ratio) {
  const sourceRgb = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  const targetRgb = [1, 3, 5].map((index) => parseInt(target.slice(index, index + 2), 16));
  return `#${sourceRgb.map((channel, index) => Math.round(channel * (1 - ratio) + targetRgb[index] * ratio).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function getContrastText(hex) {
  const luminance = getLuminance(hex);
  return luminance > 0.179 ? '#17202A' : '#FFFFFF';
}

function getLuminance(hex) {
  const rgb = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255).map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(first, second) {
  const [lighter, darker] = [getLuminance(first), getLuminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
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

export function getThemePalette(themeName = defaultVisualTheme, mode = 'light', customAccent = null) {
  const source = palettes[themeName] || palettes[defaultVisualTheme];
  const palette = { ...source[mode === 'dark' ? 'dark' : 'light'] };
  const accent = normalizeHex(customAccent);
  if (accent) {
    palette.primary = accent;
    palette.primaryText = ensureAccessibleAccent(accent, palette.surface);
    palette.onPrimary = getContrastText(accent);
    palette.primaryLight = blendHex(accent, mode === 'dark' ? '#FFFFFF' : '#FFFFFF', mode === 'dark' ? 0.78 : 0.88);
    palette.primaryOnLight = getContrastText(palette.primaryLight);
    palette.secondary = blendHex(accent, '#00A99D', 0.35);
    palette.heroGradient = [blendHex(accent, '#000000', 0.12), accent, blendHex(accent, '#FFFFFF', 0.16)];
    palette.heroText = palette.onPrimary;
    palette.heroMuted = palette.onPrimary;
    palette.heroDecoration = `${palette.onPrimary}18`;
    palette.heroIconBackground = `${palette.onPrimary}24`;
  }
  return palette;
}

export function normalizeCustomHex(value) {
  return normalizeHex(value);
}
