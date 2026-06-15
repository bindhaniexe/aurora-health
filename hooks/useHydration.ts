// hooks/useHydration.ts
// Aurora — Hydration hook composing the hydrationStore + profile water goal
// Exposes the data and actions the Hydration screen needs.

import { useHydrationStore } from '@/stores/hydrationStore';
import { useProfileStore } from '@/stores/profileStore';
import { HydrationLog } from '@/types';

const DEFAULT_GOAL_ML = 2500;

interface UseHydrationReturn {
  todayTotal: number;
  goalMl: number;
  percentage: number;         // 0–100, capped at 100
  logs: HydrationLog[];
  weeklyLogs: HydrationLog[];
  isLoading: boolean;
  error: string | null;
  addWater: (amount_ml: number) => Promise<void>;
  fetchTodayLogs: () => Promise<void>;
  fetchWeeklyLogs: () => Promise<void>;
  resetToday: () => Promise<void>;
}

export function useHydration(): UseHydrationReturn {
  const { profile } = useProfileStore();
  const {
    todayLogs,
    todayTotal,
    weeklyLogs,
    isLoading,
    error,
    addWater,
    fetchTodayLogs,
    fetchWeeklyLogs,
    resetToday,
  } = useHydrationStore();

  const goalMl = profile?.water_goal_ml ?? DEFAULT_GOAL_ML;
  const percentage = Math.min(100, Math.round((todayTotal / goalMl) * 100));

  return {
    todayTotal,
    goalMl,
    percentage,
    logs: todayLogs,
    weeklyLogs,
    isLoading,
    error,
    addWater,
    fetchTodayLogs,
    fetchWeeklyLogs,
    resetToday,
  };
}
