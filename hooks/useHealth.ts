import { useEffect } from 'react';
import { useHealthStore } from '@/stores/healthStore';

export function useHealth() {
  const { 
    permissionsGranted, 
    isLoading, 
    initializeHealth, 
    refresh 
  } = useHealthStore();

  useEffect(() => {
    if (permissionsGranted === 'undetermined') {
      initializeHealth();
    }
  }, [permissionsGranted, initializeHealth]);

  return {
    permissionsGranted,
    isLoading,
    initializeHealth,
    refresh,
    isGranted: permissionsGranted === 'granted',
    isDenied: permissionsGranted === 'denied',
  };
}
