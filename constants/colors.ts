// Aurora Design System — Color Tokens
// Source of truth: global.css @theme block
// Use these constants for inline styles and StyleSheet (NativeWind handles class-based usage)

export const colors = {
  // Backgrounds
  bgPrimary: '#0A0E1A',   // App background
  bgCard: '#131929',      // Card backgrounds
  bgSurface: '#1C2539',   // Input fields, secondary surfaces

  // Accents
  accentBlue: '#4A9EFF',    // Hydration, primary CTAs
  accentPurple: '#8B5CF6',  // Sleep module
  accentGreen: '#10B981',   // Habits, success states
  accentAmber: '#F59E0B',   // Nutrition, streaks, warnings

  // Text
  textPrimary: '#F1F5F9',   // Headings, primary text
  textSecondary: '#94A3B8', // Supporting text, labels
  textMuted: '#475569',     // Placeholder, disabled

  // Borders & Semantic
  border: '#1E293B',
  error: '#EF4444',
  success: '#10B981',
} as const;

export type ColorKey = keyof typeof colors;
