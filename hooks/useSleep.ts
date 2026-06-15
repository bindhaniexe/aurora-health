// hooks/useSleep.ts
// Aurora — Sleep hook composing sleepStore + profile sleep goal
// Exposes clean, derived state the Sleep screen and Dashboard card need.

import { useSleepStore } from '@/stores/sleepStore';
import { useProfileStore } from '@/stores/profileStore';
import { SleepLog } from '@/types';

const DEFAULT_GOAL_HRS = 8;

interface UseSleepReturn {
  lastNight: SleepLog | null;    // tonight's / most-recent log
  weeklyLogs: SleepLog[];        // past 7 days, newest-first
  averageHours: number;          // rolling 7-day average (0 if no data)
  goalHrs: number;               // from profile, default 8
  isLoading: boolean;
  error: string | null;
  fetchLogs: () => Promise<void>;
  logSleep: (hours: number, quality?: SleepLog['quality']) => Promise<void>;
}

export function useSleep(): UseSleepReturn {
  const { profile } = useProfileStore();
  const { logs, lastNight, isLoading, error, fetchLogs, logSleep } =
    useSleepStore();

  const goalHrs = profile?.sleep_goal_hrs ?? DEFAULT_GOAL_HRS;

  const averageHours =
    logs.length > 0
      ? Math.round((logs.reduce((acc, l) => acc + l.hours, 0) / logs.length) * 10) / 10
      : 0;

  return {
    lastNight,
    weeklyLogs: logs,
    averageHours,
    goalHrs,
    isLoading,
    error,
    fetchLogs,
    logSleep,
  };
}
