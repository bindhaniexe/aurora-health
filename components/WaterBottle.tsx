// components/WaterBottle.tsx
// Aurora — Animated SVG water bottle
// Fill level animates smoothly as user logs water.
// Uses react-native-svg + Reanimated v4 for smooth cross-platform animations.

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { gradients } from '@/constants/gradients';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  ClipPath,
  G,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
  useAnimatedStyle,
  withSequence,
  withRepeat,
  useAnimatedProps,
  useDerivedValue,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedView = Animated.createAnimatedComponent(View);

interface WaterBottleProps {
  /** 0–100 fill percentage */
  filledPercent: number;
  /** Width of the bottle SVG. Height is 2× this value. */
  size?: number;
}

const VB_W = 100;
const VB_H = 200;

const FILL_TOP = 42;
const FILL_BOTTOM = 178;
const MAX_FILL_H = FILL_BOTTOM - FILL_TOP;

const BOTTLE_BODY_PATH =
  'M18,40 Q10,44 10,54 L10,172 Q10,188 26,188 L74,188 Q90,188 90,172 L90,54 Q90,44 82,40 Z';

const N = 28;
const START_X = 10;
const END_X = 90;
const WAVE_WIDTH = END_X - START_X;
const FRONT_FREQ = (2 * Math.PI) / 60;
const BACK_FREQ = (2 * Math.PI) / 75;
const FRONT_AMP = 4.5;
const BACK_AMP = 2.8;

export default function WaterBottle({ filledPercent, size = 150 }: WaterBottleProps) {
  const svgHeight = (size / VB_W) * VB_H;

  const target = Math.max(0, Math.min(100, filledPercent));

  const fillAnim = useSharedValue(0);
  const frontWavePhase = useSharedValue(0);
  const backWavePhase = useSharedValue(0);
  const bottleScale = useSharedValue(1);

  const prevFilledPercent = useRef(target);

  useEffect(() => {
    frontWavePhase.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 2200, easing: Easing.linear }),
      -1,
      false
    );
    backWavePhase.value = withRepeat(
      withTiming(-Math.PI * 2, { duration: 3400, easing: Easing.linear }),
      -1,
      false
    );
  }, [frontWavePhase, backWavePhase]);

  useEffect(() => {
    // Spring-based fill: damped, slight overshoot for a "liquid settling" feel
    fillAnim.value = withSpring(target / 100, {
      damping: 18,
      stiffness: 90,
      mass: 0.9,
      overshootClamping: false,
    });

    if (target >= 100 && prevFilledPercent.current < 100) {
      bottleScale.value = withSequence(
        withSpring(1.06, { damping: 8, stiffness: 220 }),
        withSpring(1, { damping: 12, stiffness: 180 })
      );
    }

    prevFilledPercent.current = target;
  }, [target, fillAnim, bottleScale]);

  const yLevel = useDerivedValue(
    () => FILL_TOP + MAX_FILL_H - fillAnim.value * MAX_FILL_H
  );

  const frontWaveProps = useAnimatedProps(() => {
    'worklet';
    const yLevelVal = yLevel.value;
    const phase = frontWavePhase.value;

    let d = `M ${START_X} ${(yLevelVal + FRONT_AMP * Math.sin(START_X * FRONT_FREQ + phase)).toFixed(2)}`;
    for (let i = 1; i <= N; i++) {
      const x = START_X + (i * WAVE_WIDTH) / N;
      const y = yLevelVal + FRONT_AMP * Math.sin(x * FRONT_FREQ + phase);
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    d += ` L ${END_X} 200 L ${START_X} 200 Z`;

    return { d };
  });

  const backWaveProps = useAnimatedProps(() => {
    'worklet';
    const yLevelVal = yLevel.value;
    const phase = backWavePhase.value;

    let d = `M ${START_X} ${(yLevelVal + BACK_AMP * Math.sin(START_X * BACK_FREQ + phase)).toFixed(2)}`;
    for (let i = 1; i <= N; i++) {
      const x = START_X + (i * WAVE_WIDTH) / N;
      const y = yLevelVal + BACK_AMP * Math.sin(x * BACK_FREQ + phase);
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    d += ` L ${END_X} 200 L ${START_X} 200 Z`;

    return { d };
  });

  const bottleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bottleScale.value }],
  }));

  return (
    <AnimatedView style={[styles.container, { width: size, height: svgHeight }, bottleAnimStyle]}>
      <Svg width={size} height={svgHeight} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <SvgLinearGradient id="waterGrad" x1="0" y1="40" x2="0" y2="188" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={gradients.hydration[0]} stopOpacity="1" />
            <Stop offset="1" stopColor={gradients.hydration[1]} stopOpacity="1" />
          </SvgLinearGradient>
          <ClipPath id="bottleClip">
            <Path d={BOTTLE_BODY_PATH} />
          </ClipPath>
        </Defs>

        <Path d={BOTTLE_BODY_PATH} fill="#EDE9FE" />

        <G clipPath="url(#bottleClip)">
          <AnimatedPath
            fill="url(#waterGrad)"
            opacity={0.4}
            animatedProps={backWaveProps}
          />
          <AnimatedPath
            fill="url(#waterGrad)"
            opacity={0.85}
            animatedProps={frontWaveProps}
          />
        </G>

        <Path
          d={BOTTLE_BODY_PATH}
          fill="none"
          stroke="#C4B5FD"
          strokeWidth="2"
        />
        <Path
          d="M38,32 L38,4 Q38,2 40,2 L60,2 Q62,2 62,4 L62,32"
          fill="#EDE9FE"
          stroke="#C4B5FD"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <Path
          d="M38,32 Q20,36 18,40 L82,40 Q80,36 62,32 Z"
          fill="#EDE9FE"
          stroke="#C4B5FD"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <Path
          d="M35,4 L65,4 Q68,4 68,8 L68,14 Q68,18 65,18 L35,18 Q32,18 32,14 L32,8 Q32,4 35,4 Z"
          fill="#C4B5FD"
          stroke="#A78BFA"
          strokeWidth="1.5"
        />
        <Path
          d="M20,60 Q18,95 19,128"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </Svg>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
});
