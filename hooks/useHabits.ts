// hooks/useHabits.ts
// Aurora — Custom hook for habits

import { useEffect, useMemo } from 'react';
import { useHabitStore } from '@/stores/habitStore';
import { Habit } from '@/types';

export interface HabitWithStatus extends Habit {
  isCompletedToday: boolean;
  streak: number;
}

export function useHabits() {
  const { 
    habits, 
    todayCompletions, 
    streaks, 
    isLoading, 
    fetchHabits, 
    addHabit, 
    completeHabit 
  } = useHabitStore();

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const mappedHabits = useMemo<HabitWithStatus[]>(() => {
    return habits.map(habit => {
      const isCompletedToday = todayCompletions.some(c => c.habit_id === habit.id);
      return {
        ...habit,
        isCompletedToday,
        streak: streaks[habit.id] || 0,
      };
    });
  }, [habits, todayCompletions, streaks]);

  return {
    habits: mappedHabits,
    todayCompletions,
    isLoading,
    addHabit,
    completeHabit,
    fetchHabits, // expose just in case for manual refresh
  };
}
