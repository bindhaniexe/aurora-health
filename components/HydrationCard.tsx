// components/HydrationCard.tsx
// Aurora — Hydration summary card for the Dashboard 2×2 grid
// Shows today's total, goal, and a small SVG progress ring.

import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/radius';

interface HydrationCardProps {
  todayTotal: number;    // ml drunk today
  goalMl: number;        // daily goal in ml
  percentage: number;    // 0–100
  isLoading?: boolean;
  onPress?: () => void;
}

// Ring geometry
const RING_SIZE = 52;
const STROKE_WIDTH = 5;
const R = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

const HydrationCard = React.memo(({
  todayTotal,
  goalMl,
  percentage,
  isLoading,
  onPress,
}: HydrationCardProps) => {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={[styles.topRow, { marginBottom: 16 }]}>
          <View style={[styles.iconWrap, { backgroundColor: '#F3F4F6' }]} />
          <View style={{ width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE/2, backgroundColor: '#F3F4F6' }} />
        </View>
        <View style={{ height: 24, backgroundColor: '#F3F4F6', borderRadius: 4, width: '60%', marginBottom: 8 }} />
        <View style={{ height: 16, backgroundColor: '#F3F4F6', borderRadius: 4, width: '80%' }} />
      </View>
    );
  }

  const strokeDash = (percentage / 100) * CIRCUMFERENCE;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {/* ── Icon row ── */}
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="water" size={22} color={colors.accentPurple} />
        </View>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <SvgLinearGradient id="hydRingGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#6D28D9" />
              <Stop offset="1" stopColor="#EC4899" />
            </SvgLinearGradient>
          </Defs>
          {/* Track */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={R}
            stroke="#EDE9FE"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress arc */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={R}
            stroke="url(#hydRingGrad)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
            rotation="-90"
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
      </View>

      {/* ── Value ── */}
      <Text style={styles.value}>
        {todayTotal >= 1000
          ? `${(todayTotal / 1000).toFixed(1)}L`
          : `${todayTotal}ml`}
      </Text>

      {/* ── Label ── */}
      <Text style={styles.label}>Hydration</Text>

      {/* ── Goal progress ── */}
      <Text style={styles.sub}>{percentage}% of {goalMl >= 1000 ? `${goalMl / 1000}L` : `${goalMl}ml`}</Text>
    </TouchableOpacity>
  );
});

export default HydrationCard;

const styles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#9499A7',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.accentPurple + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  label: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  sub: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
