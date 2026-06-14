import { ImageSourcePropType } from 'react-native';

// Aurora — Centralized Image Imports
// Per AGENTS.md: all image assets imported and exported from here.
// Never import images directly inside screens or components.

const onboarding1: ImageSourcePropType = require('@/assets/images/onboarding-1.png');
const onboarding2: ImageSourcePropType = require('@/assets/images/onboarding-2.png');
const onboarding3: ImageSourcePropType = require('@/assets/images/onboarding-3.png');
const onboardingHero: ImageSourcePropType = require('@/assets/images/onboarding-hero.png');
const onboardingTracking: ImageSourcePropType = require('@/assets/images/onboarding-tracking.png');
const onboardingVoice: ImageSourcePropType = require('@/assets/images/onboarding-voice.png');
const auroraMascot: ImageSourcePropType = require('@/assets/images/aurora_mascot.png');

// Fallback placeholders for assets that don't exist yet to prevent bundler errors
const avatarPlaceholder: ImageSourcePropType = require('@/assets/images/icon.png');
const fitnessHero: ImageSourcePropType = require('@/assets/images/onboarding-hero.png');
const runnerIllustration: ImageSourcePropType = require('@/assets/images/onboarding-tracking.png');

export const images = {
  onboarding1,
  onboarding2,
  onboarding3,
  onboardingHero,
  onboardingTracking,
  onboardingVoice,
  avatarPlaceholder,
  fitnessHero,
  runnerIllustration,
  auroraMascot,
} as const;
