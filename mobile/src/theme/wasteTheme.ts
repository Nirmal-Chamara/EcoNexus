import type { ViewStyle } from 'react-native';
import { Platform } from 'react-native';
import { colors as base } from './colors';
import { fontFamily } from './typography';

// The waste module uses the shared app theme (colors.ts and typography.ts).
// Names here are kept short for the waste components.
export const colors = {
  primary: base.primary,
  primaryDark: base.primaryDark,
  lime: base.lime,
  ink: base.textPrimary,
  textMuted: base.textSecondary,
  background: base.background,
  surface: base.surface,
  lavender: base.lavender,
  lavenderSoft: base.surfaceAlt,
  mint: base.primaryMuted,
  mintBorder: '#BFE8D3',
  amberBg: base.warningSurface,
  amberSoft: '#FDF4D6',
  amberText: base.warningText,
  danger: base.error,
  dangerSoft: base.errorSurface,
  border: base.border,
  white: base.white,
  overlay: 'rgba(19, 27, 46, 0.65)',
};

export const fonts = fontFamily;

export const radii = { sm: 10, md: 16, lg: 22, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const shadows: { card: ViewStyle } = {
  card: Platform.select({
    ios: {
      shadowColor: '#131B2E',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    default: { elevation: 3 },
  }) as ViewStyle,
};
