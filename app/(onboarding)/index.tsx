/**
 * Aurora — Onboarding Screen
 * Light, vibrant design — matches Aurora Fitness Design System (DESIGN.md)
 *
 * Layout:
 *  - Full-screen authBg LinearGradient (soft lavender wash)
 *  - Three horizontally-pageable slides
 *  - Each slide: rounded illustration card (white, shadow) + badge + title + description
 *  - Bottom bar: animated dot indicators + gradient CTA pill button
 *  - Skip text link (top-right, fades on last slide)
 *
 * Per AGENTS.md rules:
 *  - SafeAreaView uses inline style only (no className)
 *  - LinearGradient uses inline style prop
 *  - Colors from constants/colors.ts, gradients from constants/gradients.ts
 *  - Animations via React Native Reanimated v3
 */

import React, { useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  Extrapolation,
  withTiming,
  withRepeat,
  withSequence,
  type SharedValue,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { images } from '@/constants/images';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Slide Data ───────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  badge: string;
  title: string;
  titleAccent: string; // highlighted word(s) in title
  description: string;
  image: any;
}

const SLIDES: Slide[] = [
  {
    id: 'meet-aurora',
    badge: '✦  AI Companion',
    title: 'Your Personal',
    titleAccent: 'Health Coach',
    description:
      'Aurora learns your habits, celebrates your wins, and guides you toward the healthiest version of yourself through natural conversation.',
    image: images.onboardingHero,
  },
  {
    id: 'track-everything',
    badge: '💧  Smart Tracking',
    title: 'Track',
    titleAccent: 'Everything',
    description:
      'Log hydration, sleep, and daily habits in seconds. Beautiful charts reveal your weekly patterns and progress no manual entry needed.',
    image: images.onboardingTracking,
  },
  {
    id: 'voice-first',
    badge: '🎙️  Voice First',
    title: 'Just',
    titleAccent: 'Talk to Me',
    description:
      'Say "I drank 500ml of water" and Aurora logs it instantly. Your health companion, always listening, never judging.',
    image: images.onboardingVoice,
  },
];

