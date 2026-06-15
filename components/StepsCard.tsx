// components/StepsCard.tsx
// Aurora — Steps placeholder card for the Dashboard 2×2 grid

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
import { gradients } from '@/constants/gradients';

interface StepsCardProps {
  isLoading?: boolean;
  onPress?: () => void;
}

// Ring geometry
const RING_SIZE = 52;
const STROKE_WIDTH = 5;
const R = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

const StepsCard = React.memo(({ isLoading, onPress }: StepsCardProps) => {
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

  // Placeholder values
  const percentage = 0; // Hardcoded to 0 for MVP
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
          <Ionicons name="walk" size={22} color={colors.accentPurple} />
        </View>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <SvgLinearGradient id="stepsRingGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={gradients.stepsRing[0]} />
              <Stop offset="1" stopColor={gradients.stepsRing[2]} />
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
            stroke="url(#stepsRingGrad)"
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
      <Text style={styles.value}>— steps</Text>

      {/* ── Label ── */}
      <Text style={styles.label}>Steps Today</Text>

      {/* ── Subtitle ── */}
      <Text style={styles.sub}>not tracked</Text>
    </TouchableOpacity>
  );
});

export default StepsCard;

const styles = StyleSheet.create({
  card: {
    width: '100%',
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
    color: colors.textMuted,
    marginTop: 2,
  },
});
