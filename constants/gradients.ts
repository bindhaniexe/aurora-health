// Aurora Design System — Gradient Tokens
// Import these as the `colors` prop of <LinearGradient> from expo-linear-gradient.
// NEVER inline gradient color arrays directly in components — always reference these tokens.

export const gradients = {

  // Primary brand gradient — CTA buttons, active tab pill, chart bars, progress rings
  primary:      ['#6D28D9', '#A855F7', '#EC4899'] as const,

  // Auth & onboarding CTA circular button — violet to hot pink
  ctaButton:    ['#7C3AED', '#EC4899'] as const,

  // Sleep module card background
  sleepCard:    ['#3B0764', '#6D28D9', '#9333EA'] as const,

  // Progress bar fill (horizontal left → right)
  progressBar:  ['#7C3AED', '#C026D3', '#EC4899'] as const,

  // Heart rate bar chart bars (bottom → top)
  heartBars:    ['#EC4899', '#A855F7'] as const,

  // Calories ring stroke gradient
  caloriesRing: ['#EC4899', '#F472B6'] as const,

  // Steps ring stroke gradient
  stepsRing:    ['#6D28D9', '#7C3AED', '#A855F7'] as const,

  // Auth & onboarding background wash (top → bottom)
  authBg:       ['#F7F5FF', '#EDE9FE', '#DDD6FE'] as const,

} as const;

export type GradientToken = keyof typeof gradients;
