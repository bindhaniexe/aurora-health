import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { useProfileStore } from '@/stores/profileStore';
import { hydrationService } from '@/services/hydrationService';
import { sleepService } from '@/services/sleepService';
import { insightService } from '@/services/insightService';
import { useHabitStore } from '@/stores/habitStore';
import { PressableScale } from '@/components/animated/PressableScale';

export default function WeeklySummaryScreen() {
  const router = useRouter();
  const { profile } = useProfileStore();
  const { habits, streaks } = useHabitStore();
  
  const [loading, setLoading] = useState(true);
  const [hydrationAvg, setHydrationAvg] = useState(0);
  const [sleepAvg, setSleepAvg] = useState(0);
  const [habitRate, setHabitRate] = useState(0);
  const [summaryText, setSummaryText] = useState<string | null>(null);

  useEffect(() => {
    async function loadWeeklyData() {
      if (!profile) return;
      try {
        const [hydrationLogs, sleepLogs] = await Promise.all([
          hydrationService.getWeeklyLogs(),
          sleepService.getRecentLogs(7)
        ]);

        // Hydration: sum over last 7 days / 7
        const totalWater = hydrationLogs.reduce((acc, log) => acc + log.amount_ml, 0);
        const avgWater = totalWater / 7;
        setHydrationAvg(avgWater);

        // Sleep: sum hours / number of logs (or 7 if we want daily avg)
        const totalSleep = sleepLogs.reduce((acc, log) => acc + log.hours, 0);
        const avgSleep = totalSleep / 7;
        setSleepAvg(avgSleep);

        // Habit Rate: (we approximate this by streaks if no weekly completions endpoint exists)
        // For MVP, let's just show an estimated rate based on streaks vs total habits
        const activeHabits = habits.length;
        let rate = 0;
        if (activeHabits > 0) {
          // A very rough proxy for the weekly rate based on current streaks up to 7
          const totalStreaks = habits.reduce((acc, h) => {
            const habitStreak = streaks[h.id] || 0;
            return acc + Math.min(habitStreak, 7);
          }, 0);
          rate = (totalStreaks / (activeHabits * 7)) * 100;
        }
        setHabitRate(rate);

        const aiText = await insightService.generateWeeklySummary(
          { hydrationAvg: avgWater, sleepAvg: avgSleep, habitRate: rate },
          profile
        );
        setSummaryText(aiText);

      } catch (e) {
        console.error('Failed to load weekly summary', e);
      } finally {
        setLoading(false);
      }
    }
    
    loadWeeklyData();
  }, [profile, habits, streaks]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <PressableScale onPress={() => router.back()} style={styles.closeButton} scaleDown={0.9}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </PressableScale>
        <Text style={styles.title}>Weekly Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accentPurple} />
          </View>
        ) : (
          <>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiCard}
            >
              <Ionicons name="sparkles" size={24} color={colors.textOnGradient} style={styles.aiIcon} />
              <Text style={styles.aiText}>
                {summaryText || "You had a great week! Keep building those habits."}
              </Text>
            </LinearGradient>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="water" size={24} color={colors.accentPurple} />
                <Text style={styles.statValue}>{Math.round(hydrationAvg)} ml</Text>
                <Text style={styles.statLabel}>Daily Avg</Text>
                <Text style={styles.statGoal}>Goal: {profile?.water_goal_ml}</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="moon" size={24} color={colors.accentPurple} />
                <Text style={styles.statValue}>{sleepAvg.toFixed(1)} h</Text>
                <Text style={styles.statLabel}>Nightly Avg</Text>
                <Text style={styles.statGoal}>Goal: {profile?.sleep_goal_hrs}</Text>
              </View>

              <View style={styles.statCardFull}>
                <Ionicons name="checkmark-circle" size={24} color={colors.accentGreen} />
                <View style={styles.statCardFullContent}>
                  <Text style={styles.statValue}>{Math.round(habitRate)}%</Text>
                  <Text style={styles.statLabel}>Habit Completion Rate</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgAuth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.bgCard,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  loadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  aiCard: {
    borderRadius: radius.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  aiIcon: {
    marginTop: 2,
  },
  aiText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: colors.textOnGradient,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: 'center',
  },
  statCardFull: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statCardFullContent: {
    flex: 1,
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statGoal: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
});
