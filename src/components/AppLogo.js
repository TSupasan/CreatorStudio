import React from 'react';
import { Image } from 'react-native';

const LOGO_ASPECT_RATIO = 2216 / 1654;

export default function AppLogo({ width = 80, height = width / LOGO_ASPECT_RATIO, style, accessibilityLabel = 'CreatorStudio logo', ...imageProps }) {
  return (
    <Image
      {...imageProps}
      source={require('../../assets/logo.png')}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      style={[{ width, height }, style]}
    />
  );
}
