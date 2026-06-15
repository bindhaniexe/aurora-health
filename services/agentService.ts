import { useHydrationStore } from '@/stores/hydrationStore';
import { useSleepStore } from '@/stores/sleepStore';
import { useHabitStore } from '@/stores/habitStore';
import { useProfileStore } from '@/stores/profileStore';
import { SleepLog } from '@/types';

export const agentService = {
  async executeToolCall(toolName: string, args: Record<string, unknown>): Promise<string> {
    console.log(`[AgentService] Executing ${toolName} with args:`, args);
    try {
      switch (toolName) {
        case 'log_water': {
          const { amount_ml } = args as { amount_ml: number };
          if (typeof amount_ml !== 'number') throw new Error('amount_ml must be a number');
          await useHydrationStore.getState().addWater(amount_ml);
          return `Successfully logged ${amount_ml}ml of water.`;
        }
        case 'log_sleep': {
          const { hours, quality } = args as { hours: number; quality?: string };
          if (typeof hours !== 'number') throw new Error('hours must be a number');
          await useSleepStore.getState().logSleep(hours, quality as SleepLog['quality']);
          return `Successfully logged ${hours} hours of sleep${quality ? ` with ${quality} quality` : ''}.`;
        }
        case 'create_habit': {
          const { name, frequency } = args as { name: string; frequency: 'daily' | 'weekly' };
          await useHabitStore.getState().addHabit(name, frequency);
          return `Successfully created habit: ${name} (${frequency}).`;
        }
        case 'complete_habit': {
          const { habit_name } = args as { habit_name: string };
          const habits = useHabitStore.getState().habits;
          const habit = habits.find(h => h.name.toLowerCase() === habit_name.toLowerCase());
          if (!habit) {
            return `Could not find a habit named "${habit_name}". Active habits: ${habits.map(h => h.name).join(', ')}`;
          }
          await useHabitStore.getState().completeHabit(habit.id);
          return `Successfully marked habit "${habit.name}" as complete for today.`;
        }
        case 'get_health_summary': {
          const { todayTotal } = useHydrationStore.getState();
          const { lastNight } = useSleepStore.getState();
          const { habits, todayCompletions } = useHabitStore.getState();
          const { profile } = useProfileStore.getState();
          
          const completedCount = new Set(todayCompletions.map(c => c.habit_id)).size;
          
          const summary = {
            todayWaterMl: todayTotal,
            waterGoalMl: profile?.water_goal_ml ?? 2500,
            lastSleepHours: lastNight?.hours ?? null,
            sleepGoalHrs: profile?.sleep_goal_hrs ?? 8,
            habitsCompleted: completedCount,
            habitsTotal: habits.length
          };
          return JSON.stringify(summary);
        }
        default:
          return `Error: Unknown tool ${toolName}`;
      }
    } catch (error) {
      console.error(`[AgentService] Error executing ${toolName}:`, error);
      return `Error executing ${toolName}: ${(error as Error).message}`;
    }
  }
};
