
import { Platform } from 'react-native';

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    heading: 30,
    display: 36,
  },

  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extraBold: '800',
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export function getTypographyStyle(style = 'default') {
  if (style === 'modern') {
    return {
      fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
      textStyle: { letterSpacing: 0.05 },
    };
  }
  if (style === 'rounded') {
    return {
      fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-rounded',
      textStyle: { letterSpacing: 0.15 },
    };
  }
  return { fontFamily: undefined, textStyle: {} };
}
