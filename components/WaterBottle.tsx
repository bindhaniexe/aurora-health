// components/WaterBottle.tsx
// Aurora — Animated SVG water bottle
// Fill level animates smoothly as user logs water.
// Uses react-native-svg + Reanimated v3 for smooth cross-platform animations.

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  ClipPath,
  Rect,
  G,
  Circle,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { AnimatedNumber } from './animated/AnimatedNumber';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.createAnimatedComponent(View);

interface WaterBottleProps {
  /** 0–100 fill percentage */
  filledPercent: number;
  /** Width of the bottle SVG. Height is 2× this value. */
  size?: number;
}

// ViewBox constants (all in SVG units)
const VB_W = 100;
const VB_H = 200;

// The fill clip region (inside bottle body)
const FILL_X = 12;
const FILL_TOP = 42;       // top of fillable area in SVG units
const FILL_BOTTOM = 178;   // bottom of fillable area in SVG units
const MAX_FILL_H = FILL_BOTTOM - FILL_TOP; // 136

const BOTTLE_BODY_PATH =
  'M18,40 Q10,44 10,54 L10,172 Q10,188 26,188 L74,188 Q90,188 90,172 L90,54 Q90,44 82,40 Z';

export default function WaterBottle({ filledPercent, size = 150 }: WaterBottleProps) {
  const svgHeight = (size / VB_W) * VB_H;

  const target = Math.max(0, Math.min(100, filledPercent));
  
  const fillAnim = useSharedValue(0);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const bottleScale = useSharedValue(1);
  
  const prevFilledPercent = useRef(0);

  useEffect(() => {
    // Fill animation
    fillAnim.value = withTiming(target / 100, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    // Ripple effect on add
    if (target > prevFilledPercent.current && target <= 100) {
      rippleScale.value = 0;
      rippleOpacity.value = 1;
      rippleScale.value = withTiming(2, { duration: 600, easing: Easing.out(Easing.quad) });
      rippleOpacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });
    }

    // Bounce on completion
    if (target >= 100 && prevFilledPercent.current < 100) {
      bottleScale.value = withSequence(
        withTiming(1.05, { duration: 150 }),
        withTiming(0.98, { duration: 150 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
    }
    
    prevFilledPercent.current = target;
  }, [target, fillAnim, rippleScale, rippleOpacity, bottleScale]);

  const animatedProps = useAnimatedProps(() => {
    const y = FILL_TOP + MAX_FILL_H - fillAnim.value * MAX_FILL_H;
    const h = fillAnim.value * MAX_FILL_H;
    return {
      y,
      height: h,
    };
  });

  const rippleProps = useAnimatedProps(() => {
    const y = FILL_TOP + MAX_FILL_H - fillAnim.value * MAX_FILL_H;
    return {
      cy: y,
      r: 30 * rippleScale.value,
      opacity: rippleOpacity.value,
    };
  });

  const bottleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bottleScale.value }]
  }));

  return (
    <AnimatedView style={[styles.container, { width: size, height: svgHeight }, bottleAnimStyle]}>
      <Svg width={size} height={svgHeight} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <SvgLinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor="#6D28D9" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#A855F7" stopOpacity="1" />
            <Stop offset="1"   stopColor="#EC4899" stopOpacity="1" />
          </SvgLinearGradient>

          <ClipPath id="bottleClip">
            <Path d={BOTTLE_BODY_PATH} />
          </ClipPath>
        </Defs>

        {/* ── Empty bottle background ── */}
        <Path d={BOTTLE_BODY_PATH} fill="#EDE9FE" />

        {/* ── Animated water fill ── */}
        <G clipPath="url(#bottleClip)">
          <AnimatedRect
            x={FILL_X - 2}
            width={VB_W - (FILL_X - 2) * 2}
            fill="url(#waterGrad)"
            animatedProps={animatedProps}
          />
          
          {/* Ripple Effect */}
          <AnimatedCircle
            cx={VB_W / 2}
            fill="rgba(255,255,255,0.4)"
            animatedProps={rippleProps}
          />
        </G>

        {/* ── Bottle body outline ── */}
        <Path
          d={BOTTLE_BODY_PATH}
          fill="none"
          stroke="#C4B5FD"
          strokeWidth="2"
        />

        {/* ── Neck ── */}
        <Path
          d="M38,32 L38,4 Q38,2 40,2 L60,2 Q62,2 62,4 L62,32"
          fill="#EDE9FE"
          stroke="#C4B5FD"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* ── Shoulder (neck → body transition) ── */}
        <Path
          d="M38,32 Q20,36 18,40 L82,40 Q80,36 62,32 Z"
          fill="#EDE9FE"
          stroke="#C4B5FD"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* ── Cap (top of neck) ── */}
        <Path
          d="M35,4 L65,4 Q68,4 68,8 L68,14 Q68,18 65,18 L35,18 Q32,18 32,14 L32,8 Q32,4 35,4 Z"
          fill="#C4B5FD"
          stroke="#A78BFA"
          strokeWidth="1.5"
        />

        {/* ── Highlight shine ── */}
        <Path
          d="M20,60 Q18,95 19,128"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </Svg>

      {/* ── Percentage text overlay ── */}
      <View
        style={[
          styles.percentOverlay,
          { bottom: svgHeight * 0.30 },
        ]}
      >
        <AnimatedNumber
          value={target}
          suffix="%"
          style={styles.percentText}
        />
      </View>
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  percentOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  percentText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.textPrimary,
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
