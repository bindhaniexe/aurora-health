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

// ── Time tab options ──────────────────────────────────────────────────────────
const TIME_TABS = ['Daily', 'Weekly', 'Monthly', 'Yearly'] as const;
type TimeTab = typeof TIME_TABS[number];

// ── Placeholder activity card data (non-sleep / non-hydration modules) ─────────
const PLACEHOLDER_CARDS = [
  { id: 'heart',    title: 'Heart',    icon: 'heart',    color: colors.accentPink  },
  { id: 'calories', title: 'Calories', icon: 'flame',    color: colors.accentAmber },
] as const;

// ── Generic placeholder card ──────────────────────────────────────────────────
function PlaceholderCard({
  title,
  icon,
  color,
}: {
  title: string;
  icon: string;
  color: string;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardPlaceholder}>Coming soon</Text>
    </View>
  );
}

// ── Dashboard Screen ──────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const [selectedTab, setSelectedTab] = useState<TimeTab>('Daily');
  const { profile } = useProfileStore();
  const { user, guestMode } = useAuthStore();
  const { todayTotal, goalMl, percentage, fetchTodayLogs } = useHydration();
  const { lastNight, goalHrs, fetchLogs: fetchSleepLogs } = useSleep();
  const summary = useHealthSummary();
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    if (user || guestMode) {
      fetchTodayLogs();
      fetchSleepLogs();
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
  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AU';

  return (
    <SafeAreaView style={styles.safeArea}>
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

          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
        </View>

        {/* ── Heading ──────────────────────────────────────────────── */}
        <Text style={styles.heading}>My Activities</Text>

        {/* ── Search Bar ───────────────────────────────────────────── */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
          />
        </View>

        {/* ── Time Tabs ─────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollView}
          contentContainerStyle={styles.tabsContainer}
        >
          {TIME_TABS.map((tab) => {
            const isSelected = selectedTab === tab;
            return isSelected ? (
              <LinearGradient
                key={tab}
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.selectedTabPill}
              >
                <TouchableOpacity
                  onPress={() => setSelectedTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectedTabText}>{tab}</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedTab(tab)}
                style={styles.unselectedTab}
                activeOpacity={0.6}
              >
                <Text style={styles.unselectedTabText}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 2×2 Activity Card Grid ────────────────────────────────── */}
        <InsightBanner insight={insight} isLoading={insightLoading} />
        
        <View style={styles.cardGrid}>
          {/* Hydration card — live data */}
          <HydrationCard
            todayTotal={todayTotal}
            goalMl={goalMl}
            percentage={percentage}
            onPress={() => router.push('/(tabs)/hydration')}
          />

          {/* Sleep card — live data */}
          <SleepCard
            lastNight={lastNight}
            goalHrs={goalHrs}
            onPress={() => router.push('/(tabs)/sleep')}
          />

          {/* Placeholder cards for upcoming modules */}
          {PLACEHOLDER_CARDS.map((card) => (
            <PlaceholderCard
              key={card.id}
              title={card.title}
              icon={card.icon}
              color={card.color}
            />
          ))}
        </View>
      </ScrollView>
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
    paddingBottom: 24,
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

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
    margin: 0,
  },

  // Time tabs
  tabsScrollView: {
    marginBottom: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  selectedTabPill: {
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  selectedTabText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textOnGradient,
  },
  unselectedTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  unselectedTabText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
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
