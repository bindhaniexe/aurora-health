import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/radius';
import { useHabits } from '@/hooks/useHabits';

export default function StreakCard() {
  const { habits } = useHabits();
  
  // Filter habits with streaks > 0 and sort by highest streak
  const topStreaks = habits
    .filter(h => h.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3); // Show top 3 streaks

  if (topStreaks.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="flame" size={20} color={colors.accentGreen} />
        <Text style={styles.title}>Your Streaks</Text>
      </View>
      
      <View style={styles.list}>
        {topStreaks.map((habit) => (
          <View key={habit.id} style={styles.streakRow}>
            <View style={styles.streakInfo}>
              <Text style={styles.streakName} numberOfLines={1}>{habit.name}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakValue}>{habit.streak} Days</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 16,
    width: '100%',
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
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  list: {
    gap: 12,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakInfo: {
    flex: 1,
    paddingRight: 12,
  },
  streakName: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: colors.textPrimary,
  },
  streakBadge: {
    backgroundColor: colors.bgAuth,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  streakValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.accentGreen,
  },
});
