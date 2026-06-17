// app/(tabs)/hydration.tsx
// Aurora — Full Hydration tracking screen
// Features: animated water bottle, quick-add buttons, today's log list, empty state

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { useHydration } from '@/hooks/useHydration';
import WaterBottle from '@/components/WaterBottle';
import { HydrationLog } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { ScreenTransition } from '@/components/animated/ScreenTransition';
import { StaggerList } from '@/components/animated/StaggerList';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { PressableScale } from '@/components/animated/PressableScale';
import { AnimatedNumber } from '@/components/animated/AnimatedNumber';

// ── Quick add presets ─────────────────────────────────────────────────────────
const QUICK_ADD = [
  { label: '+250ml', amount: 250 },
  { label: '+500ml', amount: 500 },
  { label: '+750ml', amount: 750 },
] as const;

// ── Format logged_at timestamp to "h:mm AM/PM" ────────────────────────────────
function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m} ${period}`;
}

// ── Today's date label ────────────────────────────────────────────────────────
function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ── Log item row ──────────────────────────────────────────────────────────────
function LogItem({ log }: { log: HydrationLog }) {
  return (
    <View style={styles.logItem}>
      <View style={styles.logIconWrap}>
        <Ionicons name="water" size={16} color={colors.accentPurple} />
      </View>
      <View style={styles.logInfo}>
        <Text style={styles.logAmount}>{log.amount_ml} ml</Text>
        <Text style={styles.logTime}>{formatTime(log.logged_at)}</Text>
      </View>
      <View style={styles.logBadge}>
        <Text style={styles.logBadgeText}>
          {log.amount_ml > 0 ? `+${log.amount_ml}` : log.amount_ml}
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HydrationScreen() {
  const { user, guestMode } = useAuthStore();
  const {
    todayTotal,
    goalMl,
    percentage,
    logs,
    isLoading,
    error,
    addWater,
    fetchTodayLogs,
    resetToday,
  } = useHydration();

  // Fetch logs on mount
  useEffect(() => {
    if (user || guestMode) {
      fetchTodayLogs();
    }
  }, [user, guestMode]);

  const handleAddWater = useCallback(
    async (amount: number) => {
      if (!user && !guestMode) {
        Alert.alert('Sign in required', 'Please sign in to track hydration.');
        return;
      }
      await addWater(amount);
    },
    [user, guestMode, addWater]
  );

  const handleIncreaseWater = useCallback(async () => {
    if (!user && !guestMode) {
      Alert.alert('Sign in required', 'Please sign in to track hydration.');
      return;
    }
    await addWater(250);
  }, [user, guestMode, addWater]);

  const handleReduceWater = useCallback(async () => {
    if (!user && !guestMode) {
      Alert.alert('Sign in required', 'Please sign in to track hydration.');
      return;
    }
    if (todayTotal <= 0) return;
    const amountToReduce = Math.min(250, todayTotal);
    await addWater(-amountToReduce);
  }, [user, guestMode, addWater, todayTotal]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Today',
      'This will clear all hydration logs for today. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetToday(),
        },
      ]
    );
  }, [resetToday]);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0.7], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 60], [0, -8], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [0, 60], [1, 0.96], Extrapolation.CLAMP) }
    ],
  }));

  // formatHydration is handled internally by AnimatedNumber now

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenTransition>
        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
        {/* ── Header ──────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, headerAnimStyle]}>
          <View>
            <Animated.Text style={[styles.heading, headerAnimStyle]}>Today&apos;s Hydration</Animated.Text>
            <Text style={styles.dateLabel}>{getTodayLabel()}</Text>
          </View>
          <PressableScale style={styles.resetBtn} onPress={handleReset}>
            <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
          </PressableScale>
        </Animated.View>

        {/* ── Error banner ─────────────────────────────────────────── */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Bottle + stats ───────────────────────────────────────── */}
        <View style={styles.bottleSection}>
          {/* Soft gradient glow behind the bottle */}
          <LinearGradient
            colors={['#EDE9FE', '#FAF5FF', '#FDF4FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bottleGlow}
          />

          <View style={styles.bottleControlRow}>
            <PressableScale
              style={styles.adjustBtn}
              onPress={handleReduceWater}
              disabled={todayTotal <= 0}
            >
              <Ionicons
                name="remove"
                size={24}
                color={todayTotal <= 0 ? colors.textMuted : colors.accentPurple}
              />
            </PressableScale>

            <WaterBottle filledPercent={percentage} size={150} />

            <PressableScale
              style={styles.adjustBtn}
              onPress={handleIncreaseWater}
            >
              <Ionicons name="add" size={24} color={colors.accentPurple} />
            </PressableScale>
          </View>

          {/* ── Volume label ── */}
          <View style={styles.volumeRow}>
            <AnimatedNumber
              value={todayTotal}
              formatter="hydration"
              style={styles.volumeTotal}
            />
            <Text style={styles.volumeSeparator}> of </Text>
            <Text style={styles.volumeGoal}>
              {goalMl >= 1000 ? `${goalMl / 1000} L` : `${goalMl} ml`}
            </Text>
          </View>
        </View>

        {/* ── Quick add buttons ─────────────────────────────────────── */}
        <View style={styles.quickAddSection}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickAddRow}>
            <StaggerList staggerDelay={60} childContainerStyle={{ flex: 1 }}>
              {QUICK_ADD.map(({ label, amount }) => (
                <PressableScale
                  key={amount}
                  onPress={() => handleAddWater(amount)}
                  style={styles.quickAddWrapper}
                >
                  <LinearGradient
                    colors={gradients.hydration}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.quickAddPill}
                  >
                    <Ionicons name="add" size={16} color={colors.textOnGradient} />
                    <Text style={styles.quickAddText}>{label}</Text>
                  </LinearGradient>
                </PressableScale>
              ))}
            </StaggerList>
          </View>
        </View>

        {/* ── Goal met celebration ──────────────────────────────────── */}
        {percentage >= 100 && (
          <View style={styles.goalMetBanner}>
            <Text style={styles.goalMetEmoji}>🎉</Text>
            <Text style={styles.goalMetText}>Daily goal reached! Amazing work!</Text>
          </View>
        )}

        {/* ── Today's log list ─────────────────────────────────────── */}
        <View style={styles.logSection}>
          <Text style={styles.sectionTitle}>Today&apos;s Logs</Text>

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.accentPurple} size="small" />
            </View>
          ) : logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💧</Text>
              <Text style={styles.emptyTitle}>Start your day with a glass of water</Text>
              <Text style={styles.emptySubtitle}>
                Use the quick add buttons above to log your first drink.
              </Text>
            </View>
          ) : (
            logs.map((log) => <LogItem key={log.id} log={log} />)
          )}
        </View>
        </Animated.ScrollView>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 24,
  },
  heading: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: colors.textPrimary,
  },
  dateLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },

  // Bottle section
  bottleSection: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  bottleControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    width: '100%',
    zIndex: 10,
  },
  adjustBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#9499A7',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bottleGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: radius.full,
    top: -20,
    alignSelf: 'center',
    opacity: 0.6,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 16,
    marginBottom: 12,
  },
  volumeTotal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: colors.textPrimary,
  },
  volumeSeparator: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
  },
  volumeGoal: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Quick add
  quickAddSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAddWrapper: {
    width: '100%',
  },
  quickAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  quickAddText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: colors.textOnGradient,
  },

  // Goal met banner
  goalMetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.accentGreen + '18',
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  goalMetEmoji: {
    fontSize: 20,
  },
  goalMetText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.accentGreen,
    flex: 1,
  },

  // Log section
  logSection: {
    flex: 1,
  },

  // Loading
  loadingWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Log items
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderHairline,
    gap: 12,
  },
  logIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.accentPurple + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logInfo: {
    flex: 1,
  },
  logAmount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  logTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  logBadge: {
    backgroundColor: colors.accentPurple + '18',
    borderRadius: radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  logBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: colors.accentPurple,
  },
});
