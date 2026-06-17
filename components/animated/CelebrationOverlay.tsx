import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PARTICLE_COLORS = ['#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
const PARTICLE_ICONS = ['star', 'sparkles', 'balloon', 'trophy', 'ribbon'];

interface FallingParticleProps {
  delay: number;
  startX: number;
  iconName: string;
  color: string;
  size: number;
}

function FallingParticle({ delay, startX, iconName, color, size }: FallingParticleProps) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in quickly
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));

    // Fall down the screen
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration: 3500 + Math.random() * 1500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Horizontal sway
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(startX - 20, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(startX + 20, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Spin rotation
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: 2500, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [delay, startX]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: translateX.value,
    top: 0,
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={iconName as any} size={size} color={color} />
    </Animated.View>
  );
}

interface CelebrationOverlayProps {
  active: boolean;
}

export default function CelebrationOverlay({ active }: CelebrationOverlayProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (active) {
      setShouldRender(true);
      setAnimationKey((prev) => prev + 1);

      // Automatically stop rendering particles after 6.5 seconds to save resources
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 6500);

      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [active]);

  if (!shouldRender) return null;

  // Generate particles deterministically based on key to reset them when re-triggered
  const PARTICLE_COUNT = 30;
  const particles = Array.from({ length: PARTICLE_COUNT }).map((_, index) => {
    // Generate pseudorandom values that are stable per render key
    const seed = index + animationKey * 100;
    const rand = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const icon = PARTICLE_ICONS[index % PARTICLE_ICONS.length];
    const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
    const size = 16 + (index % 3) * 6; // sizes: 16, 22, 28
    const startX = rand(seed) * (SCREEN_WIDTH - 60) + 30;
    const delay = rand(seed + 1) * 1500; // delay up to 1.5s

    return {
      id: `${animationKey}-${index}`,
      icon,
      color,
      size,
      startX,
      delay,
    };
  });

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 999, elevation: 999 }]} pointerEvents="none">
      {particles.map((p) => (
        <FallingParticle
          key={p.id}
          delay={p.delay}
          startX={p.startX}
          iconName={p.icon}
          color={p.color}
          size={p.size}
        />
      ))}
    </View>
  );
}
