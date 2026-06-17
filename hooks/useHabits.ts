// hooks/useHabits.ts
// Aurora — Custom hook for habits

import { useEffect, useMemo } from 'react';
import { useHabitStore } from '@/stores/habitStore';
import { useAuthStore } from '@/stores/authStore';
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
    completeHabit,
    deleteHabit
  } = useHabitStore();
  const { user, guestMode, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading) {
      if (user || guestMode) {
        fetchHabits();
      } else {
        // Clear habits state when not authenticated/guest
        useHabitStore.setState({ habits: [], todayCompletions: [], streaks: {} });
      }
    }
  }, [fetchHabits, user, guestMode, authLoading]);

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
    deleteHabit,
    fetchHabits, // expose just in case for manual refresh
  };
}
