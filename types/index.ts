// Aurora — Core TypeScript Interfaces
// All types live in this file per AGENTS.md

export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  gradientColors: string[];
  emoji: string;
}

export interface Profile {
  id: string;                  // primary key, matches auth.users.id
  name: string;
  avatar_url?: string | null;
  water_goal_ml: number;       // default 2500
  sleep_goal_hrs: number;      // default 8
  goals: string[];
  memory_notes?: string | null;
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface HydrationLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  hours: number;
  quality?: 'poor' | 'fair' | 'good' | 'great' | null;
  sleep_date: string;          // Format: YYYY-MM-DD
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  is_active: boolean;
  created_at: string;
  streak?: number;             // Client-side helper calculated from completions
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;      // Format: YYYY-MM-DD
  created_at: string;
}

export interface HealthSummary {
  todayWaterMl: number;
  lastSleepHours: number | null;
  habitsCompleted: number;
  habitsTotal: number;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}
