import { colors } from './colors';
import { spacing, radii } from './spacing';
import { shadows } from './shadows';
import { fontSize, fontWeight, lineHeight, typography } from './typography';

export { colors, spacing, radii, shadows, fontSize, fontWeight, lineHeight, typography };
export type { ColorKey } from './colors';

export const theme = {
  colors,
  spacing,
  radii,
  shadows,
  fontSize,
  fontWeight,
  lineHeight,
  typography,
} as const;
