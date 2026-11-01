import type { TextStyle } from 'react-native';

// Font families (Poppins for headings/numbers/buttons, Inter for everything else)
export const fontFamily = {
  heading: 'Poppins_700Bold',
  headingSemi: 'Poppins_600SemiBold',
  headingMedium: 'Poppins_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
};

// Base font scale
export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
};

export const fontWeight: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// Preset text styles
export const typography = {
  displayLarge: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['3xl'],
    lineHeight: fontSize['3xl'] * 1.2,
  } as TextStyle,
  displayMedium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * 1.2,
  } as TextStyle,
  h1: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * 1.25,
  } as TextStyle,
  h2: {
    fontFamily: fontFamily.headingSemi,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * 1.3,
  } as TextStyle,
  h3: {
    fontFamily: fontFamily.headingSemi,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.4,
  } as TextStyle,
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
  } as TextStyle,
  bodyMedium: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.5,
  } as TextStyle,
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
  } as TextStyle,
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.4,
  } as TextStyle,
  button: {
    fontFamily: fontFamily.headingSemi,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.2,
  } as TextStyle,
};
