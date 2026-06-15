// stores/hydrationStore.ts
// Aurora — Hydration global state via Zustand
// Per AGENTS.md: optimistic updates pattern used for addWater.

import { create } from 'zustand';
import { HydrationLog } from '@/types';
import { hydrationService } from '@/services/hydrationService';

interface HydrationState {
  todayLogs: HydrationLog[];
  todayTotal: number;        // sum of amount_ml for today
  weeklyLogs: HydrationLog[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTodayLogs: () => Promise<void>;
  addWater: (amount_ml: number) => Promise<void>;
  fetchWeeklyLogs: () => Promise<void>;
  resetToday: () => Promise<void>;
  clearError: () => void;
}

function sumLogs(logs: HydrationLog[]): number {
  return logs.reduce((acc, log) => acc + log.amount_ml, 0);
}

export const useHydrationStore = create<HydrationState>((set, get) => ({
  todayLogs: [],
  todayTotal: 0,
  weeklyLogs: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchTodayLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const logs = await hydrationService.getTodayLogs();
      set({
        todayLogs: logs,
        todayTotal: sumLogs(logs),
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  /**
   * Optimistic update per AGENTS.md:
   * 1. Update UI immediately
   * 2. Persist to Supabase
   * 3. Rollback on failure
   */
  addWater: async (amount_ml: number) => {
    // 1. Optimistic UI update
    set((state) => ({ todayTotal: state.todayTotal + amount_ml }));
    try {
      // 2. Persist to Supabase
      const log = await hydrationService.addLog(amount_ml);
      set((state) => ({ todayLogs: [log, ...state.todayLogs] }));
    } catch (err) {
      // 3. Rollback on failure
      set((state) => ({
        todayTotal: state.todayTotal - amount_ml,
        error: (err as Error).message,
      }));
    }
  },

  fetchWeeklyLogs: async () => {
    try {
      const logs = await hydrationService.getWeeklyLogs();
      set({ weeklyLogs: logs });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  resetToday: async () => {
    const prevLogs = get().todayLogs;
    const prevTotal = get().todayTotal;
    // Optimistic clear
    set({ todayLogs: [], todayTotal: 0 });
    try {
      await hydrationService.deleteTodayLogs();
    } catch (err) {
      // Rollback
      set({ todayLogs: prevLogs, todayTotal: prevTotal, error: (err as Error).message });
    }
  },
}));
