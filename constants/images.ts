// Aurora — Centralized Image Imports
// Per AGENTS.md: all image assets imported and exported from here.
// Never import images directly inside screens or components.

const onboardingHero     = require('@/assets/images/onboarding-hero.png');
const onboardingTracking = require('@/assets/images/onboarding-tracking.png');
const onboardingVoice    = require('@/assets/images/onboarding-voice.png');

export const images = {
  onboardingHero,
  onboardingTracking,
  onboardingVoice,
} as const;
