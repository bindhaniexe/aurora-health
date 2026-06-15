// components/WaterBottle.tsx
// Aurora — Animated SVG water bottle
// Fill level animates smoothly as user logs water.
// Uses react-native-svg + Reanimated v3 for smooth cross-platform animations.

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
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
  Easing,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withRepeat,
  useAnimatedProps,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
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
const FILL_TOP = 42;       // top of fillable area in SVG units
const FILL_BOTTOM = 178;   // bottom of fillable area in SVG units
const MAX_FILL_H = FILL_BOTTOM - FILL_TOP; // 136

const BOTTLE_BODY_PATH =
  'M18,40 Q10,44 10,54 L10,172 Q10,188 26,188 L74,188 Q90,188 90,172 L90,54 Q90,44 82,40 Z';

export default function WaterBottle({ filledPercent, size = 150 }: WaterBottleProps) {
  const svgHeight = (size / VB_W) * VB_H;

  const target = Math.max(0, Math.min(100, filledPercent));
  
  const fillAnim = useSharedValue(0);
  const frontWavePhase = useSharedValue(0);
  const backWavePhase = useSharedValue(0);
  const bottleScale = useSharedValue(1);
  
  const prevFilledPercent = useRef(0);

  useEffect(() => {
    // Start continuous horizontal wave phase animations (0 to 2*PI radians represents a full wavelength)
    frontWavePhase.value = 0;
    frontWavePhase.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1, // infinite loop
      false // do not reverse, continuous forward flow
    );

    backWavePhase.value = 0;
    backWavePhase.value = withRepeat(
      withTiming(-2 * Math.PI, {
        duration: 3500,
        easing: Easing.linear,
      }),
      -1, // infinite loop
      false // do not reverse, continuous backward flow
    );
  }, []);

  useEffect(() => {
    // Fill level animation (1000ms duration for extra smooth rise and fall)
    fillAnim.value = withTiming(target / 100, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });

    // Bounce on completion celebration
    if (target >= 100 && prevFilledPercent.current < 100) {
      bottleScale.value = withSequence(
        withTiming(1.05, { duration: 150 }),
        withTiming(0.98, { duration: 150 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
    }
    
    prevFilledPercent.current = target;
  }, [target, fillAnim, bottleScale]);

  // Dynamically generate the wave path on the UI thread inside useAnimatedProps
  const frontWaveProps = useAnimatedProps(() => {
    const y_level = FILL_TOP + MAX_FILL_H - fillAnim.value * MAX_FILL_H;
    const phase = frontWavePhase.value;
    
    const N = 20; // number of segments to draw the wave
    const width = 80; // bottle internal width
    const startX = 10;
    const endX = 90;
    const freq = (2 * Math.PI) / 60; // wavelength of 60 units
    const amp = 4.5; // wave amplitude (height)

    let d = `M ${startX} ${y_level + amp * Math.sin(startX * freq + phase)}`;
    for (let i = 1; i <= N; i++) {
      const x = startX + i * (width / N);
      const y = y_level + amp * Math.sin(x * freq + phase);
      d += ` L ${x} ${y}`;
    }
    d += ` L ${endX} 220 L ${startX} 220 Z`;

    return { d };
  });

  const backWaveProps = useAnimatedProps(() => {
    const y_level = FILL_TOP + MAX_FILL_H - fillAnim.value * MAX_FILL_H;
    const phase = backWavePhase.value;
    
    const N = 20;
    const width = 80;
    const startX = 10;
    const endX = 90;
    const freq = (2 * Math.PI) / 75; // slightly different wavelength
    const amp = 2.8; // shallower back wave

    let d = `M ${startX} ${y_level + amp * Math.sin(startX * freq + phase)}`;
    for (let i = 1; i <= N; i++) {
      const x = startX + i * (width / N);
      const y = y_level + amp * Math.sin(x * freq + phase);
      d += ` L ${x} ${y}`;
    }
    d += ` L ${endX} 220 L ${startX} 220 Z`;

    return { d };
  });

  const bottleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bottleScale.value }]
  }));

  return (
    <AnimatedView style={[styles.container, { width: size, height: svgHeight }, bottleAnimStyle]}>
      <Svg width={size} height={svgHeight} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          {/* Lock the gradient range to the bottle height for static color rendering */}
          <SvgLinearGradient id="waterGrad" x1="0" y1="40" x2="0" y2="188" gradientUnits="userSpaceOnUse">
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

        {/* ── Animated water fill (dual wave layers with dynamic path data) ── */}
        <G clipPath="url(#bottleClip)">
          {/* Back Wave */}
          <AnimatedPath
            fill="url(#waterGrad)"
            opacity={0.4}
            animatedProps={backWaveProps}
          />
          
          {/* Front Wave */}
          <AnimatedPath
            fill="url(#waterGrad)"
            opacity={0.85}
            animatedProps={frontWaveProps}
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
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
});
