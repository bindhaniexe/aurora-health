import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { images } from '@/constants/images';
import { Image } from 'expo-image';
import { useProfileStore } from '@/stores/profileStore';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { ScreenTransition } from '@/components/animated/ScreenTransition';
import { PressableScale } from '@/components/animated/PressableScale';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useSleepStore } from '@/stores/sleepStore';
import { useHabitStore } from '@/stores/habitStore';
import { useCompanionStore } from '@/stores/companionStore';
import { useHealthStore } from '@/stores/healthStore';

export default function ProfileScreen() {
  const { profile, updateProfile } = useProfileStore();
  const { signOut } = useAuthStore();
  const router = useRouter();

  // Resolve avatar image source
  const avatarKey = profile?.avatar_url || 'avatar1';
  const avatarSource = images[avatarKey as keyof typeof images] || images.avatarPlaceholder;

  const [waterGoal, setWaterGoal] = useState(profile?.water_goal_ml?.toString() || '2500');
  const [sleepGoal, setSleepGoal] = useState(profile?.sleep_goal_hrs?.toString() || '8');
  const [name, setName] = useState(profile?.name || '');
  const [memoryNotes, setMemoryNotes] = useState(profile?.memory_notes || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSaveGoals = async () => {
    try {
      await updateProfile({
        water_goal_ml: parseInt(waterGoal, 10) || 2500,
        sleep_goal_hrs: parseFloat(sleepGoal) || 8,
        memory_notes: memoryNotes.trim() === '' ? null : memoryNotes.trim(),
      });
      Alert.alert('Success', 'Goals updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update goals');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)' as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleDevReset = async () => {
    Alert.alert(
      'Developer Reset',
      'This will erase all local databases, reset your onboarding progress, and sign you out. Are you sure you want to completely reset?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Reset user onboarding flag in DB if they are signed in (not guest)
              const { user } = useAuthStore.getState();
              const currentProfile = useProfileStore.getState().profile;
              if (user && currentProfile && currentProfile.id !== 'guest') {
                try {
                  await updateProfile({ onboarding_done: false });
                } catch (dbErr) {
                  console.warn('[DevReset] Failed to update onboarding_done in Supabase profile:', dbErr);
                }
              }

              // 2. Clear AsyncStorage (guest profile, logged water, sleep logs, habits, onboarding_done flag)
              await AsyncStorage.clear();

              // 3. Sign out of Supabase
              try {
                await signOut();
              } catch (authErr) {
                console.warn('[DevReset] Failed to sign out from Supabase:', authErr);
              }

              // 4. Reset stores to initial states
              useAuthStore.setState({ session: null, user: null, guestMode: false, isLoading: false });
              useProfileStore.setState({ profile: null, isLoading: false, error: null });
              useHydrationStore.setState({ todayLogs: [], todayTotal: 0, weeklyLogs: [], isLoading: false, error: null });
              useSleepStore.setState({ logs: [], lastNight: null, isLoading: false, error: null });
              useHabitStore.setState({ habits: [], todayCompletions: [], isLoading: false, streaks: {} });
              useCompanionStore.setState({ connectionState: 'idle', mode: 'voice', transcript: [], errorMessage: null });
              useHealthStore.setState({ todaySteps: 0, weeklySteps: null, isLoading: false, permissionsGranted: 'undetermined' });

              // 5. Route to onboarding slides
              router.replace('/(onboarding)' as any);
              
              Alert.alert('Success', 'Aurora has been fully reset.');
            } catch (err) {
              console.error('[DevReset] Error resetting app:', err);
              Alert.alert('Error', 'Failed to fully reset the application.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary, position: 'relative', overflow: 'hidden' }} edges={['top']}>
      <ScreenTransition>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Section */}
        <View style={styles.topSection}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View style={styles.avatarContainer}>
              <Image source={avatarSource} style={styles.avatarImage} />
            </View>
          </LinearGradient>
          <Text style={styles.userName}>{profile?.name || 'Guest User'}</Text>
          <Text style={styles.userEmail}>{profile?.id === 'guest' ? 'Guest Mode' : useAuthStore.getState().user?.email || 'user@example.com'}</Text>
        </View>

        {/* Section 1: Health Goals */}
        <Text style={styles.sectionTitle}>Health Goals</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Daily Water Goal (ml)</Text>
            <TextInput
              style={styles.input}
              value={waterGoal}
              onChangeText={setWaterGoal}
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sleep Goal (hrs)</Text>
            <TextInput
              style={styles.input}
              value={sleepGoal}
              onChangeText={setSleepGoal}
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <PressableScale onPress={handleSaveGoals} style={{ marginTop: 16 }}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save Goals</Text>
            </LinearGradient>
          </PressableScale>
        </View>

        {/* Section 2: Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Edit Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Health Memory Notes</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              value={memoryNotes}
              onChangeText={setMemoryNotes}
              placeholder="E.g., I am training for a 5k, feeling stressed..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.rowGroup}>
            <Text style={styles.label}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.bgInput, true: colors.accentPurple }}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.card}>
          <View style={styles.rowGroup}>
            <Text style={styles.label}>App Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <PressableScale style={styles.rowGroup} onPress={handleSignOut} scaleDown={0.96}>
            <Text style={[styles.label, { color: colors.error, fontFamily: 'Inter-Medium' }]}>Sign Out</Text>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
          </PressableScale>
          <View style={styles.divider} />
          <PressableScale style={styles.rowGroup} onPress={handleDevReset} scaleDown={0.96}>
            <Text style={[styles.label, { color: colors.error, fontFamily: 'Inter-Medium' }]}>Dev Reset App & Data</Text>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </PressableScale>
        </View>
      </ScrollView>
      </ScreenTransition>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.bgAuth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.full,
  },
  userName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#9499A7',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  inputGroup: {
    marginBottom: 12,
  },
  rowGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  value: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderHairline,
    marginVertical: 12,
  },
  saveButton: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: colors.textOnGradient,
  },
});
