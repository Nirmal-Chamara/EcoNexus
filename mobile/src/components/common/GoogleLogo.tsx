import React from 'react';
import { Image, StyleSheet } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';

interface GoogleLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function GoogleLogo({ size = 20, style }: GoogleLogoProps) {
  return (
    <Image
      source={require('../../../assets/google-logo.png')}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      accessibilityLabel="Google Logo"
    />
  );
}

export default GoogleLogo;

