// EcoNexus Design System: colour palette (light theme, from the module designs)

export const colors = {
  // ── Brand ─────────────────────────────────────
  primary: '#006C49', // Main green action colour
  primaryDark: '#074F3C', // Pressed / deep green
  primaryLight: '#7FD9AD', // Soft accent
  primaryMuted: '#E8F8F0', // Subtle tint (mint)
  lime: '#ACF847', // Highlight buttons ("+ New Waste", Publish)

  // ── Backgrounds ───────────────────────────────
  background: '#FAF8FF', // Page background
  surface: '#FFFFFF', // Cards
  surfaceAlt: '#F0F1FF', // Input fields, alternative surface
  lavender: '#E2E7FF', // Tabs / chips (inactive)
  border: '#E3E5F0', // Dividers & input borders
  borderFocus: '#006C49', // Focused input border

  // ── Text ──────────────────────────────────────
  textPrimary: '#131B2E', // Headings
  textSecondary: '#5F6B7A', // Descriptions
  textMuted: '#8A93A3', // Placeholder, helper text
  textInverse: '#FFFFFF', // Text on primary button

  // ── Status ────────────────────────────────────
  error: '#BA1A1A',
  errorSurface: '#FBE4E4',
  warning: '#F59E0B',
  warningText: '#B26A00',
  warningSurface: '#FDE8AF',
  success: '#006C49',
  successSurface: '#E8F8F0',
  info: '#3B82F6',

  // ── Role Badges ───────────────────────────────
  roleUser: '#006C49',
  roleCollector: '#F59E0B',
  roleCenter: '#3B82F6',
  roleAdmin: '#A855F7',

  // ── Utility ───────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(19,27,46,0.5)',
};

export type ColorKey = keyof typeof colors;
