import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailableStatus,
  Permission,
} from 'react-native-health-connect';
import { DailyStepData, HealthProvider, WeeklyStepData } from './types';
import { Platform } from 'react-native';

const permissions: Permission[] = [
  { accessType: 'read', recordType: 'Steps' },
];

export const healthConnectProvider: HealthProvider = {
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      const status = await getSdkStatus();
      return status === SdkAvailableStatus.SDK_AVAILABLE;
    } catch (e) {
      console.error('[HealthConnect] isAvailable error:', e);
      return false;
    }
  },

  async requestPermissions(): Promise<boolean> {
    try {
      await initialize();
      const granted = await requestPermission(permissions);
      // requestPermission returns an array of granted permissions
      return granted.length > 0;
    } catch (e) {
      console.error('[HealthConnect] requestPermissions error:', e);
      return false;
    }
  },

  async getTodaySteps(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'after',
          startTime: today.toISOString(),
        },
      });

      let total = 0;
      if (result && result.records) {
        result.records.forEach((record: any) => {
          total += record.count;
        });
      }
      return total;
    } catch (e) {
      console.error('[HealthConnect] getTodaySteps error:', e);
      return 0;
    }
  },

  async getWeeklySteps(): Promise<WeeklyStepData> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const result = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      let total = 0;
      const dataMap: Record<string, number> = {};

      // Initialize map with zeroes
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dataMap[d.toISOString().split('T')[0]] = 0;
      }

      if (result && result.records) {
        result.records.forEach((record: any) => {
          const dateStr = record.startTime.split('T')[0];
          if (dataMap[dateStr] !== undefined) {
            dataMap[dateStr] += record.count;
          }
          total += record.count;
        });
      }

      const data: DailyStepData[] = Object.keys(dataMap).map(date => ({
        date,
        value: dataMap[date]
      })).sort((a, b) => a.date.localeCompare(b.date));

      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        data,
        total,
        average: data.length > 0 ? Math.round(total / data.length) : 0,
      };
    } catch (e) {
      console.error('[HealthConnect] getWeeklySteps error:', e);
      return {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        data: [],
        total: 0,
        average: 0
      };
    }
  },

  subscribeToStepUpdates(callback: (steps: number) => void): () => void {
    // Health Connect does not support native background background subscriptions in standard RN wrapper easily.
    // As a fallback for MVP, we poll or just refresh when called.
    let interval = setInterval(() => {
      this.getTodaySteps().then(callback);
    }, 60000); // poll every minute
    return () => clearInterval(interval);
  }
};
