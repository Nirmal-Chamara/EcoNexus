// EcoNexus Design System — Color Palette
// Built around an eco/green identity with dark backgrounds for premium feel

export const colors = {
  // ── Brand ─────────────────────────────────────
  primary:        '#22C55E', // Main green action color
  primaryDark:    '#16A34A', // Pressed / deep green
  primaryLight:   '#86EFAC', // Soft accent
  primaryMuted:   '#BBF7D0', // Subtle tint

  // ── Backgrounds ───────────────────────────────
  background:     '#0A0F0D', // Near-black canvas
  surface:        '#111A14', // Card / elevated surface
  surfaceAlt:     '#182419', // Input fields, alternative surface
  border:         '#1F3022', // Subtle dividers & input borders
  borderFocus:    '#22C55E', // Focused input border

  // ── Text ──────────────────────────────────────
  textPrimary:    '#F0FDF4', // Near-white headings
  textSecondary:  '#A7F3D0', // Soft muted descriptors
  textMuted:      '#6B7280', // Placeholder, helper text
  textInverse:    '#0A0F0D', // Text on primary button

  // ── Status ────────────────────────────────────
  error:          '#EF4444',
  errorSurface:   '#1C0707',
  warning:        '#F59E0B',
  warningSurface: '#1C1107',
  success:        '#22C55E',
  successSurface: '#071C0D',
  info:           '#3B82F6',

  // ── Role Badges ───────────────────────────────
  roleUser:       '#22C55E',
  roleCollector:  '#F59E0B',
  roleCenter:     '#3B82F6',
  roleAdmin:      '#A855F7',

  // ── Utility ───────────────────────────────────
  white:          '#FFFFFF',
  black:          '#000000',
  transparent:    'transparent',
  overlay:        'rgba(0,0,0,0.6)',
};

export type ColorKey = keyof typeof colors;
