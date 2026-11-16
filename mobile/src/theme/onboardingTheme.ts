/**
 * onboardingTheme.ts
 *
 * Design tokens specifically tailored for the EcoNexus onboarding, splash,
 * and role selection experience as specified in the Figma UI designs.
 */

export const onboardingTheme = {
  // Brand Emeralds
  primary: '#059669',          // Primary vibrant emerald CTA & active dots
  primaryDark: '#064E3B',      // Deep brand heading text & accents
  primaryMedium: '#10B981',    // Medium vibrant accent
  primaryLight: '#ECFDF5',     // Soft mint background for cards & pills
  primaryBorder: '#A7F3D0',    // Emerald borders
  primarySubtle: '#DCFCE7',    // Light pastel emerald fill

  // Canvas & Surfaces
  canvas: '#FFFFFF',           // Main background
  canvasAlt: '#F8FAFC',        // Secondary canvas background (light slate tint)
  cardBackground: '#FFFFFF',   // Card background
  cardBorder: '#E2E8F0',       // Standard subtle border
  cardBorderHighlight: '#10B981', // Selected/Active card border

  // Text colors
  textPrimary: '#0F172A',      // Headings & primary labels (Slate 900)
  textSecondary: '#475569',    // Body text & descriptions (Slate 600)
  textMuted: '#94A3B8',        // Inactive indicators, footnotes, subtitles (Slate 400)
  textInverse: '#FFFFFF',      // Text on primary buttons

  // Accents & Badges
  amberGold: '#D97706',        // EcoPoints coin, cash tags
  amberLight: '#FEF3C7',       // EcoPoints tag background
  amberDark: '#B45309',        // EcoPoints text
  skyBlue: '#0284C7',          // Ledger stats, telemetry badge
  skyLight: '#E0F2FE',         // Ledger tag background
  skyDark: '#0369A1',          // Sky blue text

  // Shadows
  cardShadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 3,
  },
  glowShadow: {
    shadowColor: '#059669',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 5,
  },
};

