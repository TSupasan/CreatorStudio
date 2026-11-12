import React from 'react';
import { Text as NativeText } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function ThemedText({ style, ...props }) {
  const { typography } = useTheme();
  return <NativeText {...props} style={[typography?.textStyle, typography?.fontFamily ? { fontFamily: typography.fontFamily } : null, style]} />;
}
