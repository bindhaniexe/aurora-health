import { create } from 'zustand';
import { WeeklyStepData, HealthPermissions } from '@/lib/health/types';
import { healthProvider } from '@/lib/health';

interface HealthState {
  todaySteps: number;
  weeklySteps: WeeklyStepData | null;
  isLoading: boolean;
  permissionsGranted: HealthPermissions;
  
  initializeHealth: () => Promise<void>;
  loadTodaySteps: () => Promise<void>;
  loadWeeklySteps: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  todaySteps: 0,
  weeklySteps: null,
  isLoading: false,
  permissionsGranted: 'undetermined',

  initializeHealth: async () => {
    set({ isLoading: true });
    try {
      const isAvailable = await healthProvider.isAvailable();
      if (!isAvailable) {
        set({ permissionsGranted: 'denied', isLoading: false });
        return;
      }

      const granted = await healthProvider.requestPermissions();
      set({ permissionsGranted: granted ? 'granted' : 'denied' });

      if (granted) {
        await get().refresh();
      }
    } catch (e) {
      console.error('[HealthStore] init error:', e);
      set({ permissionsGranted: 'denied' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadTodaySteps: async () => {
    if (get().permissionsGranted !== 'granted') return;
    try {
      const steps = await healthProvider.getTodaySteps();
      set({ todaySteps: steps });
    } catch (e) {
      console.error('[HealthStore] loadTodaySteps error:', e);
    }
  },

  loadWeeklySteps: async () => {
    if (get().permissionsGranted !== 'granted') return;
    try {
      const weekly = await healthProvider.getWeeklySteps();
      set({ weeklySteps: weekly });
    } catch (e) {
      console.error('[HealthStore] loadWeeklySteps error:', e);
    }
  },

  refresh: async () => {
    if (get().permissionsGranted !== 'granted') return;
    set({ isLoading: true });
    try {
      const [today, weekly] = await Promise.all([
        healthProvider.getTodaySteps(),
        healthProvider.getWeeklySteps()
      ]);
      set({ todaySteps: today, weeklySteps: weekly });
    } catch (e) {
      console.error('[HealthStore] refresh error:', e);
    } finally {
      set({ isLoading: false });
    }
  }
}));
