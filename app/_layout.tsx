import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLoading: authLoading, session } = useAuthStore();
  const { profile, fetchProfile, isLoading: profileLoading } = useProfileStore();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Bold': require('@/assets/fonts/Poppins-Bold.ttf'),
    'Poppins-SemiBold': require('@/assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Medium': require('@/assets/fonts/Poppins-Medium.ttf'),
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.ttf'),
    'JetBrainsMono-Regular': require('@/assets/fonts/JetBrainsMono-Regular.ttf'),
  });

  // Initialize auth exactly once on mount — use getState() to avoid
  // React Compiler treating the function as an unstable dependency
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  // Hide splash screen once fonts and auth are both ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, authLoading]);

  // Fetch profile when session appears
  useEffect(() => {
    if (session) {
      useProfileStore.getState().fetchProfile();
    }
  }, [session]);

  // Reactive navigation guard — handles changes AFTER initial routing
  // (e.g. sign-in → tabs, sign-out → onboarding)
  useEffect(() => {
    if (authLoading || (!fontsLoaded && !fontError)) return;
    if (session && (profileLoading || !profile)) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    // Root index.tsx handles its own initial redirect — skip
    if (!segments[0]) return;

    if (session && profile) {
      if (!profile.onboarding_done) {
        if (!inOnboardingGroup) router.replace('/(onboarding)' as any);
      } else {
        if (inAuthGroup || inOnboardingGroup) {
          router.replace('/(tabs)' as any);
        }
      }
    } else if (!session) {
      if (inTabsGroup) {
        router.replace('/(onboarding)' as any);
      }
    }
  }, [session, authLoading, profile, profileLoading, segments, fontsLoaded, fontError, router]);

  // Return null (blank) until fonts are ready
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgAuth },
      }}
    />
  );
}

