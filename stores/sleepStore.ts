// stores/sleepStore.ts
// Aurora — Sleep global state via Zustand
// Per AGENTS.md: optimistic updates pattern for logSleep.

import { create } from 'zustand';
import { SleepLog } from '@/types';
import { sleepService } from '@/services/sleepService';

interface SleepState {
  logs: SleepLog[];          // recent 7-day logs, newest-first
  lastNight: SleepLog | null; // today's log (or most recent if today has none)
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLogs: () => Promise<void>;
  logSleep: (hours: number, quality?: SleepLog['quality']) => Promise<void>;
  clearError: () => void;
}

export const useSleepStore = create<SleepState>((set, get) => ({
  logs: [],
  lastNight: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const [logs, todayLog] = await Promise.all([
        sleepService.getRecentLogs(7),
        sleepService.getTodayLog(),
      ]);
      // lastNight = today's log if present, otherwise the newest log in the list
      const lastNight = todayLog ?? (logs.length > 0 ? logs[0] : null);
      set({ logs, lastNight, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  /**
   * Optimistic update per AGENTS.md:
   * 1. Update UI immediately with a temporary log
   * 2. Persist to Supabase / AsyncStorage
   * 3. Replace optimistic entry with real data, or rollback on failure
   */
  logSleep: async (hours: number, quality?: SleepLog['quality']) => {
    const prevLogs = get().logs;
    const prevLastNight = get().lastNight;

    // 1. Optimistic entry
    const optimistic: SleepLog = {
      id: '__optimistic__',
      user_id: 'optimistic',
      hours,
      quality: quality ?? null,
      sleep_date: new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
    };
    // Replace today's entry if it exists optimistically
    const optimisticLogs = [
      optimistic,
      ...prevLogs.filter((l) => l.sleep_date !== optimistic.sleep_date),
    ];
    set({ logs: optimisticLogs, lastNight: optimistic });

    try {
      // 2. Persist
      const saved = await sleepService.addSleepLog(hours, quality);
      // 3. Replace optimistic with real data
      set((state) => ({
        logs: [saved, ...state.logs.filter((l) => l.id !== '__optimistic__' && l.sleep_date !== saved.sleep_date)],
        lastNight: saved,
      }));
    } catch (err) {
      // 3. Rollback
      set({
        logs: prevLogs,
        lastNight: prevLastNight,
        error: (err as Error).message,
      });
    }
  },
}));
