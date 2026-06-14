import React, { useRef, useState } from 'react';
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
import { images } from '@/constants/images';
import type { OnboardingSlide } from '@/types/index';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES: OnboardingSlide[] = [
  {
    id: 'meet-aurora',
    title: 'Meet Aurora',
    subtitle: 'Your AI Health Companion',
    description:
      'Aurora learns your habits, celebrates your wins, and gently guides you toward the healthiest version of yourself — through natural conversation.',
    accentColor: colors.accentBlue,
    gradientColors: [colors.accentBlue, colors.bgPrimary],
    emoji: '✦',
  },
  {
    id: 'track-everything',
    title: 'Track Everything',
    subtitle: 'Hydration · Sleep · Habits',
    description:
      'Log your water intake, sleep quality, and daily habits in seconds. Watch beautiful charts reveal your weekly patterns and progress.',
    accentColor: colors.accentPurple,
    gradientColors: [colors.accentPurple, colors.bgPrimary],
    emoji: '✨',
  },
  {
    id: 'voice-first',
    title: 'Just Talk to Me',
    subtitle: 'Voice-First Health Logging',
    description:
      'Say "I drank 500ml of water" or "I slept 7 hours last night" and Aurora logs it instantly. Your health companion, always listening.',
    accentColor: colors.accentGreen,
    gradientColors: [colors.accentGreen, colors.bgPrimary],
    emoji: '🎙️',
  },
];

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// Custom math-based easing worklets to prevent closure capture crashes on web
const easeInOutSine = (t: number) => {
  'worklet';
  return (1 - Math.cos(t * Math.PI)) / 2;
};

interface SlideItemProps {
  slide: OnboardingSlide;
  index: number;
  scrollX: SharedValue<number>;
}

function SlideItem({ slide, index, scrollX }: SlideItemProps) {
  const imageStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [0.85, 1, 0.85],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 0.6) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.6) * SCREEN_WIDTH],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [40, 0, -40],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 0.5) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.5) * SCREEN_WIDTH],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const imageSource =
    index === 0
      ? images.onboarding1
      : index === 1
      ? images.onboarding2
      : images.onboarding3;

  return (
    <View style={styles.slideContainer}>
      <Animated.View style={[styles.imageWrapper, imageStyle]}>
        <Image source={imageSource} style={styles.image} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={[styles.textWrapper, textStyle]}>
        <View
          style={[
            styles.badge,
            {
              borderColor: slide.accentColor + '40',
              backgroundColor: slide.accentColor + '15',
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: slide.accentColor }]}>
            {slide.subtitle}
          </Text>
        </View>

        <Text style={styles.titleText}>{slide.title}</Text>
        <Text style={styles.descriptionText}>{slide.description}</Text>
      </Animated.View>
    </View>
  );
}

interface DotProps {
  index: number;
  scrollX: SharedValue<number>;
  accentColor: string;
}

function DotIndicator({ index, scrollX, accentColor }: DotProps) {
  const dotStyle = useAnimatedStyle(() => {
    const width = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [8, 20, 8],
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
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [colors.textMuted, accentColor, colors.textMuted]
    );

    return {
      width,
      opacity,
      backgroundColor,
    };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  React.useEffect(() => {
    glowOpacity.value = withTiming(1, { duration: 800, easing: easeInOutSine });
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2800, easing: easeInOutSine }),
        withTiming(1, { duration: 2800, easing: easeInOutSine })
      ),
      -1,
      true
    );
  }, []);

  const handleScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  const glowStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      [0, SCREEN_WIDTH, SCREEN_WIDTH * 2],
      [colors.accentBlue, colors.accentPurple, colors.accentGreen]
    );
    return {
      opacity: glowOpacity.value * 0.12,
      transform: [{ scale: pulseScale.value }],
      backgroundColor,
    };
  });

  const skipStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [SCREEN_WIDTH, SCREEN_WIDTH * 1.8, SCREEN_WIDTH * 2],
      [1, 0.5, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      [0, SCREEN_WIDTH, SCREEN_WIDTH * 2],
      [colors.accentBlue, colors.accentPurple, colors.accentGreen]
    );
    return {
      backgroundColor,
    };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.glowCircle, glowStyle]} />

      <View style={styles.header}>
        <Animated.View style={skipStyle}>
          <Pressable
            onPress={handleSkip}
            disabled={activeIndex === SLIDES.length - 1}
            style={({ pressed }) => [
              styles.skipButton,
              { opacity: pressed ? 0.6 : 1 }
            ]}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </Animated.View>
      </View>

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
          <SlideItem
            key={slide.id}
            slide={slide}
            index={index}
            scrollX={scrollX}
          />
        ))}
      </AnimatedScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, index) => (
            <DotIndicator
              key={slide.id}
              index={index}
              scrollX={scrollX}
              accentColor={slide.accentColor}
            />
          ))}
        </View>

        <Animated.View style={[styles.ctaButtonWrapper, buttonStyle]}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.ctaButton,
              { transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
          >
            <Text style={styles.ctaText}>
              {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            {activeIndex !== SLIDES.length - 1 && (
              <Text style={styles.ctaArrow}>→</Text>
            )}
          </Pressable>
        </Animated.View>

        <Text style={styles.termsText}>
          By continuing you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    height: 48,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  glowCircle: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.04,
    left: (SCREEN_WIDTH - SCREEN_WIDTH * 0.85) / 2,
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    borderRadius: (SCREEN_WIDTH * 0.85) / 2,
    ...Platform.select({
      ios: {
        shadowColor: colors.accentBlue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 80,
      },
      default: {
        shadowColor: colors.accentBlue,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 80,
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  imageWrapper: {
    width: SCREEN_WIDTH * 0.76,
    height: SCREEN_WIDTH * 0.76,
    marginTop: SCREEN_HEIGHT * 0.02,
    marginBottom: SCREEN_HEIGHT * 0.02,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  textWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
    borderWidth: 1,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 36,
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  descriptionText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 6,
  },
  bottomSection: {
    width: '100%',
    paddingBottom: 24,
    paddingTop: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaButtonWrapper: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaButton: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 17,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  ctaArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 1,
  },
  termsText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
