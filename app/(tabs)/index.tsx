import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { useProfileStore } from '@/stores/profileStore';
import HydrationCard from '@/components/HydrationCard';
import SleepCard from '@/components/SleepCard';
import { useHydration } from '@/hooks/useHydration';
import { useSleep } from '@/hooks/useSleep';
import { useAuthStore } from '@/stores/authStore';
import { useHealthSummary } from '@/hooks/useHealthSummary';
import { generateInsight } from '@/services/insightService';
import InsightBanner from '@/components/InsightBanner';
import { useHabits } from '@/hooks/useHabits';
import HabitsCard from '@/components/HabitsCard';
import StepsCard from '@/components/StepsCard';
import StreakCard from '@/components/StreakCard';
import { ScreenTransition } from '@/components/animated/ScreenTransition';
import { StaggerList } from '@/components/animated/StaggerList';
import { FloatingOrbs } from '@/components/animated/FloatingOrbs';

// ── Dashboard Screen ──────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { profile } = useProfileStore();
  const { user, guestMode } = useAuthStore();
  const { todayTotal, goalMl, percentage, fetchTodayLogs, isLoading: isHydrationLoading } = useHydration();
  const { lastNight, goalHrs, fetchLogs: fetchSleepLogs, isLoading: isSleepLoading } = useSleep();
  const { habits, todayCompletions, fetchHabits, isLoading: isHabitsLoading } = useHabits();
  const summary = useHealthSummary();
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    if (user || guestMode) {
      fetchTodayLogs();
      fetchSleepLogs();
      fetchHabits();
    }
  }, [user, guestMode]);

  useEffect(() => {
    if (!profile) return;
    setInsightLoading(true);
    generateInsight(summary, profile)
      .then(text => setInsight(text))
      .catch(() => setInsight(null))
      .finally(() => setInsightLoading(false));
  }, [profile?.id]);

  // Get initials for avatar fallback
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'there';
  const initials = profile?.name
    ? profile.name[0].toUpperCase()
    : 'A';

  // Dynamic greeting
  const hour = new Date().getHours();
  let timeOfDay = 'evening';
  if (hour < 12) timeOfDay = 'morning';
  else if (hour < 17) timeOfDay = 'afternoon';

  return (
    <SafeAreaView style={styles.safeArea}>
      <FloatingOrbs variant="primary" count={3} />
      <ScreenTransition>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Bar ──────────────────────────────────────────────── */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="grid-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={styles.iconButton} 
                activeOpacity={0.7}
                onPress={() => router.push('/summary')}
              >
                <Ionicons name="stats-chart" size={20} color={colors.accentPurple} />
              </TouchableOpacity>
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            </View>
          </View>

          {/* ── Heading ──────────────────────────────────────────────── */}
          <Text style={styles.heading}>Good {timeOfDay}, {firstName} 👋</Text>



          {/* ── 2×2 Activity Card Grid ────────────────────────────────── */}
          <InsightBanner insight={insight} isLoading={insightLoading} />
          <View style={styles.cardGrid}>
            <StaggerList staggerDelay={80} childContainerStyle={{ width: '47%' }}>
              {/* Steps card — placeholder */}
              <StepsCard isLoading={false} />

              {/* Sleep card — live data */}
              <SleepCard
                lastNight={lastNight}
                goalHrs={goalHrs}
                isLoading={isSleepLoading}
                onPress={() => router.push('/(tabs)/sleep')}
              />

              {/* Hydration card — live data */}
              <HydrationCard
                todayTotal={todayTotal}
                goalMl={goalMl}
                percentage={percentage}
                isLoading={isHydrationLoading}
                onPress={() => router.push('/(tabs)/hydration')}
              />

              {/* Habits card — live data */}
              <HabitsCard
                completed={todayCompletions.length}
                total={habits.length}
                isLoading={isHabitsLoading}
                onPress={() => router.push('/(tabs)/habits')}
              />
            </StaggerList>
          </View>

          {/* ── Streaks ──────────────────────────────────────────────── */}
          <View style={{ marginTop: 24 }}>
            <StreakCard />
          </View>
        </ScrollView>
      </ScreenTransition>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    position: 'relative',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 20,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: colors.textOnGradient,
  },

  // Heading
  heading: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 16,
  },



  // Card grid
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
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
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardPlaceholder: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
});
