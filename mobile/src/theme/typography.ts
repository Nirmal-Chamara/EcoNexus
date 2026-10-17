import { TextStyle } from 'react-native';

// Base font scale
export const fontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl': 28,
  '3xl': 34,
};

export const fontWeight: Record<string, TextStyle['fontWeight']> = {
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
  extrabold:'800',
};

export const lineHeight = {
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.75,
};

// Preset text styles
export const typography = {
  displayLarge: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold,     lineHeight: fontSize['3xl'] * 1.2 } as TextStyle,
  displayMedium:{ fontSize: fontSize['2xl'], fontWeight: fontWeight.bold,     lineHeight: fontSize['2xl'] * 1.2 } as TextStyle,
  h1:           { fontSize: fontSize.xl,     fontWeight: fontWeight.bold,     lineHeight: fontSize.xl  * 1.25 }   as TextStyle,
  h2:           { fontSize: fontSize.lg,     fontWeight: fontWeight.semibold, lineHeight: fontSize.lg  * 1.3  }   as TextStyle,
  h3:           { fontSize: fontSize.md,     fontWeight: fontWeight.semibold, lineHeight: fontSize.md  * 1.4  }   as TextStyle,
  body:         { fontSize: fontSize.base,   fontWeight: fontWeight.regular,  lineHeight: fontSize.base * 1.5 }   as TextStyle,
  bodyMedium:   { fontSize: fontSize.base,   fontWeight: fontWeight.medium,   lineHeight: fontSize.base * 1.5 }   as TextStyle,
  label:        { fontSize: fontSize.sm,     fontWeight: fontWeight.medium,   lineHeight: fontSize.sm  * 1.4  }   as TextStyle,
  caption:      { fontSize: fontSize.xs,     fontWeight: fontWeight.regular,  lineHeight: fontSize.xs  * 1.4  }   as TextStyle,
  button:       { fontSize: fontSize.base,   fontWeight: fontWeight.semibold, lineHeight: fontSize.base * 1.2 }   as TextStyle,
};
