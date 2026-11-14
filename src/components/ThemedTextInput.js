import React from 'react';
import { TextInput as NativeTextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function ThemedTextInput({ style, ...props }) {
  const { typography, colors } = useTheme();
  return <NativeTextInput {...props} style={[{ color: colors.text, backgroundColor: colors.inputBackground, borderColor: colors.border }, typography?.textStyle, typography?.fontFamily ? { fontFamily: typography.fontFamily } : null, style]} />;
}
