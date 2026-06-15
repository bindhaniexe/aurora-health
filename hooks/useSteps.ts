import { useEffect } from 'react';
import { useHealthStore } from '@/stores/healthStore';
import { healthProvider } from '@/lib/health';

export function useSteps() {
  const { 
    todaySteps, 
    weeklySteps, 
    isLoading, 
    permissionsGranted,
    loadTodaySteps,
    loadWeeklySteps,
    refresh
  } = useHealthStore();

  useEffect(() => {
    if (permissionsGranted === 'granted') {
      loadTodaySteps();
      loadWeeklySteps();

      // Subscribe to real-time step updates if available
      const unsubscribe = healthProvider.subscribeToStepUpdates((steps) => {
        // We could just update today's steps, or trigger a full refresh
        useHealthStore.setState({ todaySteps: steps });
      });

      return () => unsubscribe();
    }
  }, [permissionsGranted, loadTodaySteps, loadWeeklySteps]);

  return {
    todaySteps,
    weeklySteps,
    isLoading,
    refresh,
    isGranted: permissionsGranted === 'granted'
  };
}
