import { HealthProvider } from './types';

export * from './types';

export const USE_MOCK_HEALTH_DATA = true;

const mockProvider: HealthProvider = {
  isAvailable: async () => true,
  requestPermissions: async () => true,
  getTodaySteps: async () => 6432, // Static value
  getWeeklySteps: async () => {
    const data = [];
    let total = 0;
    const endDate = new Date();
    
    // Some static varied values for the week
    const staticSteps = [4200, 5100, 3800, 6400, 7200, 5800, 6432]; 
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(endDate.getDate() - (6 - i));
      const steps = staticSteps[i];
      total += steps;
      data.push({
        date: d.toISOString().split('T')[0],
        value: steps
      });
    }
    return {
      startDate: data[0].date,
      endDate: data[6].date,
      data,
      total,
      average: Math.round(total / 7)
    };
  },
  subscribeToStepUpdates: (cb) => {
    // Just return the static value once
    cb(6432);
    const interval = setInterval(() => {
      cb(6432);
    }, 10000);
    return () => clearInterval(interval);
  },
};

// Export the mock provider directly
export const healthProvider: HealthProvider = mockProvider;

// Helper functions for easy access
export const getTodaySteps = () => healthProvider.getTodaySteps();
export const getWeeklySteps = () => healthProvider.getWeeklySteps();
export const subscribeToStepUpdates = (cb: (steps: number) => void) => healthProvider.subscribeToStepUpdates(cb);
export const requestHealthPermissions = () => healthProvider.requestPermissions();
export const isHealthAvailable = () => healthProvider.isAvailable();
