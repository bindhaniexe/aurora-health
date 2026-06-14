// app/index.tsx
// Entry point — routing logic:
//   1. First-ever launch    → onboarding
//   2. Seen onboarding, no session → auth (login)
//   3. Has session          → tabs (dashboard)
//
// "onboarding_done" is stored in AsyncStorage (lightweight preference, per AGENTS.md).

import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

const ONBOARDING_KEY = 'aurora_onboarding_done';

export default function Index() {
  const { session, isLoading, initialize } = useAuthStore();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  // Step 1: initialize auth session from SecureStore
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Step 2: read onboarding flag from AsyncStorage
  useEffect(() => {
    // AsyncStorage.removeItem(ONBOARDING_KEY); // Uncomment to clear onboarding for testing
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setOnboardingDone(value === 'true');
      setOnboardingChecked(true);
    });
  }, []);

  // Step 3: route once BOTH checks are complete
  useEffect(() => {
    if (isLoading || !onboardingChecked) return;

    if (!onboardingDone) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace('/(onboarding)' as any);
    } else if (session) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace('/(tabs)' as any);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace('/(auth)' as any);
    }
  }, [isLoading, onboardingChecked, onboardingDone, session]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgAuth }}>
      <ActivityIndicator size="large" color={colors.accentPurple} />
    </View>
  );
}
