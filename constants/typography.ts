// Aurora Design System — Typography Tokens
// Font families: Poppins (display), Inter (body), JetBrains Mono (data)

export const fonts = {
  display: 'Poppins-Bold',
  displaySemiBold: 'Poppins-SemiBold',
  displayMedium: 'Poppins-Medium',
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  mono: 'JetBrainsMono-Regular',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
  '5xl': 40,
  hero: 48,
} as const;

export const lineHeights = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.45,
  relaxed: 1.6,
} as const;
