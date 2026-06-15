import { useHydrationStore } from '@/stores/hydrationStore';
import { useSleepStore } from '@/stores/sleepStore';
import { useHabitStore } from '@/stores/habitStore';
import { useProfileStore } from '@/stores/profileStore';

export interface HealthSummary {
  todayWaterMl: number;
  waterGoalMl: number;
  lastSleepHours: number | null;
  sleepGoalHrs: number;
  habitsCompleted: number;
  habitsTotal: number;
}

export function useHealthSummary(): HealthSummary {
  const { todayTotal } = useHydrationStore();
  const { lastNight } = useSleepStore();
  const { habits, todayCompletions } = useHabitStore();
  const { profile } = useProfileStore();

  const activeHabits = habits.length;
  // Count how many unique habits were completed today
  // Since todayCompletions only has today's completions for the user, 
  // we just count unique habit_ids (or just length if there are no duplicates).
  const completedCount = new Set(todayCompletions.map(c => c.habit_id)).size;

  return {
    todayWaterMl: todayTotal,
    waterGoalMl: profile?.water_goal_ml ?? 2500,
    lastSleepHours: lastNight?.hours ?? null,
    sleepGoalHrs: profile?.sleep_goal_hrs ?? 8,
    habitsCompleted: completedCount,
    habitsTotal: activeHabits,
  };
}
