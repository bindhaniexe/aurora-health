// app/index.tsx
// Entry point — redirects based on auth session state.
// Uses authStore to determine routing after initialization.

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

export default function Index() {
  const { session, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoading) return;

    if (session) {
      // Authenticated — go to tabs (dashboard)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace('/(tabs)' as any);
    } else {
      // Not authenticated — send to auth flow
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace('/(auth)' as any);
    }
  }, [session, isLoading]);

  // Show a neutral loading screen while we check the session
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgAuth }}>
      <ActivityIndicator size="large" color={colors.accentPurple} />
    </View>
  );
}
