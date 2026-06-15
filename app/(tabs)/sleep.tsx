// app/(tabs)/sleep.tsx
// Aurora — Sleep Tracker screen
// Full sleep logging, weekly SVG bar chart, quality selector, and log modal.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { useSleep } from '@/hooks/useSleep';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import type { SleepLog } from '@/types';

// ── Constants ──────────────────────────────────────────────────────────────────
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const QUALITY_OPTIONS: SleepLog['quality'][] = ['poor', 'fair', 'good', 'great'];
const QUALITY_META: Record<string, { label: string; emoji: string; color: string }> = {
  poor:  { label: 'Poor',  emoji: '😴', color: '#EF4444' },
  fair:  { label: 'Fair',  emoji: '🌙', color: '#F59E0B' },
  good:  { label: 'Good',  emoji: '✨', color: '#10B981' },
  great: { label: 'Great', emoji: '⭐', color: '#7C3AED' },
};

const CHART_WIDTH  = 300; // inner width used for bar layout
const CHART_HEIGHT = 160;
const BAR_WIDTH    = 24;
const MAX_HOURS    = 10;
const Y_AXIS_LABELS = [0, 2, 4, 6, 8, 10];

/** Format decimal hours as "H:MM" */
function fmtHours(h: number): string {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return `${whole}:${String(mins).padStart(2, '0')}`;
}

/** Build a 7-slot array aligned to Sun-Sat, with today filled from logs */
function buildWeekSlots(logs: SleepLog[]): { day: string; hours: number | null }[] {
  const today = new Date();
  const slots: { day: string; hours: number | null; dateStr: string }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const log = logs.find((l) => l.sleep_date === dateStr);
    slots.push({ day: DAY_LABELS[d.getDay()], hours: log?.hours ?? null, dateStr });
  }
  return slots;
}

