// Aurora Design System — Border Radius Tokens
// Use these tokens for all borderRadius values — never raw pixel values in components.

export const radius = {
  xs:   4,    // tiny chips, small badges
  sm:   8,    // date chips, image frames, list items
  md:   12,   // input fields
  lg:   20,   // standard cards
  xl:   24,   // large cards, modals
  pill: 50,   // ALL pill buttons, search bars, tab selectors
  full: 9999, // circular avatar, mic button, icon-only CTA button
} as const;

export type RadiusToken = keyof typeof radius;
