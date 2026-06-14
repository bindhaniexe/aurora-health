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
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  water_goal_ml: number;       // default 2000
  sleep_goal_hrs: number;      // default 8
  goals: string[];
  memory_notes?: string;
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
  quality?: 1 | 2 | 3 | 4 | 5;
  logged_at: string;
  note?: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
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
