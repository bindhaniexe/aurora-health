// Aurora Design System — Spacing Scale
// Used for margin, padding, gaps, and layouts.
// Reference: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 px

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

export type SpacingToken = keyof typeof spacing;
