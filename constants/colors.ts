// Aurora Design System — Color Tokens
// Source of truth per AGENTS.md + DESIGN.md
// Use these tokens for inline styles and StyleSheet — NativeWind handles class-based usage.
// NEVER use raw hex values in components — always reference these token names.

export const colors = {

  // ── Backgrounds ────────────────────────────────────────────────────────
  // Auth & onboarding screens use bgAuth (soft lavender-white).
  // All dashboard and feature screens use bgPrimary (pure white).
  bgPrimary:       '#FFFFFF',   // Dashboard, session, feature screen backgrounds
  bgAuth:          '#F7F5FF',   // Auth & onboarding — soft lavender tint
  bgCard:          '#FFFFFF',   // White card surfaces (elevated via shadow, not color)
  bgInput:         '#F5F5F8',   // Search bars, text input fields
  bgChip:          '#F0EEF8',   // Unselected date/filter chips

  // ── Brand Gradient Anchors ─────────────────────────────────────────────
  // Used as start/end stops in LinearGradient. Never apply raw as a flat fill.
  // Use the gradients object in constants/gradients.ts instead.
  gradientStart:   '#6D28D9',   // Deep violet — gradient origin
  gradientMid:     '#A855F7',   // Mid purple-pink
  gradientEnd:     '#EC4899',   // Hot pink — gradient terminus

  // ── Module Accent Colors ───────────────────────────────────────────────
  accentPurple:    '#7C3AED',   // Primary accent — rings, selected tabs, CTAs (flat)
  accentPink:      '#EC4899',   // Secondary accent — calories ring, hot pink moments
  accentGreen:     '#10B981',   // Success states, habit completion, streaks
  accentAmber:     '#F59E0B',   // Warnings, nutrition module

  // ── Sleep Card Special Surface ─────────────────────────────────────────
  // Sleep card uses its own deep-purple gradient (different from primary gradient).
  sleepCardStart:  '#3B0764',   // Deep dark purple
  sleepCardEnd:    '#9333EA',   // Vivid purple — card surface gradient end

  // ── Text ───────────────────────────────────────────────────────────────
  textPrimary:     '#1E1B2E',   // Headings, primary data — dark charcoal-navy
  textSecondary:   '#6B7280',   // Subtitles, labels, secondary info
  textMuted:       '#9CA3AF',   // Placeholders, disabled states
  textOnGradient:  '#FFFFFF',   // Text on any gradient surface (buttons, sleep card)

  // ── Borders & Dividers ─────────────────────────────────────────────────
  // Cards have NO border — depth comes from shadow only.
  // Borders are used only for hairline list separators.
  borderHairline:  '#E5E7EB',   // List row separators, input underlines

  // ── Semantic ───────────────────────────────────────────────────────────
  error:           '#EF4444',
  success:         '#10B981',
  overlayScrim:    '#000000',   // Used at rgba(0,0,0,0.40) for modals

} as const;

export type ColorToken = keyof typeof colors;
