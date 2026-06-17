import AppleHealthKit, { HealthInputOptions, HealthKitPermissions } from 'react-native-health';
import { DailyStepData, HealthProvider, WeeklyStepData } from './types';
import { Platform, NativeEventEmitter, NativeModules } from 'react-native';

const getPermissions = (): HealthKitPermissions => {
  const stepCountPermission = AppleHealthKit?.Constants?.Permissions?.StepCount;
  return {
    permissions: {
      read: stepCountPermission ? [stepCountPermission] : [],
      write: [],
    },
  };
};

export const healthKitProvider: HealthProvider = {
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((err: Object, available: boolean) => {
        if (err) {
          console.error('[HealthKit] Availability error:', err);
          resolve(false);
          return;
        }
        resolve(available);
      });
    });
  },

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(getPermissions(), (err: string) => {
        if (err) {
          console.error('[HealthKit] Init error:', err);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  },

  async getTodaySteps(): Promise<number> {
    return new Promise((resolve) => {
      const options = {
        date: new Date().toISOString(),
      };
      AppleHealthKit.getStepCount(options, (err: Object, results: any) => {
        if (err) {
          console.error('[HealthKit] getTodaySteps error:', err);
          resolve(0);
          return;
        }
        resolve(results ? results.value : 0);
      });
    });
  },

  async getWeeklySteps(): Promise<WeeklyStepData> {
    return new Promise((resolve) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getDailyStepCountSamples(options, (err: Object, results: any[]) => {
        if (err) {
          console.error('[HealthKit] getWeeklySteps error:', err);
          resolve({ startDate: startDate.toISOString(), endDate: endDate.toISOString(), data: [], total: 0, average: 0 });
          return;
        }

        let total = 0;
        const data: DailyStepData[] = [];
        
        // Results are typically array of { value: number, startDate: string, endDate: string }
        if (results && results.length > 0) {
          results.forEach(sample => {
            total += sample.value;
            data.push({
              date: sample.startDate.split('T')[0],
              value: sample.value
            });
          });
        }

        resolve({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          data: data.reverse(), // Ensure chronological order if needed, assuming reverse might be needed
          total,
          average: data.length > 0 ? Math.round(total / data.length) : 0,
        });
      });
    });
  },

  subscribeToStepUpdates(callback: (steps: number) => void): () => void {
    (AppleHealthKit as any).initStepCountObserver({}, () => {});
    const HealthkitEventEmitter = new NativeEventEmitter(NativeModules.AppleHealthKit);
    const subscription = HealthkitEventEmitter.addListener(
      'observer',
      () => {
        this.getTodaySteps().then(callback);
      }
    );
    return () => {
      subscription.remove();
    };
  }
};
