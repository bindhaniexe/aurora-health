export interface DailyStepData {
  date: string; // ISO format YYYY-MM-DD
  value: number;
}

export interface WeeklyStepData {
  startDate: string;
  endDate: string;
  data: DailyStepData[];
  total: number;
  average: number;
}

export type HealthPermissions = 'granted' | 'denied' | 'undetermined';

export interface HealthProvider {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  getTodaySteps(): Promise<number>;
  getWeeklySteps(): Promise<WeeklyStepData>;
  subscribeToStepUpdates(callback: (steps: number) => void): () => void;
}
