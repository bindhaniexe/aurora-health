import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { useProfileStore } from '@/stores/profileStore';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { profile, updateProfile } = useProfileStore();
  const { signOut } = useAuthStore();
  const router = useRouter();

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }} edges={['top']}>
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
              <Ionicons name="person" size={40} color={colors.textSecondary} />
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
          
          <TouchableOpacity onPress={handleSaveGoals} activeOpacity={0.8} style={{ marginTop: 16 }}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save Goals</Text>
            </LinearGradient>
          </TouchableOpacity>
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

        {/* Section 3: App */}
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.card}>
          <View style={styles.rowGroup}>
            <Text style={styles.label}>App Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.rowGroup} onPress={handleSignOut}>
            <Text style={[styles.label, { color: colors.error, fontFamily: 'Inter-Medium' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
