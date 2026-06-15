// services/habitService.ts
// Aurora — Habits Supabase service layer

import { supabase } from '@/lib/supabase';
import { Habit, HabitCompletion } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';

const LOCAL_HABITS_KEY = '@aurora_habits';
const LOCAL_COMPLETIONS_KEY = '@aurora_habit_completions';

async function getAuthenticatedUser() {
  let user = useAuthStore.getState().user;
  if (!user) {
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      user = null;
    }
  }
  return user;
}

/** Returns today's date as YYYY-MM-DD in local time */
function todayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const habitService = {
  /**
   * Fetch all active habits for the current user.
   */
  async getHabits(): Promise<Habit[]> {
    const user = await getAuthenticatedUser();

    if (!user) {
      const existing = await AsyncStorage.getItem(LOCAL_HABITS_KEY);
      return existing ? JSON.parse(existing) : [];
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      console.error('HabitService getHabits error:', error);
      throw new Error('Something went wrong fetching habits. Please try again.');
    }
  },

  /**
   * Create a new habit.
   */
  async createHabit(name: string, frequency: 'daily' | 'weekly'): Promise<Habit> {
    const user = await getAuthenticatedUser();

    if (!user) {
      const existing = await AsyncStorage.getItem(LOCAL_HABITS_KEY);
      const allHabits: Habit[] = existing ? JSON.parse(existing) : [];
      
      const newHabit: Habit = {
        id: Math.random().toString(36).substring(2, 11),
        user_id: 'guest',
        name,
        frequency,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      
      allHabits.push(newHabit); // Add to end (or unshift to start, but DB orders by created_at)
      await AsyncStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(allHabits));
      return newHabit;
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name,
          frequency,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('HabitService createHabit error:', error);
      throw new Error('Something went wrong creating your habit. Please try again.');
    }
  },

  /**
   * Mark a habit as completed for today.
   */
  async completeHabit(habitId: string): Promise<HabitCompletion> {
    const user = await getAuthenticatedUser();
    const today = todayDateStr();

    if (!user) {
      const existing = await AsyncStorage.getItem(LOCAL_COMPLETIONS_KEY);
      const allCompletions: HabitCompletion[] = existing ? JSON.parse(existing) : [];
      
      // Check if already completed today
      const alreadyCompleted = allCompletions.find(c => c.habit_id === habitId && c.completed_date === today);
      if (alreadyCompleted) return alreadyCompleted;

      const newCompletion: HabitCompletion = {
        id: Math.random().toString(36).substring(2, 11),
        habit_id: habitId,
        user_id: 'guest',
        completed_date: today,
        created_at: new Date().toISOString(),
      };
      
      allCompletions.unshift(newCompletion);
      await AsyncStorage.setItem(LOCAL_COMPLETIONS_KEY, JSON.stringify(allCompletions));
      return newCompletion;
    }

    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .upsert(
          {
            habit_id: habitId,
            user_id: user.id,
            completed_date: today,
          },
          { onConflict: 'habit_id,completed_date' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('HabitService completeHabit error:', error);
      throw new Error('Something went wrong completing your habit. Please try again.');
    }
  },

  /**
   * Fetch all habit completions recorded today.
   */
  async getTodayCompletions(): Promise<HabitCompletion[]> {
    const user = await getAuthenticatedUser();
    const today = todayDateStr();

    if (!user) {
      const existing = await AsyncStorage.getItem(LOCAL_COMPLETIONS_KEY);
      const allCompletions: HabitCompletion[] = existing ? JSON.parse(existing) : [];
      return allCompletions.filter(c => c.completed_date === today);
    }

    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed_date', today);

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      console.error('HabitService getTodayCompletions error:', error);
      throw new Error("Something went wrong fetching today's habits. Please try again.");
    }
  },

  /**
   * Calculate consecutive days a habit has been completed up to today or yesterday.
   */
  async getStreakForHabit(habitId: string): Promise<number> {
    const user = await getAuthenticatedUser();
    
    let completions: HabitCompletion[] = [];
    if (!user) {
      const existing = await AsyncStorage.getItem(LOCAL_COMPLETIONS_KEY);
      const allCompletions: HabitCompletion[] = existing ? JSON.parse(existing) : [];
      completions = allCompletions
        .filter(c => c.habit_id === habitId)
        .sort((a, b) => b.completed_date.localeCompare(a.completed_date));
    } else {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId)
        .order('completed_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching completions for streak', error);
        return 0;
      }
      completions = data ?? [];
    }

    if (completions.length === 0) return 0;

    // Filter to unique dates just in case
    const uniqueDates = Array.from(new Set(completions.map(c => c.completed_date)));

    let streak = 0;
    const d = new Date();
    let currentCheckDate = todayDateStr();
    
    if (uniqueDates[0] === currentCheckDate) {
      streak++;
      d.setDate(d.getDate() - 1);
      currentCheckDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else {
      d.setDate(d.getDate() - 1);
      currentCheckDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (uniqueDates[0] !== currentCheckDate) {
        return 0;
      }
    }

    for (let i = streak === 1 ? 1 : 0; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === currentCheckDate) {
        streak++;
        d.setDate(d.getDate() - 1);
        currentCheckDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else {
        break;
      }
    }

    return streak;
  },

  /**
   * Soft-delete a habit.
   */
  async deleteHabit(habitId: string): Promise<void> {
    const user = await getAuthenticatedUser();

    if (!user) {
      const existing = await AsyncStorage.getItem(LOCAL_HABITS_KEY);
      if (existing) {
        const allHabits: Habit[] = JSON.parse(existing);
        const updatedHabits = allHabits.map(h => 
          h.id === habitId ? { ...h, is_active: false } : h
        );
        await AsyncStorage.setItem(LOCAL_HABITS_KEY, JSON.stringify(updatedHabits));
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', habitId);

      if (error) throw error;
    } catch (error) {
      console.error('HabitService deleteHabit error:', error);
      throw new Error('Something went wrong deleting your habit. Please try again.');
    }
  }
};
