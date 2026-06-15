// services/hydrationService.ts
// Aurora — Hydration Supabase service layer
// Per AGENTS.md: all Supabase access goes through services. Screens/stores never call Supabase directly.

import { supabase } from '@/lib/supabase';
import { HydrationLog } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Returns today's date as YYYY-MM-DD in local time */
function todayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns the ISO start-of-today in UTC for range queries */
function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Returns the ISO start of N days ago in UTC */
function startOfNDaysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export const hydrationService = {
  /**
   * Fetch all hydration logs for today (midnight → now), ordered newest-first.
   */
  async getTodayLogs(): Promise<HydrationLog[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const localLogsStr = await AsyncStorage.getItem('@aurora_hydration_logs');
      const allLogs: HydrationLog[] = localLogsStr ? JSON.parse(localLogsStr) : [];
      const todayStart = startOfTodayISO();
      return allLogs
        .filter((log) => log.logged_at >= todayStart)
        .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
    }

    const { data, error } = await supabase
      .from('hydration_logs')
      .select('*')
      .gte('logged_at', startOfTodayISO())
      .order('logged_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Insert a new hydration log for the authenticated user.
   */
  async addLog(amount_ml: number): Promise<HydrationLog> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const localLogsStr = await AsyncStorage.getItem('@aurora_hydration_logs');
      const allLogs: HydrationLog[] = localLogsStr ? JSON.parse(localLogsStr) : [];
      const newLog: HydrationLog = {
        id: Math.random().toString(36).substring(2, 11),
        user_id: 'guest',
        amount_ml,
        logged_at: new Date().toISOString(),
      };
      allLogs.unshift(newLog);
      await AsyncStorage.setItem('@aurora_hydration_logs', JSON.stringify(allLogs));
      return newLog;
    }

    const { data, error } = await supabase
      .from('hydration_logs')
      .insert({
        user_id: user.id,
        amount_ml,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch hydration logs for the past 7 days (today inclusive), ordered oldest-first.
   */
  async getWeeklyLogs(): Promise<HydrationLog[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const localLogsStr = await AsyncStorage.getItem('@aurora_hydration_logs');
      const allLogs: HydrationLog[] = localLogsStr ? JSON.parse(localLogsStr) : [];
      const rangeStart = startOfNDaysAgoISO(6);
      return allLogs
        .filter((log) => log.logged_at >= rangeStart)
        .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());
    }

    const { data, error } = await supabase
      .from('hydration_logs')
      .select('*')
      .gte('logged_at', startOfNDaysAgoISO(6)) // 6 days ago + today = 7 days
      .order('logged_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Delete all of today's logs — used for a daily reset / undo-all action.
   */
  async deleteTodayLogs(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const localLogsStr = await AsyncStorage.getItem('@aurora_hydration_logs');
      const allLogs: HydrationLog[] = localLogsStr ? JSON.parse(localLogsStr) : [];
      const todayStart = startOfTodayISO();
      const filteredLogs = allLogs.filter((log) => log.logged_at < todayStart);
      await AsyncStorage.setItem('@aurora_hydration_logs', JSON.stringify(filteredLogs));
      return;
    }

    const { error } = await supabase
      .from('hydration_logs')
      .delete()
      .eq('user_id', user.id)
      .gte('logged_at', startOfTodayISO());

    if (error) throw error;
  },
};
