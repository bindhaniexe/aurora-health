// Aurora Design System — Spacing Scale
// Used for margin, padding, gaps, and layouts.
// Reference: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 px

import { moderateScale } from '@/utils/responsive';

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

// Responsive spacing
export const rs = {
  xs:   moderateScale(4),
  sm:   moderateScale(8),
  md:   moderateScale(12),
  lg:   moderateScale(16),
  xl:   moderateScale(20),
  xxl:  moderateScale(24),
  xxxl: moderateScale(32),
  screenH: moderateScale(48),
};

// Responsive font sizes
export const rf = {
  xs:   moderateScale(11),
  sm:   moderateScale(13),
  md:   moderateScale(14),
  body: moderateScale(15),
  lg:   moderateScale(16),
  xl:   moderateScale(18),
  xxl:  moderateScale(22),
  h2:   moderateScale(24),
  h1:   moderateScale(28),
  hero: moderateScale(32),
};
