import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';

export default function Index() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useAuthStore();
  const { profile, isLoading: profileLoading } = useProfileStore();

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      // Always show onboarding for unauthenticated users (dev/demo mode)
      router.replace('/(onboarding)' as any);
      return;
    }

    // Has session: wait for profile to load
    if (profileLoading || !profile) return;

    if (!profile.onboarding_done) {
      router.replace('/(onboarding)' as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  }, [session, authLoading, profile, profileLoading, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgAuth, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.accentPurple} />
    </View>
  );
}
