import React from 'react';
import { TextInput as NativeTextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function ThemedTextInput({ style, ...props }) {
  const { typography } = useTheme();
  return <NativeTextInput {...props} style={[typography?.textStyle, typography?.fontFamily ? { fontFamily: typography.fontFamily } : null, style]} />;
}
