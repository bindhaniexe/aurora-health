import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SkeletonPulse } from './SkeletonPulse';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/radius';

interface SkeletonCardProps {
  width?: number | string;
  height?: number | string;
}

export function SkeletonCard({ width = '48%', height = 120 }: SkeletonCardProps) {
  return (
    <View style={[styles.card, { width, height }]}>
      <View style={styles.header}>
        <SkeletonPulse width={32} height={32} borderRadius={radius.full} />
        <SkeletonPulse width="60%" height={16} borderRadius={4} style={{ marginLeft: 8 }} />
      </View>
      <View style={styles.content}>
        <SkeletonPulse width="80%" height={24} borderRadius={6} />
        <SkeletonPulse width="40%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 16,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    marginTop: 16,
  },
});
