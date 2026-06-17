// components/CalorieGoalCard.tsx
// Aurora — Calorie goal & macronutrient metrics card for the Dashboard

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useProfileStore } from '@/stores/profileStore';
import { useNutritionStore } from '@/stores/nutritionStore';
import { calculateCalorieGoal } from '@/utils/healthUtils';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/radius';
import { gradients } from '@/constants/gradients';
import { PressableScale } from '@/components/animated/PressableScale';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { router } from 'expo-router';

interface CalorieGoalCardProps {
  todaySteps: number;
}

const RING_SIZE = 96;
const STROKE_WIDTH = 8;
const R = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export const CalorieGoalCard = React.memo(({ todaySteps }: CalorieGoalCardProps) => {
  const { profile } = useProfileStore();
  const { meals, checkDateAndReset } = useNutritionStore();

  useEffect(() => {
    checkDateAndReset();
  }, []);

  // Calculate Calorie Goal from BMI / profile parameters
  const calorieGoal = calculateCalorieGoal(
    profile?.weight,
    profile?.height,
    profile?.gender,
    profile?.age || 25
  );

  // Compute values
  const eatenCalories =
    (meals.breakfast.isLogged ? meals.breakfast.calories : 0) +
    (meals.lunch.isLogged ? meals.lunch.calories : 0) +
    (meals.snack.isLogged ? meals.snack.calories : 0) +
    (meals.dinner.isLogged ? meals.dinner.calories : 0);

  const burnedCalories = 100 + Math.round(todaySteps * 0.04);
  const kcalLeft = Math.max(0, calorieGoal - eatenCalories + burnedCalories);

  // Macros target (50% carbs, 20% protein, 30% fat of daily calorie goal)
  const targetCarbs = Math.round((calorieGoal * 0.5) / 4);
  const targetProtein = Math.round((calorieGoal * 0.2) / 4);
  const targetFat = Math.round((calorieGoal * 0.3) / 9);

  // Eaten Macros
  const eatenCarbs =
    (meals.breakfast.isLogged ? meals.breakfast.carbs : 0) +
    (meals.lunch.isLogged ? meals.lunch.carbs : 0) +
    (meals.snack.isLogged ? meals.snack.carbs : 0) +
    (meals.dinner.isLogged ? meals.dinner.carbs : 0);

  const eatenProtein =
    (meals.breakfast.isLogged ? meals.breakfast.protein : 0) +
    (meals.lunch.isLogged ? meals.lunch.protein : 0) +
    (meals.snack.isLogged ? meals.snack.protein : 0) +
    (meals.dinner.isLogged ? meals.dinner.protein : 0);

  const eatenFat =
    (meals.breakfast.isLogged ? meals.breakfast.fat : 0) +
    (meals.lunch.isLogged ? meals.lunch.fat : 0) +
    (meals.snack.isLogged ? meals.snack.fat : 0) +
    (meals.dinner.isLogged ? meals.dinner.fat : 0);

  // Macros Left
  const carbsLeft = Math.max(0, targetCarbs - eatenCarbs);
  const proteinLeft = Math.max(0, targetProtein - eatenProtein);
  const fatLeft = Math.max(0, targetFat - eatenFat);

  // Progress ring percentage
  const totalPool = calorieGoal + burnedCalories;
  const progressRatio = totalPool > 0 ? eatenCalories / totalPool : 0;
  const percentage = Math.min(100, Math.max(0, progressRatio * 100));
  const strokeDash = (percentage / 100) * CIRCUMFERENCE;

  return (
    <View style={styles.container}>
      {/* Theme Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mediterranean diet</Text>
        <PressableScale onPress={() => router.push('/(tabs)/profile')} style={styles.detailsBtn}>
          <Text style={styles.detailsBtnText}>Details</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.accentPurple} />
        </PressableScale>
      </View>

      {/* Main Card */}
      <View style={styles.card}>
        <View style={styles.mainContent}>
          {/* Left Metrics Column */}
          <View style={styles.metricsColumn}>
            {/* Eaten */}
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Eaten</Text>
              <View style={styles.metricRow}>
                <View style={[styles.iconWrap, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="restaurant" size={16} color="#3B82F6" />
                </View>
                <Text style={styles.metricValue}>
                  <Text style={styles.boldNum}>{eatenCalories}</Text> Kcal
                </Text>
              </View>
            </View>

            {/* Burned */}
            <View style={[styles.metricItem, { marginTop: 14 }]}>
              <Text style={styles.metricLabel}>Burned</Text>
              <View style={styles.metricRow}>
                <View style={[styles.iconWrap, { backgroundColor: '#EC489920' }]}>
                  <Ionicons name="flame" size={16} color="#EC4899" />
                </View>
                <Text style={styles.metricValue}>
                  <Text style={styles.boldNum}>{burnedCalories}</Text> Kcal
                </Text>
              </View>
            </View>
          </View>

          {/* Right Progress Ring */}
          <View style={styles.ringWrapper}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Defs>
                <SvgLinearGradient id="calorieRingGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={gradients.primary[0]} />
                  <Stop offset="0.5" stopColor={gradients.primary[1]} />
                  <Stop offset="1" stopColor={gradients.primary[2]} />
                </SvgLinearGradient>
              </Defs>
              {/* Background ring */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={R}
                stroke="#F0EEF8"
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              {/* Active arc */}
              {percentage > 0 && (
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={R}
                  stroke="url(#calorieRingGrad)"
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              )}
            </Svg>
            <View style={styles.ringTextContainer}>
              <Text style={styles.ringNumber}>{kcalLeft}</Text>
              <Text style={styles.ringLabel}>Kcal left</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom Macronutrients Row */}
        <View style={styles.macrosRow}>
          {/* Carbs */}
          <View style={styles.macroColumn}>
            <Text style={styles.macroTitle}>Carbs</Text>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: '#3B82F6', 
                    width: `${Math.min(100, targetCarbs > 0 ? (eatenCarbs / targetCarbs) * 100 : 0)}%` 
                  }
                ]} 
              />
            </View>
            <Text style={styles.macroSub}>{carbsLeft}g left</Text>
          </View>

          {/* Protein */}
          <View style={styles.macroColumn}>
            <Text style={styles.macroTitle}>Protein</Text>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: '#EC4899', 
                    width: `${Math.min(100, targetProtein > 0 ? (eatenProtein / targetProtein) * 100 : 0)}%` 
                  }
                ]} 
              />
            </View>
            <Text style={styles.macroSub}>{proteinLeft}g left</Text>
          </View>

          {/* Fat */}
          <View style={styles.macroColumn}>
            <Text style={styles.macroTitle}>Fat</Text>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    backgroundColor: '#F59E0B', 
                    width: `${Math.min(100, targetFat > 0 ? (eatenFat / targetFat) * 100 : 0)}%` 
                  }
                ]} 
              />
            </View>
            <Text style={styles.macroSub}>{fatLeft}g left</Text>
          </View>
        </View>
      </View>
    </View>
  );
});

CalorieGoalCard.displayName = 'CalorieGoalCard';

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsBtnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.accentPurple,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 18,
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
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsColumn: {
    flex: 1,
    paddingRight: 10,
  },
  metricItem: {
    flexDirection: 'column',
  },
  metricLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  metricValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  boldNum: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  ringWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: RING_SIZE,
    height: RING_SIZE,
  },
  ringTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringNumber: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  ringLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderHairline,
    marginVertical: 16,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroColumn: {
    flex: 1,
    alignItems: 'flex-start',
    marginHorizontal: 4,
  },
  macroTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#F0EEF8',
    borderRadius: radius.full,
    width: '90%',
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  macroSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.textSecondary,
  },
});
export default CalorieGoalCard;
