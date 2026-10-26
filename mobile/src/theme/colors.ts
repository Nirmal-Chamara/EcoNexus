// EcoNexus Design System — Color Palette
// Built around an eco/green identity with dark backgrounds for premium feel

export const colors = {
  // ── Brand ─────────────────────────────────────
  primary: '#10B981', // F1.1 brief; pending Figma verification
  primaryDark: '#047857', // Pressed / deep green
  primaryLight: '#6EE7B7', // Soft accent
  primaryMuted: '#D1FAE5', // Subtle tint
  mintBackground: '#ECFDF5',
  neutral50: '#F9FAFB',
  neutral100: '#F3F4F6',
  neutral200: '#E5E7EB',
  neutral300: '#D1D5DB',
  neutral400: '#9CA3AF',
  neutral500: '#6B7280',
  neutral600: '#4B5563',
  neutral700: '#374151',
  neutral800: '#1F2937',
  neutral900: '#111827',

  // ── Backgrounds ───────────────────────────────
  background: '#0A0F0D', // Near-black canvas
  surface: '#111A14', // Card / elevated surface
  surfaceAlt: '#182419', // Input fields, alternative surface
  border: '#1F3022', // Subtle dividers & input borders
  borderFocus: '#10B981', // Focused input border

  // ── Text ──────────────────────────────────────
  textPrimary: '#F0FDF4', // Near-white headings
  textSecondary: '#A7F3D0', // Soft muted descriptors
  textMuted: '#9CA3AF', // Readable placeholder/helper text on dark surfaces
  textInverse: '#0A0F0D', // Text on primary button

  // ── Status ────────────────────────────────────
  error: '#F87171',
  errorSurface: '#1C0707',
  warning: '#F59E0B',
  warningSurface: '#1C1107',
  success: '#22C55E',
  successSurface: '#071C0D',
  info: '#3B82F6',

  // ── Role Badges ───────────────────────────────
  roleUser: '#22C55E',
  roleCollector: '#F59E0B',
  roleCenter: '#3B82F6',
  roleAdmin: '#A855F7',

  // ── Utility ───────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.6)',
};

export type ColorKey = keyof typeof colors;
