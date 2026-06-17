import React, { useState, useEffect } from 'react';
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

const AVATAR_OPTIONS = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5'] as const;

export default function ProfileScreen() {
  const { profile, updateProfile } = useProfileStore();
  const { signOut } = useAuthStore();
  const router = useRouter();

  // Goals and Account details states
  const [waterGoal, setWaterGoal] = useState(profile?.water_goal_ml?.toString() || '2500');
  const [sleepGoal, setSleepGoal] = useState(profile?.sleep_goal_hrs?.toString() || '8');
  const [memoryNotes, setMemoryNotes] = useState(profile?.memory_notes || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Edit Mode states for Profile Details Card
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other' | null>(profile?.gender || 'male');
  const [editHeight, setEditHeight] = useState(profile?.height?.toString() || '');
  const [editWeight, setEditWeight] = useState(profile?.weight?.toString() || '');
  const [editAvatar, setEditAvatar] = useState(profile?.avatar_url || 'avatar1');

  // Keep state synchronized with profile updates (e.g. from Supabase/local load)
  useEffect(() => {
    if (profile) {
      setWaterGoal(profile.water_goal_ml?.toString() || '2500');
      setSleepGoal(profile.sleep_goal_hrs?.toString() || '8');
      setMemoryNotes(profile.memory_notes || '');

      setEditName(profile.name || '');
      setEditGender(profile.gender || 'male');
      setEditHeight(profile.height?.toString() || '');
      setEditWeight(profile.weight?.toString() || '');
      setEditAvatar(profile.avatar_url || 'avatar1');
    }
  }, [profile]);

  // Resolve current avatar image source
  const avatarKey = profile?.avatar_url || 'avatar1';
  const avatarSource = images[avatarKey as keyof typeof images] || images.avatarPlaceholder;

  const startEditing = () => {
    setEditName(profile?.name || '');
    setEditGender(profile?.gender || 'male');
    setEditHeight(profile?.height?.toString() || '');
    setEditWeight(profile?.weight?.toString() || '');
    setEditAvatar(profile?.avatar_url || 'avatar1');
    setIsEditing(true);
  };

  const handleSaveDetails = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Please enter a name.');
      return;
    }
    const h = parseFloat(editHeight);
    const w = parseFloat(editWeight);
    if (editHeight && (isNaN(h) || h <= 0)) {
      Alert.alert('Validation Error', 'Please enter a valid height.');
      return;
    }
    if (editWeight && (isNaN(w) || w <= 0)) {
      Alert.alert('Validation Error', 'Please enter a valid weight.');
      return;
    }

    try {
      let bmiValue = profile?.bmi;
      if (h && w) {
        const heightM = h / 100;
        bmiValue = Number((w / (heightM * heightM)).toFixed(1));
      }

      await updateProfile({
        name: editName.trim(),
        gender: editGender,
        height: h || null,
        weight: w || null,
        bmi: bmiValue || null,
        avatar_url: editAvatar,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile details updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile details');
    }
  };

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
          
          {/* Section: Profile Details Card */}
          <View style={styles.profileCard}>
            {!isEditing ? (
              <>
                {/* Edit Button */}
                <TouchableOpacity style={styles.editCardButton} onPress={startEditing}>
                  <Ionicons name="create-outline" size={22} color={colors.accentPurple} />
                </TouchableOpacity>

                <View style={styles.profileCardHeader}>
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
                  <View style={styles.headerInfo}>
                    <Text style={styles.userName}>{profile?.name || 'Guest User'}</Text>
                    <Text style={styles.userEmail}>
                      {profile?.id === 'guest' ? 'Guest Mode' : useAuthStore.getState().user?.email || 'user@example.com'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Grid stats for Gender, Height, Weight */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCol}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="transgender-outline" size={20} color={colors.accentPurple} />
                    </View>
                    <Text style={styles.statLabel}>Gender</Text>
                    <Text style={styles.statValue}>
                      {profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : '—'}
                    </Text>
                  </View>

                  <View style={styles.verticalDivider} />

                  <View style={styles.statCol}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="resize-outline" size={20} color={colors.accentPurple} />
                    </View>
                    <Text style={styles.statLabel}>Height</Text>
                    <Text style={styles.statValue}>
                      {profile?.height ? `${profile.height} cm` : '—'}
                    </Text>
                  </View>

                  <View style={styles.verticalDivider} />

                  <View style={styles.statCol}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="scale-outline" size={20} color={colors.accentPurple} />
                    </View>
                    <Text style={styles.statLabel}>Weight</Text>
                    <Text style={styles.statValue}>
                      {profile?.weight ? `${profile.weight} kg` : '—'}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Edit Mode Content */}
                <View style={styles.editAvatarSection}>
                  <View style={styles.editAvatarRingWrapper}>
                    <LinearGradient
                      colors={gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatarRingInner}
                    >
                      <View style={styles.avatarContainer}>
                        <Image 
                          source={images[editAvatar as keyof typeof images] || images.avatarPlaceholder} 
                          style={styles.avatarImage} 
                        />
                        <View style={styles.avatarEditOverlay}>
                          <Ionicons name="camera" size={20} color="#FFF" />
                        </View>
                      </View>
                    </LinearGradient>
                  </View>

                  <Text style={styles.editAvatarLabel}>CHOOSE YOUR AVATAR</Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.avatarPickerScroll}
                  >
                    {AVATAR_OPTIONS.map((avatarOpt) => {
                      const isSelected = editAvatar === avatarOpt;
                      return (
                        <TouchableOpacity
                          key={avatarOpt}
                          activeOpacity={0.8}
                          onPress={() => setEditAvatar(avatarOpt)}
                          style={[
                            styles.avatarPickerItem,
                            isSelected && styles.avatarPickerItemActive
                          ]}
                        >
                          <Image source={images[avatarOpt]} style={styles.avatarPickerImage} />
                          {isSelected && (
                            <View style={styles.avatarCheckedBadge}>
                              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.editFieldsSection}>
                  <View style={styles.editInputGroup}>
                    <Text style={styles.editLabel}>Name</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Enter your name"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.editInputGroup}>
                    <Text style={styles.editLabel}>Gender</Text>
                    <View style={styles.genderChipsRow}>
                      {(['male', 'female', 'other'] as const).map((genderVal) => {
                        const isSelected = editGender === genderVal;
                        return (
                          <TouchableOpacity
                            key={genderVal}
                            activeOpacity={0.8}
                            onPress={() => setEditGender(genderVal)}
                            style={[
                              styles.genderChip,
                              isSelected && styles.genderChipActive
                            ]}
                          >
                            <Text
                              style={[
                                styles.genderChipText,
                                isSelected && styles.genderChipTextActive
                              ]}
                            >
                              {genderVal.charAt(0).toUpperCase() + genderVal.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.rowFields}>
                    <View style={[styles.editInputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.editLabel}>Height (cm)</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editHeight}
                        onChangeText={setEditHeight}
                        keyboardType="numeric"
                        placeholder="e.g. 175"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                    <View style={[styles.editInputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.editLabel}>Weight (kg)</Text>
                      <TextInput
                        style={styles.editInput}
                        value={editWeight}
                        onChangeText={setEditWeight}
                        keyboardType="numeric"
                        placeholder="e.g. 70"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                </View>

                {/* Edit Mode Buttons */}
                <View style={styles.editActionsRow}>
                  <TouchableOpacity 
                    style={[styles.editActionButton, styles.cancelButton]} 
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <PressableScale onPress={handleSaveDetails} style={{ flex: 1, marginLeft: 8 }}>
                    <LinearGradient
                      colors={gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveDetailsButton}
                    >
                      <Text style={styles.saveDetailsButtonText}>Save Details</Text>
                    </LinearGradient>
                  </PressableScale>
                </View>
              </>
            )}
          </View>

          {/* Section 2: Health Goals */}
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

          {/* Section 3: Account */}
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
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

          {/* Section 4: App settings */}
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
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 24,
    position: 'relative',
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
  editCardButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 6,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 24, // to avoid overlapping with edit button
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRingInner: {
    width: 90,
    height: 90,
    borderRadius: radius.full,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.bgAuth,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.full,
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.borderHairline,
    marginVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.bgChip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderHairline,
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
  
  // Edit mode styles
  editAvatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  editAvatarRingWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarEditOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  avatarPickerScroll: {
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  avatarPickerItem: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
    position: 'relative',
  },
  avatarPickerItemActive: {
    borderColor: colors.accentPurple,
  },
  avatarPickerImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.full,
  },
  avatarCheckedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.accentGreen,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  editFieldsSection: {
    gap: 16,
    marginBottom: 20,
  },
  editInputGroup: {
    width: '100%',
  },
  editLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  editInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textPrimary,
  },
  genderChipsRow: {
    flexDirection: 'row',
  },
  genderChip: {
    flex: 1,
    backgroundColor: colors.bgChip,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  genderChipActive: {
    backgroundColor: colors.accentPurple,
  },
  genderChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  genderChipTextActive: {
    color: colors.textOnGradient,
    fontFamily: 'Inter-SemiBold',
  },
  rowFields: {
    flexDirection: 'row',
  },
  editActionsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  editActionButton: {
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.bgChip,
    marginRight: 8,
  },
  cancelButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  saveDetailsButton: {
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDetailsButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textOnGradient,
  },
});
