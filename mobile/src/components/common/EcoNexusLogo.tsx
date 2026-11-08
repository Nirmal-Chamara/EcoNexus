import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const SIZES = {
  sm: { width: 90, height: 52 },
  md: { width: 140, height: 81 },
  lg: { width: 180, height: 105 },
  xl: { width: 220, height: 128 },
};

export function EcoNexusLogo({ size = 'md', style, containerStyle }: LogoProps) {
  const dimensions = SIZES[size];
  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        source={require('../../../assets/logo.png')}
        style={[dimensions, style]}
        resizeMode="contain"
        accessibilityLabel="EcoNexus Logo"
      />
    </View>
  );
}

export default EcoNexusLogo;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