// ── Weekly Bar Chart ──────────────────────────────────────────────────────────
function WeeklyBarChart({
  weeklyLogs,
  goalHrs,
}: {
  weeklyLogs: SleepLog[];
  goalHrs: number;
}) {
  const slots = buildWeekSlots(weeklyLogs);
  const containerWidth = CHART_WIDTH;
  const slotWidth = containerWidth / slots.length;

  // Y axis pixel helpers
  const hoursToPx = (h: number) => CHART_HEIGHT - (h / MAX_HOURS) * CHART_HEIGHT;
  const goalY = hoursToPx(goalHrs);

  return (
    <Svg width="100%" height={CHART_HEIGHT + 32} viewBox={`0 0 ${containerWidth} ${CHART_HEIGHT + 32}`}>
      <Defs>
        <SvgLinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          {/* heartBars gradient: pink → purple (top to bottom reversed for upward bars) */}
          <Stop offset="0" stopColor="#EC4899" />
          <Stop offset="1" stopColor="#A855F7" />
        </SvgLinearGradient>
        <SvgLinearGradient id="barGradEmpty" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E5E7EB" />
          <Stop offset="1" stopColor="#F3F4F6" />
        </SvgLinearGradient>
      </Defs>

      {/* Goal line */}
      <Line
        x1={0}
        y1={goalY}
        x2={containerWidth}
        y2={goalY}
        stroke={colors.accentPurple}
        strokeWidth={1.5}
        strokeDasharray="4,3"
        opacity={0.5}
      />

      {/* Bars + day labels */}
      {slots.map((slot, i) => {
        const cx = slotWidth * i + slotWidth / 2;
        const barH = slot.hours != null ? (slot.hours / MAX_HOURS) * CHART_HEIGHT : 6;
        const barY = CHART_HEIGHT - barH;
        const hasData = slot.hours != null;

        return (
          <React.Fragment key={slot.day + i}>
            <Rect
              x={cx - BAR_WIDTH / 2}
              y={barY}
              width={BAR_WIDTH}
              height={barH}
              rx={6}
              ry={6}
              fill={hasData ? 'url(#barGrad)' : 'url(#barGradEmpty)'}
              opacity={hasData ? 1 : 0.5}
            />
            {/* Hours label above bar (only when data exists) */}
            {hasData && (
              <SvgText
                x={cx}
                y={barY - 4}
                textAnchor="middle"
                fontSize={9}
                fontFamily="Inter-Regular"
                fill={colors.textSecondary}
              >
                {fmtHours(slot.hours!)}
              </SvgText>
            )}
            {/* Day label below bar */}
            <SvgText
              x={cx}
              y={CHART_HEIGHT + 18}
              textAnchor="middle"
              fontSize={11}
              fontFamily="Inter-Regular"
              fill={colors.textSecondary}
            >
              {slot.day}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ── Log Sleep Modal ───────────────────────────────────────────────────────────
function LogSleepModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (hours: number, quality: SleepLog['quality']) => void;
}) {
  const [hours, setHours] = useState(7.5);
  const [quality, setQuality] = useState<SleepLog['quality']>('good');

  const HOUR_OPTIONS = [4, 5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>Log Sleep</Text>
          <Text style={styles.sheetSubtitle}>How did you sleep last night?</Text>

          {/* Hours picker */}
          <Text style={styles.sectionLabel}>Duration</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hoursRow}
          >
            {HOUR_OPTIONS.map((h) => {
              const selected = hours === h;
              return selected ? (
                <LinearGradient
                  key={h}
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.hourChipGrad}
                >
                  <TouchableOpacity onPress={() => setHours(h)} activeOpacity={0.9}>
                    <Text style={styles.hourChipTextSelected}>{fmtHours(h)}h</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={h}
                  onPress={() => setHours(h)}
                  style={styles.hourChip}
                  activeOpacity={0.7}
                >
                  <Text style={styles.hourChipText}>{fmtHours(h)}h</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quality selector */}
          <Text style={styles.sectionLabel}>Quality</Text>
          <View style={styles.qualityRow}>
            {QUALITY_OPTIONS.map((q) => {
              if (!q) return null;
              const meta = QUALITY_META[q];
              const selected = quality === q;
              return (
                <TouchableOpacity
                  key={q}
                  onPress={() => setQuality(q)}
                  style={[
                    styles.qualityChip,
                    selected && { borderColor: meta.color, backgroundColor: meta.color + '15' },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={styles.qualityEmoji}>{meta.emoji}</Text>
                  <Text
                    style={[
                      styles.qualityLabel,
                      selected && { color: meta.color, fontFamily: 'Inter-Medium' },
                    ]}
                  >
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm */}
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmGrad}
          >
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => onConfirm(hours, quality)}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>Log {fmtHours(hours)} Hours</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Sleep Screen ──────────────────────────────────────────────────────────────
export default function SleepScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const { user, guestMode } = useAuthStore();
  const { lastNight, weeklyLogs, averageHours, goalHrs, isLoading, fetchLogs, logSleep } = useSleep();

  useEffect(() => {
    if (user || guestMode) {
      fetchLogs();
    }
  }, [user, guestMode]);

  const handleConfirm = useCallback(
    async (hours: number, quality: SleepLog['quality']) => {
      setModalVisible(false);
      await logSleep(hours, quality ?? undefined);
    },
    [logSleep],
  );

  const qualityMeta = lastNight?.quality ? QUALITY_META[lastNight.quality] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Text style={styles.screenTitle}>Sleep Tracker</Text>
        <Text style={styles.screenSubtitle}>Track your rest, improve your health</Text>

        {/* ── Last Night Summary ── */}
        <LinearGradient
          colors={gradients.sleepCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Last Night</Text>
              {lastNight ? (
                <Text style={styles.heroHours}>
                  {fmtHours(lastNight.hours)} Hours
                </Text>
              ) : (
                <Text style={styles.heroEmpty}>Not logged yet</Text>
              )}
              {qualityMeta && (
                <View style={styles.qualityBadge}>
                  <Text style={styles.qualityBadgeText}>
                    {qualityMeta.emoji} {qualityMeta.label}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.moonCircle}>
              <Ionicons name="moon" size={32} color="#E9D5FF" />
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{goalHrs}h</Text>
              <Text style={styles.heroStatLabel}>Goal</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{averageHours > 0 ? `${averageHours}h` : '–'}</Text>
              <Text style={styles.heroStatLabel}>7-day avg</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {lastNight ? `${Math.min(100, Math.round((lastNight.hours / goalHrs) * 100))}%` : '–'}
              </Text>
              <Text style={styles.heroStatLabel}>of goal</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Weekly Chart ── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Weekly Overview</Text>
            <View style={styles.legendItem}>
              <View style={styles.legendDash} />
              <Text style={styles.legendText}>Goal</Text>
            </View>
          </View>

          {weeklyLogs.length > 0 ? (
            <WeeklyBarChart weeklyLogs={weeklyLogs} goalHrs={goalHrs} />
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="moon-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyChartText}>
                Log tonight's sleep to start tracking your patterns.
              </Text>
            </View>
          )}
        </View>

        {/* ── Tips ── */}
        <View style={styles.tipsCard}>
          <Text style={styles.sectionTitle}>Sleep Tips</Text>
          {[
            { icon: 'sunny-outline', text: 'Wake up at the same time every day' },
            { icon: 'phone-portrait-outline', text: 'Avoid screens 1 hour before bed' },
            { icon: 'thermometer-outline', text: 'Keep your room cool (65–68°F)' },
          ].map((tip) => (
            <View key={tip.text} style={styles.tipRow}>
              <View style={styles.tipIcon}>
                <Ionicons name={tip.icon as any} size={16} color={colors.accentPurple} />
              </View>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>

        {/* Bottom padding for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Log Sleep FAB ── */}
      <View style={styles.fabContainer}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGrad}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.fabText}>Log Sleep</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* ── Log Modal ── */}
      <LogSleepModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirm}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Header
  screenTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },

  // Hero card
  heroCard: {
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 4,
  },
  heroHours: {
    fontFamily: 'Poppins-Bold',
    fontSize: 36,
    color: colors.textOnGradient,
    lineHeight: 44,
  },
  heroEmpty: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 32,
  },
  qualityBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  qualityBadgeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textOnGradient,
  },
  moonCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.textOnGradient,
  },
  heroStatLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Chart card
  chartCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#9499A7',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 20,
      },
      android: { elevation: 5 },
    }),
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDash: {
    width: 16,
    height: 2,
    backgroundColor: colors.accentPurple,
    borderRadius: 1,
  },
  legendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textSecondary,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyChartText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },

  // Tips card
  tipsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#9499A7',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 20,
      },
      android: { elevation: 5 },
    }),
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accentPurple + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  fabGrad: {
    borderRadius: radius.pill,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  fabText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.textOnGradient,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderHairline,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hoursRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
    marginBottom: 20,
  },
  hourChipGrad: {
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  hourChipTextSelected: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textOnGradient,
  },
  hourChip: {
    backgroundColor: colors.bgChip,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  hourChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  qualityChip: {
    flex: 1,
    minWidth: 70,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderHairline,
    backgroundColor: colors.bgInput,
  },
  qualityEmoji: {
    fontSize: 20,
  },
  qualityLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  confirmGrad: {
    borderRadius: radius.pill,
  },
  confirmBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.textOnGradient,
  },
});
