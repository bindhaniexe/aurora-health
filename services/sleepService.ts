// services/sleepService.ts
// Aurora — Sleep Supabase service layer
// Per AGENTS.md: all Supabase access goes through services. Screens/stores never call Supabase directly.

import { supabase } from '@/lib/supabase';
import { SleepLog } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';

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

const LOCAL_KEY = '@aurora_sleep_logs';

/** Returns today's date as YYYY-MM-DD in local time */
function todayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns a date N days ago as YYYY-MM-DD in local time */
function nDaysAgoDateStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const sleepService = {
  /**
   * Add a sleep log for the current user (authenticated or guest).
   * If a log already exists for today, it is upserted by sleep_date.
   */
  async addSleepLog(
    hours: number,
    quality?: SleepLog['quality'],
  ): Promise<SleepLog> {
    const user = await getAuthenticatedUser();

    if (!user) {
      // Guest mode — persist to AsyncStorage
      const existing = await AsyncStorage.getItem(LOCAL_KEY);
      const allLogs: SleepLog[] = existing ? JSON.parse(existing) : [];
      const today = todayDateStr();
      // Upsert: replace existing today entry if present
      const filtered = allLogs.filter((l) => l.sleep_date !== today);
      const newLog: SleepLog = {
        id: Math.random().toString(36).substring(2, 11),
        user_id: 'guest',
        hours,
        quality: quality ?? null,
        sleep_date: today,
        created_at: new Date().toISOString(),
      };
      filtered.unshift(newLog);
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(filtered));
      return newLog;
    }

    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .upsert(
          {
            user_id: user.id,
            hours,
            quality: quality ?? null,
            sleep_date: todayDateStr(),
          },
          { onConflict: 'user_id,sleep_date' },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SleepService addSleepLog error:', error);
      throw new Error('Something went wrong saving your sleep log. Please try again.');
    }
  },

  /**
   * Fetch the most recent N days of sleep logs, ordered newest-first.
   * Defaults to 7 days.
   */
  async getRecentLogs(days = 7): Promise<SleepLog[]> {
    const user = await getAuthenticatedUser();

    const cutoff = nDaysAgoDateStr(days - 1); // inclusive range

    if (!user) {
      const existing = await AsyncStorage.getItem(LOCAL_KEY);
      const allLogs: SleepLog[] = existing ? JSON.parse(existing) : [];
      return allLogs
        .filter((l) => l.sleep_date >= cutoff)
        .sort((a, b) => b.sleep_date.localeCompare(a.sleep_date));
    }

    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('sleep_date', cutoff)
        .order('sleep_date', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      console.error('SleepService getRecentLogs error:', error);
      throw new Error('Something went wrong fetching recent sleep logs. Please try again.');
    }
  },

  /**
   * Fetch today's sleep log, or null if none exists.
   */
  async getTodayLog(): Promise<SleepLog | null> {
    const user = await getAuthenticatedUser();

    const today = todayDateStr();

    if (!user) {
      const existing = await AsyncStorage.getItem(LOCAL_KEY);
      const allLogs: SleepLog[] = existing ? JSON.parse(existing) : [];
      return allLogs.find((l) => l.sleep_date === today) ?? null;
    }

    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('sleep_date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SleepService getTodayLog error:', error);
      throw new Error("Something went wrong fetching today's sleep log. Please try again.");
    }
  },
};