// Custom math easing worklet — avoids closure capture crashes on web
const easeInOut = (t: number) => {
  'worklet';
  return (1 - Math.cos(t * Math.PI)) / 2;
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// ─── Dot Indicator ────────────────────────────────────────────────────────────

interface DotProps {
  index: number;
  scrollX: SharedValue<number>;
}

function DotIndicator({ index, scrollX }: DotProps) {
  const dotStyle = useAnimatedStyle(() => {
    const width = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [8, 24, 8],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [0.35, 1, 0.35],
      Extrapolation.CLAMP
    );
    const backgroundColor = interpolateColor(
      scrollX.value,
      [0, SCREEN_WIDTH, SCREEN_WIDTH * 2],
      [colors.accentPurple, colors.accentPurple, colors.accentPurple]
    );
    return { width, opacity, backgroundColor };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

// ─── Slide Item ───────────────────────────────────────────────────────────────

interface SlideItemProps {
  slide: Slide;
  index: number;
  scrollX: SharedValue<number>;
}

function SlideItem({ slide, index, scrollX }: SlideItemProps) {
  const cardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [0.88, 1, 0.88],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 0.7) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.7) * SCREEN_WIDTH],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }], opacity };
  });

  const textStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [32, 0, -32],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 0.55) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.55) * SCREEN_WIDTH],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return { transform: [{ translateY }], opacity };
  });

  return (
    <View style={styles.slideContainer}>
      {/* Illustration Card */}
      <Animated.View style={[styles.illustrationCard, cardStyle]}>
        {/* Soft gradient tint behind illustration */}
        <LinearGradient
          colors={['#EDE9FE', '#FAE8FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Image
          source={slide.image}
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Text content */}
      <Animated.View style={[styles.textContent, textStyle]}>
        {/* Badge pill */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{slide.badge}</Text>
        </View>

        {/* Title — two-line with accent */}
        <Text style={styles.titleText}>
          {slide.title}{'\n'}
          <Text style={styles.titleAccent}>{slide.titleAccent}</Text>
        </Text>

        {/* Description */}
        <Text style={styles.descriptionText}>{slide.description}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Ambient glow pulse
  const glowScale = useSharedValue(1);
  React.useEffect(() => {
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 3000, easing: easeInOut }),
        withTiming(1, { duration: 3000, easing: easeInOut })
      ),
      -1,
      true
    );
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('aurora_onboarding_done', 'true');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace('/(auth)' as any);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const nextIndex = activeIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      setActiveIndex(nextIndex);
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  // Skip fades out on last slide
  const skipStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [SCREEN_WIDTH * (SLIDES.length - 2), SCREEN_WIDTH * (SLIDES.length - 1)],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Ambient glow circle behind illustration
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <LinearGradient
      colors={gradients.authBg}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>

        {/* Ambient decorative glow orb */}
        <Animated.View style={[styles.glowOrb, glowStyle]} />

        {/* Header — Skip button */}
        <View style={styles.header}>
          <Animated.View style={skipStyle}>
            <Pressable
              onPress={handleSkip}
              style={({ pressed }) => [styles.skipButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Slides */}
        <AnimatedScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={{ width: SCREEN_WIDTH * SLIDES.length }}
        >
          {SLIDES.map((slide, index) => (
            <SlideItem key={slide.id} slide={slide} index={index} scrollX={scrollX} />
          ))}
        </AnimatedScrollView>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>

          {/* Dot indicators */}
          <View style={styles.dotsRow}>
            {SLIDES.map((slide, index) => (
              <DotIndicator key={slide.id} index={index} scrollX={scrollX} />
            ))}
          </View>

          {/* Gradient CTA pill button */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>
                {isLastSlide ? 'Get Started' : 'Continue'}
              </Text>
              <Text style={styles.ctaArrow}>→</Text>
            </LinearGradient>
          </Pressable>

          {/* Terms micro-copy */}
          <Text style={styles.termsText}>
            By continuing you agree to our{' '}
            <Text style={styles.termsLink}>Terms & Privacy Policy</Text>
          </Text>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  // Decorative ambient glow orb — top-center, lavender tint
  glowOrb: {
    position: 'absolute',
    top: -SCREEN_WIDTH * 0.25,
    left: SCREEN_WIDTH * 0.15,
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: (SCREEN_WIDTH * 0.7) / 2,
    backgroundColor: '#C4B5FD',
    opacity: 0.22,
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 60,
      },
    }),
  },

  // Header
  header: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  skipText: {
    color: colors.accentPurple,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },

  // Slides
  scrollView: { flex: 1 },

  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },

  // Circular card housing the illustration
  illustrationCard: {
    width: SCREEN_WIDTH - 80,
    height: SCREEN_WIDTH - 80,
    borderRadius: radius.full,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#9499A7',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },

  illustrationImage: {
    width: '100%',
    height: '100%',
  },

  // Text section below card
  textContent: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 28,
    paddingHorizontal: 8,
  },

  // Badge chip
  badge: {
    backgroundColor: 'rgba(124, 58, 237, 0.10)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.18)',
  },
  badgeText: {
    color: colors.accentPurple,
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.4,
  },

  // Title
  titleText: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  titleAccent: {
    color: colors.accentPurple,
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
  },

  // Description
  descriptionText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 4,
    marginTop: 2,
  },

  // Bottom section
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 16,
    alignItems: 'center',
    gap: 20,
  },

  // Dot indicators
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: radius.full,
  },

  // CTA gradient pill button
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: SCREEN_WIDTH - 48,
    height: 56,
    borderRadius: radius.pill,
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOpacity: 0.35,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 18,
      },
      android: { elevation: 8 },
    }),
  },
  ctaText: {
    fontSize: 17,
    fontFamily: 'Poppins-SemiBold',
    color: colors.textOnGradient,
    letterSpacing: 0.2,
  },
  ctaArrow: {
    fontSize: 18,
    color: colors.textOnGradient,
    marginTop: 1,
  },

  // Terms micro-copy
  termsText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  termsLink: {
    color: colors.accentPurple,
    fontFamily: 'Inter-SemiBold',
  },
});
