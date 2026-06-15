import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingOrbsProps {
  count?: number;
  variant?: 'primary' | 'calm' | 'warm';
}

const VARIANTS = {
  primary: ['rgba(124, 58, 237, 0.12)', 'rgba(236, 72, 153, 0.10)', 'rgba(99, 102, 241, 0.08)'],
  calm: ['rgba(99, 102, 241, 0.10)', 'rgba(124, 58, 237, 0.08)', 'rgba(59, 130, 246, 0.09)'],
  warm: ['rgba(251, 146, 60, 0.10)', 'rgba(245, 158, 11, 0.08)', 'rgba(236, 72, 153, 0.09)'],
};

// Seeded random generator for stable orb positions
const seededRandom = (seed: number) => {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const easeInOut = (t: number) => {
  'worklet';
  return (1 - Math.cos(t * Math.PI)) / 2;
};

function Orb({
  index,
  color,
  initialX,
  initialY,
  size,
}: {
  index: number;
  color: string;
  initialX: number;
  initialY: number;
  size: number;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    // Delays to desync animations
    const delay = index * 400;

    // Use different durations per orb for organic feel
    const durations = [
      { tX: 8000, tY: 7000, s: 9000 },
      { tX: 11000, tY: 9500, s: 12000 },
      { tX: 9500, tY: 11000, s: 8000 },
    ];
    const dur = durations[index % durations.length];

    setTimeout(() => {
      translateX.value = withRepeat(
        withSequence(
          withTiming(20, { duration: dur.tX, easing: easeInOut }),
          withTiming(-20, { duration: dur.tX, easing: easeInOut })
        ),
        -1,
        true
      );

      translateY.value = withRepeat(
        withSequence(
          withTiming(25, { duration: dur.tY, easing: easeInOut }),
          withTiming(-25, { duration: dur.tY, easing: easeInOut })
        ),
        -1,
        true
      );

      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: dur.s, easing: easeInOut }),
          withTiming(0.92, { duration: dur.s, easing: easeInOut })
        ),
        -1,
        true
      );

      opacity.value = withRepeat(
        withSequence(
          withTiming(1.0, { duration: dur.s, easing: easeInOut }),
          withTiming(0.6, { duration: dur.s, easing: easeInOut })
        ),
        -1,
        true
      );
    }, delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: initialX,
          top: initialY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

export const FloatingOrbs = React.memo(function FloatingOrbs({
  count = 3,
  variant = 'primary',
}: FloatingOrbsProps) {
  const colors = VARIANTS[variant];

  const orbs = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const size = 180 + seededRandom(i * 10) * 100;
      const initialX = seededRandom(i * 11) * (SCREEN_WIDTH - size);
      const initialY = seededRandom(i * 12) * (SCREEN_HEIGHT - size);
      const color = colors[i % colors.length];

      return (
        <Orb
          key={i}
          index={i}
          color={color}
          initialX={initialX}
          initialY={initialY}
          size={size}
        />
      );
    });
  }, [count, variant]);

  const containerStyle = [
    StyleSheet.absoluteFill,
    { overflow: 'hidden' as const, zIndex: 0, pointerEvents: 'none' as const },
    Platform.OS === 'android' && { opacity: 0.9 },
  ];

  if (Platform.OS === 'ios') {
    return (
      <View style={containerStyle} pointerEvents="none">
        {orbs}
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      </View>
    );
  }

  return (
    <View style={containerStyle} pointerEvents="none">
      {orbs}
    </View>
  );
});
