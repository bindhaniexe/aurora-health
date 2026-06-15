import '../global.css';
import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const { isLoading: authLoading, session, guestMode } = useAuthStore();
  const { profile, isLoading: profileLoading } = useProfileStore();
  const segments = useSegments();
  const router = useRouter();

  // Fires the INITIAL redirect exactly once — prevents dual-routing with index.tsx
  const hasRouted = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Bold': require('@/assets/fonts/Poppins-Bold.ttf'),
    'Poppins-SemiBold': require('@/assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Medium': require('@/assets/fonts/Poppins-Medium.ttf'),
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.ttf'),
    'JetBrainsMono-Regular': require('@/assets/fonts/JetBrainsMono-Regular.ttf'),
  });

  // Initialize auth exactly once on mount
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  // Hide splash screen once fonts AND auth are ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && !authLoading) {
      SplashScreen.hideAsync();
      return; // Already hidden, don't set fallback timer
    }
    
    // Fallback: forcefully hide splash screen after 3 seconds so we don't get stuck permanently
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
      console.log('[RootLayout] Fallback splash hide. fontsLoaded:', fontsLoaded, 'authLoading:', authLoading);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [fontsLoaded, fontError, authLoading]);

  // Fetch profile whenever a session or guest mode becomes active
  useEffect(() => {
    if (session || guestMode) {
      useProfileStore.getState().fetchProfile();
    }
  }, [session, guestMode]);

  // ─── Initial Route ────────────────────────────────────────────────────────
  // Runs once when all async data is ready.  Determines which screen to open.
  useEffect(() => {
    // Not ready yet — wait
    if (authLoading || (!fontsLoaded && !fontError)) return;
    // If there is a session, wait for the profile too
    if (session && (profileLoading || !profile)) return;
    // Already routed — don't re-run
    if (hasRouted.current) return;

    hasRouted.current = true;

    const doInitialRoute = async () => {
      if (session && profile) {
        // Authenticated user: respect onboarding_done flag
        if (!profile.onboarding_done) {
          router.replace('/(onboarding)' as any);
        } else {
          router.replace('/(tabs)' as any);
        }
        return;
      }

      if (guestMode) {
        router.replace('/(tabs)' as any);
        return;
      }

      // No session, no guest: check if the user has seen onboarding before
      const onboardingDone = await AsyncStorage.getItem('aurora_onboarding_done');
      if (onboardingDone === 'true') {
        router.replace('/(auth)' as any);
      } else {
        router.replace('/(onboarding)' as any);
      }
    };

    doInitialRoute();
  }, [authLoading, fontsLoaded, fontError, session, profile, profileLoading, guestMode, router]);

  // ─── Reactive Guard ───────────────────────────────────────────────────────
  // Only runs AFTER the initial route has been decided.
  // Handles: sign-in → go to tabs, sign-out from tabs → go to auth.
  useEffect(() => {
    if (!hasRouted.current) return;
    if (!segments[0]) return;

    const inAuth  = segments[0] === '(auth)';
    const inTabs  = segments[0] === '(tabs)';

    if (session && profile?.onboarding_done && inAuth) {
      // User just signed in while on the auth screen → advance to tabs
      router.replace('/(tabs)' as any);
    } else if (!session && !guestMode && inTabs) {
      // Session expired or user signed out while in tabs → back to auth
      router.replace('/(auth)' as any);
    }
  }, [session, profile, segments, guestMode, router]);

  // Keep the screen blank (splash still showing) until fonts are ready
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
