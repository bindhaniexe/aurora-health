import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { images } from '@/constants/images';
import { useProfileStore } from '@/stores/profileStore';
import { PressableScale } from '@/components/animated/PressableScale';
import { FloatingOrbs } from '@/components/animated/FloatingOrbs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants & Types ────────────────────────────────────────────────────────

const AVATARS = [
  images.avatar1,
  images.avatar2,
  images.avatar3,
  images.avatar4,
  images.avatar5,
];

const GENDERS = ['male', 'female', 'other'] as const;
type Gender = typeof GENDERS[number];

// ─── Custom Sliding Segmented Control for Gender ──────────────────────────────

interface GenderSelectorProps {
  selected: Gender;
  onSelect: (gender: Gender) => void;
}

function GenderSelector({ selected, onSelect }: GenderSelectorProps) {
  const containerWidth = SCREEN_WIDTH - 80; // Margin padding offsets
  const segmentWidth = containerWidth / 3;
  const selectedIndex = GENDERS.indexOf(selected);

  const slideX = useSharedValue(0);

  useEffect(() => {
    slideX.value = withSpring(selectedIndex * segmentWidth, {
      damping: 15,
      stiffness: 120,
    });
  }, [selectedIndex, segmentWidth, slideX]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
    width: segmentWidth - 6,
  }));

  return (
    <View style={styles.segmentedContainer}>
      {/* Sliding Background Pill */}
      <Animated.View style={[styles.activeSegmentPill, slideStyle]}>
        <LinearGradient
          colors={gradients.ctaButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius.pill }]}
        />
      </Animated.View>

      {/* Segment Buttons */}
      {GENDERS.map((gender, index) => {
        const isSelected = selected === gender;
        return (
          <TouchableOpacity
            key={gender}
            activeOpacity={0.7}
            onPress={() => onSelect(gender)}
            style={styles.segmentButton}
          >
            <Text
              style={[
                styles.segmentText,
                { color: isSelected ? colors.textOnGradient : colors.textSecondary },
              ]}
            >
              {gender.charAt(0).toUpperCase() + gender.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Custom Sliding Ruler Picker for Age, Height, Weight ──────────────────────

interface RulerPickerProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
  unit: string;
}

const TICK_GAP = 10;
function RulerPicker({ min, max, step, value, onChange, unit }: RulerPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const totalTicks = (max - min) / step;
  const paddingWidth = (SCREEN_WIDTH - 72) / 2; // Card width padding offset
  const initialOffset = ((value - min) / step) * TICK_GAP;
  const isInitialized = useRef(false);

  // Set initial scroll offset
  useEffect(() => {
    if (!isInitialized.current && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: initialOffset, animated: false });
        isInitialized.current = true;
      }, 100);
    }
  }, [initialOffset]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const tickIndex = Math.round(offsetX / TICK_GAP);
    const calculatedVal = Math.min(
      max,
      Math.max(min, min + tickIndex * step)
    );
    if (calculatedVal !== value) {
      onChange(calculatedVal);
    }
  };

  const ticks = [];
  for (let i = 0; i <= totalTicks; i++) {
    const tickVal = min + i * step;
    const isMajor = i % 10 === 0;
    ticks.push(
      <View key={i} style={styles.tickContainer}>
        <View
          style={[
            styles.tickMark,
            {
              height: isMajor ? 24 : 14,
              backgroundColor: isMajor ? colors.accentPurple : colors.textMuted,
              width: isMajor ? 2 : 1,
            },
          ]}
        />
        {isMajor && (
          <Text style={styles.tickLabel}>{tickVal}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.rulerOuter}>
      <View style={styles.rulerHeader}>
        <Text style={styles.rulerValueText}>{value}</Text>
        <Text style={styles.rulerUnitText}>{unit}</Text>
      </View>

      <View style={styles.rulerContainer}>
        {/* Center Target Indicator */}
        <View style={styles.centerIndicator} />

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_GAP}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleScroll}
          contentContainerStyle={{
            paddingHorizontal: paddingWidth,
            alignItems: 'flex-start',
            height: 70,
          }}
        >
          <View style={styles.ticksRow}>
            {ticks}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Main Onboarding Screen ───────────────────────────────────────────────────

export default function UserOnboardingScreen() {
  const { profile, updateProfile } = useProfileStore();

  const [page, setPage] = useState(1);
  const [name, setName] = useState(profile?.name && profile.name !== 'Guest User' ? profile.name : '');
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null);
  const [gender, setGender] = useState<Gender>('male');

  const [age, setAge] = useState(24);
  const [height, setHeight] = useState(170); // cm
  const [weight, setWeight] = useState(65);   // kg

  const [bmi, setBmi] = useState(22.5);
  const [waterGoal, setWaterGoal] = useState(2200);
  const [sleepGoal, setSleepGoal] = useState(8);

  const avatarScrollRef = useRef<ScrollView>(null);
  const avatarShakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: avatarShakeX.value }],
  }));

  // Pre-populate profile name when loaded
  useEffect(() => {
    if (profile?.name && profile.name !== 'Guest User' && !name) {
      setName(profile.name);
    }
  }, [profile, name]);

  // Recalculate BMI, Water Goal, and Sleep Goal when physical parameters change
  useEffect(() => {
    const heightM = height / 100;
    const calculatedBmi = Number((weight / (heightM * heightM)).toFixed(1));
    setBmi(calculatedBmi);

    // Water goal: Weight * 35 ml, rounded to nearest 100, clamped 1500 - 4000ml
    const calculatedWater = Math.max(
      1500,
      Math.min(4000, Math.round((weight * 35) / 100) * 100)
    );
    setWaterGoal(calculatedWater);

    // Sleep goal based on BMI category
    let calculatedSleep = 8.0;
    if (calculatedBmi < 18.5) {
      calculatedSleep = 8.5; // Underweight requires extra recovery sleep
    } else if (calculatedBmi >= 30) {
      calculatedSleep = 7.5; // Obese, slightly less for metabolic balancing
    } else {
      calculatedSleep = 8.0; // Normal weight / Overweight standard rest
    }
    setSleepGoal(calculatedSleep);
  }, [height, weight]);

  const handleAvatarSelect = (index: number) => {
    setSelectedAvatarIndex(index);
    avatarScrollRef.current?.scrollTo({ x: index * 100, animated: true });
  };

  const handleNext = () => {
    if (page === 1) {
      if (selectedAvatarIndex === null) {
        avatarShakeX.value = withSequence(
          withTiming(-10, { duration: 60 }),
          withTiming(10, { duration: 60 }),
          withTiming(-10, { duration: 60 }),
          withTiming(10, { duration: 60 }),
          withTiming(0, { duration: 60 })
        );
        return;
      }
      setPage(2);
    } else if (page === 2) {
      setPage(3);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleComplete = async () => {
    const avatarUrl = selectedAvatarIndex !== null ? `avatar${selectedAvatarIndex + 1}` : 'avatar1';
    
    // Save to profile state/Supabase
    await updateProfile({
      name: name.trim() || 'Guest',
      avatar_url: avatarUrl,
      gender,
      age,
      height,
      weight,
      bmi,
      water_goal_ml: waterGoal,
      sleep_goal_hrs: sleepGoal,
      onboarding_done: true,
    });

    // Ensure state routes user to main tabs (reactive guards handle transition)
  };

  // Determine BMI category styling
  const getBmiCategory = () => {
    if (bmi < 18.5) {
      return { label: 'Underweight', color: colors.accentAmber, desc: 'Below typical range' };
    } else if (bmi < 25.0) {
      return { label: 'Healthy Weight', color: colors.accentGreen, desc: 'Optimal range' };
    } else if (bmi < 30.0) {
      return { label: 'Overweight', color: colors.accentAmber, desc: 'Above typical range' };
    } else {
      return { label: 'Obese', color: colors.error, desc: 'Significantly above range' };
    }
  };

  const bmiCat = getBmiCategory();

  // BMI indicator offset percentage (clamped 10 to 90 for UI display bounds)
  const getBmiPercentage = () => {
    const minVal = 15;
    const maxVal = 35;
    const pct = ((bmi - minVal) / (maxVal - minVal)) * 100;
    return Math.max(10, Math.min(90, pct));
  };

  return (
    <LinearGradient
      colors={gradients.authBg}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <FloatingOrbs variant="warm" count={2} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header row */}
          <View style={styles.header}>
            {page > 1 ? (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}

            <View style={styles.progressTracker}>
              <Text style={styles.stepText}>Step {page} of 3</Text>
              <View style={styles.progressBarBg}>
                <LinearGradient
                  colors={gradients.progressBar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${(page / 3) * 100}%` }]}
                />
              </View>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {/* Elevated Onboarding Card */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              
              {/* PAGE 1: Personal Details */}
              {page === 1 && (
                <View style={styles.pageContainer}>
                  <Text style={styles.title}>{"Welcome! Let's get"}</Text>
                  <Text style={styles.titleAccent}>acquainted</Text>
                  <Text style={styles.subtitle}>
                    Help us personalize your wellness profile.
                  </Text>

                  {/* Name field */}
                  <View style={styles.inputSection}>
                    <Text style={styles.sectionLabel}>YOUR NAME</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={colors.accentPurple}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.nameInput}
                        value={name}
                        onChangeText={setName}
                        placeholder="eg. Subham"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  {/* Sliding Avatar Picker */}
                  <Animated.View style={[styles.avatarSection, shakeStyle]}>
                    <Text style={styles.sectionLabel}>CHOOSE YOUR AVATAR</Text>
                    <ScrollView
                      ref={avatarScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={100}
                      decelerationRate="fast"
                      contentContainerStyle={styles.avatarScrollContent}
                    >
                      {AVATARS.map((avatar, idx) => {
                        const isSelected = selectedAvatarIndex === idx;
                        return (
                          <TouchableOpacity
                            key={idx}
                            activeOpacity={0.9}
                            onPress={() => handleAvatarSelect(idx)}
                            style={[
                              styles.avatarWrapper,
                              isSelected && styles.avatarWrapperActive,
                            ]}
                          >
                            <Image
                              source={avatar}
                              style={styles.avatarImage}
                            />
                            {isSelected && (
                              <View style={styles.avatarSelectedBadge}>
                                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </Animated.View>

                  {/* Sliding Gender Selector */}
                  <View style={styles.genderSection}>
                    <Text style={styles.sectionLabel}>BIOLOGICAL GENDER</Text>
                    <GenderSelector selected={gender} onSelect={setGender} />
                  </View>
                </View>
              )}

              {/* PAGE 2: Physical Metrics */}
              {page === 2 && (
                <View style={styles.pageContainer}>
                  <Text style={styles.title}>Your Physical</Text>
                  <Text style={styles.titleAccent}>Metrics</Text>
                  <Text style={styles.subtitle}>
                    These values determine your dynamic metabolism parameters.
                  </Text>

                  {/* Age Selection with - and + */}
                  <View style={styles.rulerRow}>
                    <Text style={styles.sectionLabel}>AGE</Text>
                    <View style={styles.goalCard}>
                      <View style={styles.goalInfo}>
                        <View style={styles.goalIconContainer}>
                          <Ionicons name="calendar-outline" size={24} color={colors.accentPurple} />
                        </View>
                        <View>
                          <Text style={styles.goalTitle}>Age (Years)</Text>
                          <Text style={styles.goalValText}>{age} yrs</Text>
                        </View>
                      </View>
                      <View style={styles.adjusterRow}>
                        <TouchableOpacity
                          style={styles.adjustButton}
                          onPress={() => setAge((a) => Math.max(12, a - 1))}
                        >
                          <Ionicons name="remove" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.adjustButton}
                          onPress={() => setAge((a) => Math.min(100, a + 1))}
                        >
                          <Ionicons name="add" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Height Ruler */}
                  <View style={styles.rulerRow}>
                    <Text style={styles.sectionLabel}>HEIGHT</Text>
                    <RulerPicker
                      min={100}
                      max={250}
                      step={1}
                      value={height}
                      onChange={setHeight}
                      unit="cm"
                    />
                  </View>

                  {/* Weight Ruler */}
                  <View style={styles.rulerRow}>
                    <Text style={styles.sectionLabel}>WEIGHT</Text>
                    <RulerPicker
                      min={30}
                      max={200}
                      step={1}
                      value={weight}
                      onChange={setWeight}
                      unit="kg"
                    />
                  </View>
                </View>
              )}

              {/* PAGE 3: BMI & Custom Goals */}
              {page === 3 && (
                <View style={styles.pageContainer}>
                  <Text style={styles.title}>Your Calculated</Text>
                  <Text style={styles.titleAccent}>Wellness Goals</Text>
                  <Text style={styles.subtitle}>
                    Here is your calculated BMI and customized goals. You can adjust them below.
                  </Text>

                  {/* BMI Result Card */}
                  <View style={styles.bmiCard}>
                    <View style={styles.bmiRow}>
                      <View>
                        <Text style={styles.bmiTitle}>Body Mass Index (BMI)</Text>
                        <Text style={styles.bmiValue}>{bmi}</Text>
                      </View>
                      <View
                        style={[
                          styles.bmiBadge,
                          { backgroundColor: `${bmiCat.color}15`, borderColor: bmiCat.color },
                        ]}
                      >
                        <Text style={[styles.bmiBadgeText, { color: bmiCat.color }]}>
                          {bmiCat.label}
                        </Text>
                      </View>
                    </View>

                    {/* Colored BMI Range Spectrum */}
                    <View style={styles.bmiTrackContainer}>
                      <View style={styles.bmiTrack} />
                      <Animated.View
                        style={[
                          styles.bmiTrackPointer,
                          { left: `${getBmiPercentage()}%`, backgroundColor: bmiCat.color },
                        ]}
                      />
                    </View>
                    <View style={styles.bmiLabelsRow}>
                      <Text style={styles.bmiRangeLabel}>18.5</Text>
                      <Text style={styles.bmiRangeLabel}>25</Text>
                      <Text style={styles.bmiRangeLabel}>30</Text>
                    </View>
                  </View>

                  {/* Water Goal Customization */}
                  <View style={styles.goalCard}>
                    <View style={styles.goalInfo}>
                      <View style={styles.goalIconContainer}>
                        <Ionicons name="water" size={24} color={colors.accentPurple} />
                      </View>
                      <View>
                        <Text style={styles.goalTitle}>Daily Water Goal</Text>
                        <Text style={styles.goalValText}>{waterGoal} ml</Text>
                      </View>
                    </View>
                    <View style={styles.adjusterRow}>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => setWaterGoal((w) => Math.max(1000, w - 100))}
                      >
                        <Ionicons name="remove" size={20} color={colors.textPrimary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => setWaterGoal((w) => Math.min(5000, w + 100))}
                      >
                        <Ionicons name="add" size={20} color={colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Sleep Goal Customization */}
                  <View style={styles.goalCard}>
                    <View style={styles.goalInfo}>
                      <View style={styles.goalIconContainer}>
                        <Ionicons name="moon" size={24} color={colors.accentPink} />
                      </View>
                      <View>
                        <Text style={styles.goalTitle}>Daily Sleep Goal</Text>
                        <Text style={styles.goalValText}>{sleepGoal} hrs</Text>
                      </View>
                    </View>
                    <View style={styles.adjusterRow}>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => setSleepGoal((s) => Math.max(5, s - 0.5))}
                      >
                        <Ionicons name="remove" size={20} color={colors.textPrimary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => setSleepGoal((s) => Math.min(12, s + 0.5))}
                      >
                        <Ionicons name="add" size={20} color={colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionSection}>
                <PressableScale
                  onPress={handleNext}
                  scaleDown={0.96}
                  style={{ width: '100%' }}
                >
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaButton}
                  >
                    <Text style={styles.ctaText}>
                      {page === 3 ? 'Start Wellness Journey' : 'Continue'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </PressableScale>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTracker: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  progressBarBg: {
    width: 120,
    height: 6,
    backgroundColor: colors.bgChip,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: 24,
    marginHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#9499A7',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  pageContainer: {
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    lineHeight: 32,
  },
  titleAccent: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: colors.accentPurple,
    lineHeight: 32,
    marginTop: -4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: colors.textSecondary,
    letterSpacing: 1,
  },

  // Page 1 Elements
  inputSection: {
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    backgroundColor: colors.bgInput,
  },
  inputIcon: {
    marginRight: 10,
  },
  nameInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: colors.textPrimary,
  },
  avatarSection: {
    gap: 10,
  },
  avatarScrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 20,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: 'transparent',
    backgroundColor: colors.bgChip,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarWrapperActive: {
    borderColor: colors.accentPurple,
    transform: [{ scale: 1.08 }],
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarSelectedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  genderSection: {
    gap: 8,
  },

  // Sliding Segment Styles
  segmentedContainer: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: colors.bgChip,
    borderRadius: radius.pill,
    padding: 3,
    position: 'relative',
    alignItems: 'center',
  },
  activeSegmentPill: {
    height: 42,
    borderRadius: radius.pill,
    position: 'absolute',
    left: 3,
    ...Platform.select({
      ios: {
        shadowColor: colors.accentPurple,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },

  // Page 2 Slider Ruler Styles
  rulerRow: {
    gap: 6,
  },
  rulerOuter: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: 12,
    alignItems: 'center',
  },
  rulerHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  rulerValueText: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: colors.accentPurple,
  },
  rulerUnitText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  rulerContainer: {
    height: 70,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  centerIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 24,
    left: '50%',
    width: 3,
    backgroundColor: colors.accentPink,
    zIndex: 10,
    borderRadius: 2,
  },
  ticksRow: {
    flexDirection: 'row',
    height: 50,
  },
  tickContainer: {
    width: TICK_GAP,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  tickMark: {
    borderRadius: 1,
  },
  tickLabel: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono-Regular',
    color: colors.textSecondary,
    position: 'absolute',
    top: 28,
  },

  // Page 3 Elements
  bmiCard: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: 16,
    gap: 12,
  },
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bmiTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  bmiValue: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
  },
  bmiBadge: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  bmiBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  bmiTrackContainer: {
    height: 16,
    position: 'relative',
    justifyContent: 'center',
  },
  bmiTrack: {
    height: 6,
    backgroundColor: colors.bgChip,
    borderRadius: radius.full,
    width: '100%',
  },
  bmiTrackPointer: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginTop: -7,
    top: '50%',
    marginLeft: -7,
  },
  bmiLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  bmiRangeLabel: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono-Regular',
    color: colors.textMuted,
  },

  goalCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  goalValText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
  },
  adjusterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adjustButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },

  actionSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: colors.accentPurple,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: colors.textOnGradient,
  },
});
