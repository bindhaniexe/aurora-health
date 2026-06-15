// app/(tabs)/habits.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useHabits } from '@/hooks/useHabits';
import HabitItem from '@/components/HabitItem';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { ScreenTransition } from '@/components/animated/ScreenTransition';
import { StaggerList } from '@/components/animated/StaggerList';
import { PressableScale } from '@/components/animated/PressableScale';

const HABIT_SUGGESTIONS = [
  'Drink water',
  'Read a book',
  'Meditate 10m',
  'Walk 10k steps',
  'Workout 30m',
  'Journaling',
  'Stretch 10m',
  'Early to bed'
];

export default function HabitsScreen() {
  const { habits, addHabit, completeHabit, deleteHabit } = useHabits();
  const [modalVisible, setModalVisible] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly'>('daily');

  const handleComplete = (id: string) => {
    completeHabit(id);
  };

  const handleSaveHabit = async () => {
    if (newHabitName.trim() === '') return;
    await addHabit(newHabitName.trim(), newHabitFrequency);
    setNewHabitName('');
    setNewHabitFrequency('daily');
    setModalVisible(false);
  };

  const completedTodayCount = habits.filter(h => h.isCompletedToday).length;
  const totalCount = habits.length;
  const progressPct = totalCount === 0 ? 0 : (completedTodayCount / totalCount) * 100;

  const todayStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <ScreenTransition>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.dateText}>{todayStr}</Text>
                <Text style={styles.title}>My Habits</Text>
              </View>
              <PressableScale onPress={() => setModalVisible(true)}>
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addButton}
                >
                  <Ionicons name="add" size={18} color={colors.textOnGradient} />
                  <Text style={styles.addButtonText}>Add</Text>
                </LinearGradient>
              </PressableScale>
            </View>

            {/* Progress Card */}
            <View style={styles.progressCard}>
              <Text style={styles.progressText}>
                {completedTodayCount} of {totalCount} done today
              </Text>
              <View style={styles.progressBarTrack}>
                <LinearGradient
                  colors={gradients.progressBar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${progressPct}%` }]}
                />
              </View>
            </View>

            {/* Habits List */}
            {totalCount === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="leaf-outline" size={32} color={colors.textSecondary} />
                </View>
                <Text style={styles.emptyText}>No habits yet.</Text>
                <Text style={styles.emptySubtext}>Let&apos;s build your first one.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                <StaggerList staggerDelay={70}>
                  {habits.map(habit => (
                    <HabitItem
                      key={habit.id}
                      id={habit.id}
                      name={habit.name}
                      isCompletedToday={habit.isCompletedToday}
                      streak={habit.streak}
                      onComplete={handleComplete}
                      onDelete={deleteHabit}
                    />
                  ))}
                </StaggerList>
              </View>
            )}
          </ScrollView>
        </ScreenTransition>

        {/* Add Habit Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalOverlay}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>New Habit</Text>
                  <PressableScale onPress={() => setModalVisible(false)} haptic="light">
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                  </PressableScale>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Habit Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Read 10 pages"
                    placeholderTextColor={colors.textMuted}
                    value={newHabitName}
                    onChangeText={setNewHabitName}
                    autoFocus
                  />
                  <View style={styles.suggestionsContainer}>
                    {HABIT_SUGGESTIONS.map((item) => (
                      <PressableScale
                        key={item}
                        style={[
                          styles.suggestionChip,
                          newHabitName === item && styles.suggestionChipActive
                        ]}
                        onPress={() => setNewHabitName(item)}
                        scaleDown={0.95}
                      >
                        <Text style={[
                          styles.suggestionText,
                          newHabitName === item && styles.suggestionTextActive
                        ]}>
                          {item}
                        </Text>
                      </PressableScale>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Frequency</Text>
                  <View style={styles.frequencyRow}>
                    <PressableScale
                      style={[
                        styles.freqBtn,
                        newHabitFrequency === 'daily' && styles.freqBtnActive
                      ]}
                      onPress={() => setNewHabitFrequency('daily')}
                      scaleDown={0.96}
                    >
                      <Text style={[
                        styles.freqBtnText,
                        newHabitFrequency === 'daily' && styles.freqBtnTextActive
                      ]}>Daily</Text>
                    </PressableScale>
                    <PressableScale
                      style={[
                        styles.freqBtn,
                        newHabitFrequency === 'weekly' && styles.freqBtnActive
                      ]}
                      onPress={() => setNewHabitFrequency('weekly')}
                      scaleDown={0.96}
                    >
                      <Text style={[
                        styles.freqBtnText,
                        newHabitFrequency === 'weekly' && styles.freqBtnTextActive
                      ]}>Weekly</Text>
                    </PressableScale>
                  </View>
                </View>

                <PressableScale 
                  style={styles.saveBtnContainer} 
                  onPress={handleSaveHabit}
                >
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBtn}
                  >
                    <Text style={styles.saveBtnText}>Save Habit</Text>
                  </LinearGradient>
                </PressableScale>
              </View>
            </KeyboardAvoidingView>
          </GestureHandlerRootView>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 110, // Space to scroll past floating tab bar
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    gap: 4,
  },
  addButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textOnGradient,
    includeFontPadding: false,
  },
  progressCard: {
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
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.bgAuth,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.bgAuth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  list: {
    gap: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: colors.textPrimary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textPrimary,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.bgAuth,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  freqBtnActive: {
    backgroundColor: colors.accentPurple,
  },
  freqBtnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  freqBtnTextActive: {
    color: colors.textOnGradient,
  },
  saveBtnContainer: {
    marginTop: 12,
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.textOnGradient,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  suggestionChip: {
    backgroundColor: colors.bgChip,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  suggestionChipActive: {
    backgroundColor: colors.accentPurple,
  },
  suggestionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.accentPurple,
  },
  suggestionTextActive: {
    color: colors.textOnGradient,
  },
});
