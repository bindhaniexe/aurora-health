// components/WaterBottle.tsx
// Aurora — Animated SVG water bottle
// Fill level animates smoothly as user logs water.
// Uses react-native-svg + standard Animated library for cross-platform compatibility.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  ClipPath,
  Rect,
  G,
} from 'react-native-svg';
import { colors } from '@/constants/colors';

// Create an Animated version of SVG Rect so we can animate its props
const AnimatedRect = Animated.createAnimatedComponent(Rect);

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

/**
 * Bottle body path:
 *   Shoulders from neck (x=18,y=40 → x=82,y=40)
 *   Sides taper slightly
 *   Rounded bottom
 */
const BOTTLE_BODY_PATH =
  'M18,40 Q10,44 10,54 L10,172 Q10,188 26,188 L74,188 Q90,188 90,172 L90,54 Q90,44 82,40 Z';

export default function WaterBottle({ filledPercent, size = 150 }: WaterBottleProps) {
  const svgHeight = (size / VB_W) * VB_H;

  // Animated Value (0 to 1) representing the fill fraction
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = Math.max(0, Math.min(1, filledPercent / 100));
    Animated.timing(fillAnim, {
      toValue: target,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // SVG property animation must run on JS thread
    }).start();
  }, [filledPercent, fillAnim]);

  // Interpolate y and height for the Rect fill from bottom to top
  const animatedY = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [FILL_TOP + MAX_FILL_H, FILL_TOP],
  });

  const animatedHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, MAX_FILL_H],
  });

  return (
    <View style={[styles.container, { width: size, height: svgHeight }]}>
      <Svg width={size} height={svgHeight} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          {/* Gradient for water: deep violet → mid purple → hot pink (top → bottom) */}
          <SvgLinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor="#6D28D9" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#A855F7" stopOpacity="1" />
            <Stop offset="1"   stopColor="#EC4899" stopOpacity="1" />
          </SvgLinearGradient>

          {/* Clip path: bottle body shape — water is clipped to this */}
          <ClipPath id="bottleClip">
            <Path d={BOTTLE_BODY_PATH} />
          </ClipPath>
        </Defs>

        {/* ── Empty bottle background (soft lavender) ── */}
        <Path d={BOTTLE_BODY_PATH} fill="#EDE9FE" />

        {/* ── Animated water fill, clipped to bottle shape ── */}
        <G clipPath="url(#bottleClip)">
          <AnimatedRect
            x={FILL_X - 2}
            width={VB_W - (FILL_X - 2) * 2}
            fill="url(#waterGrad)"
            y={animatedY}
            height={animatedHeight}
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
        <Text style={styles.percentText}>{Math.round(filledPercent)}%</Text>
      </View>
    </View>
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
