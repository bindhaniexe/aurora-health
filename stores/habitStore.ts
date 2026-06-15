// stores/habitStore.ts
// Aurora — Zustand store for Habits

import { create } from 'zustand';
import { Habit, HabitCompletion } from '@/types';
import { habitService } from '@/services/habitService';

interface HabitState {
  habits: Habit[];
  todayCompletions: HabitCompletion[];
  isLoading: boolean;
  streaks: Record<string, number>; // Map of habit_id to streak count
  
  fetchHabits: () => Promise<void>;
  addHabit: (name: string, frequency: 'daily' | 'weekly') => Promise<void>;
  completeHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  todayCompletions: [],
  isLoading: false,
  streaks: {},

  fetchHabits: async () => {
    set({ isLoading: true });
    try {
      const [habitsData, completionsData] = await Promise.all([
        habitService.getHabits(),
        habitService.getTodayCompletions(),
      ]);
      
      set({ 
        habits: habitsData, 
        todayCompletions: completionsData,
      });

      // Fetch streaks for all habits
      const streaksData: Record<string, number> = {};
      await Promise.all(
        habitsData.map(async (habit) => {
          const streak = await habitService.getStreakForHabit(habit.id);
          streaksData[habit.id] = streak;
        })
      );

      set({ streaks: streaksData, isLoading: false });
    } catch (error) {
      console.error('Error fetching habits:', error);
      set({ isLoading: false });
    }
  },

  addHabit: async (name: string, frequency: 'daily' | 'weekly') => {
    try {
      const newHabit = await habitService.createHabit(name, frequency);
      set((state) => ({
        habits: [newHabit, ...state.habits],
        streaks: { ...state.streaks, [newHabit.id]: 0 },
      }));
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  },

  completeHabit: async (habitId: string) => {
    const { todayCompletions, streaks } = get();
    
    if (todayCompletions.some(c => c.habit_id === habitId)) {
      return; // Already completed today
    }

    // Date helper for optimistic update to match exactly
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const tempId = `temp-${Date.now()}`;
    const optimisticCompletion: HabitCompletion = {
      id: tempId,
      habit_id: habitId,
      user_id: 'optimistic',
      completed_date: today,
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    set({ 
      todayCompletions: [optimisticCompletion, ...todayCompletions],
      streaks: {
        ...streaks,
        [habitId]: (streaks[habitId] || 0) + 1,
      }
    });

    try {
      const realCompletion = await habitService.completeHabit(habitId);
      set((state) => ({
        todayCompletions: state.todayCompletions.map(c => 
          c.id === tempId ? realCompletion : c
        )
      }));
    } catch (error) {
      console.error('Error completing habit:', error);
      // Rollback
      set({ 
        todayCompletions,
        streaks,
      });
    }
  },

  deleteHabit: async (habitId: string) => {
    const { habits, streaks, todayCompletions } = get();
    
    // Save current state for potential rollback
    const originalHabits = habits;
    const originalStreaks = { ...streaks };
    const originalCompletions = todayCompletions;
    
    // Optimistic update: remove the habit and its completions from active lists
    set({
      habits: habits.filter(h => h.id !== habitId),
      todayCompletions: todayCompletions.filter(c => c.habit_id !== habitId),
    });
    
    try {
      await habitService.deleteHabit(habitId);
    } catch (error) {
      console.error('Error deleting habit:', error);
      // Rollback on failure
      set({
        habits: originalHabits,
        streaks: originalStreaks,
        todayCompletions: originalCompletions,
      });
      throw error;
    }
  },
}));
