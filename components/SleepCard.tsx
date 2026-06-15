// components/SleepCard.tsx
// Aurora — Sleep summary card for the Dashboard 2×2 grid
// Gradient background (dark purple) with white text + moon icon.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { gradients } from '@/constants/gradients';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/radius';
import type { SleepLog } from '@/types';

interface SleepCardProps {
  lastNight: SleepLog | null;
  goalHrs: number;
  isLoading?: boolean;
  onPress?: () => void;
}

/** Format decimal hours as "H:MM Hours" (e.g. 7.5 → "7:30 Hours") */
function formatHours(h: number): string {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return `${whole}:${String(mins).padStart(2, '0')} Hrs`;
}

const QUALITY_LABELS: Record<string, string> = {
  poor: '😴 Poor',
  fair: '🌙 Fair',
  good: '✨ Good',
  great: '⭐ Great',
};

const SleepCard = React.memo(({ lastNight, goalHrs, isLoading, onPress }: SleepCardProps) => {
  const hasData = lastNight !== null;

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.bgCard }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: '#F3F4F6' }]} />
        </View>
        <View style={{ height: 24, backgroundColor: '#F3F4F6', borderRadius: 4, width: '60%', marginBottom: 8 }} />
        <View style={{ height: 16, backgroundColor: '#F3F4F6', borderRadius: 4, width: '80%' }} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.touchable}
    >
      <LinearGradient
        colors={gradients.sleepCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* ── Header row ── */}
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="moon" size={20} color="#E9D5FF" />
          </View>
          {hasData && lastNight!.quality ? (
            <Text style={styles.badge}>
              {QUALITY_LABELS[lastNight!.quality!] ?? lastNight!.quality}
            </Text>
          ) : null}
        </View>

        {/* ── Value ── */}
        {hasData ? (
          <Text style={styles.value}>{formatHours(lastNight!.hours)}</Text>
        ) : (
          <Text style={styles.emptyValue}>–:– Hrs</Text>
        )}

        {/* ── Label + subtitle ── */}
        <View>
          <Text style={styles.label}>Sleep</Text>
          <Text style={styles.sub}>
            {hasData ? 'last night' : 'not logged yet'}
          </Text>
        </View>

        {/* ── Goal progress bar ── */}
        {hasData ? (
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(100, Math.round((lastNight!.hours / goalHrs) * 100))}%`,
                },
              ]}
            />
          </View>
        ) : null}
      </LinearGradient>
    </TouchableOpacity>
  );
});

export default SleepCard;

const styles = StyleSheet.create({
  touchable: {
    width: '47%',
  },
  card: {
    borderRadius: radius.lg,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#E9D5FF',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  value: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: colors.textOnGradient,
    marginBottom: 2,
  },
  emptyValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 2,
  },
  label: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.textOnGradient,
  },
  sub: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },
  barTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    marginTop: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: radius.full,
  },
});
