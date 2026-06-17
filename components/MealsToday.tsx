// components/MealsToday.tsx
// Aurora — Horizontal Meals Today section with food mascot cutouts & logging flow

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useNutritionStore, DEFAULT_MEALS } from '@/stores/nutritionStore';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/radius';
import { gradients } from '@/constants/gradients';
import { PressableScale } from '@/components/animated/PressableScale';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Ellipse } from 'react-native-svg';

// ── SVG Food Mascots ─────────────────────────────────────────────────────────

const BreakfastMascot = () => (
  <Svg width={64} height={64} viewBox="0 0 64 64">
    {/* Toast background */}
    <Path
      d="M12 24 C12 18, 20 16, 32 16 C44 16, 52 18, 52 24 C52 38, 48 48, 32 48 C16 48, 12 38, 12 24 Z"
      fill="#C68A4C"
    />
    <Path
      d="M15 25 C15 20, 22 18, 32 18 C42 18, 49 20, 49 25 C49 37, 45 45, 32 45 C19 45, 15 37, 15 25 Z"
      fill="#E5A65E"
    />
    {/* Egg white */}
    <Path
      d="M24 28 C20 30, 21 37, 28 39 C34 41, 42 38, 40 32 C38 26, 30 26, 24 28 Z"
      fill="#FFFFFF"
    />
    {/* Egg yolk */}
    <Circle cx={32} cy={33} r={7} fill="#FFB703" />
    <Circle cx={30} cy={31} r={2} fill="#FFFFFF" opacity={0.6} />
  </Svg>
);

const LunchMascot = () => (
  <Svg width={64} height={64} viewBox="0 0 64 64">
    {/* Salad bowl */}
    <Path
      d="M12 32 C12 44, 20 48, 32 48 C44 48, 52 44, 52 32 L12 32 Z"
      fill="#3B82F6"
    />
    {/* Greens popping out */}
    <Circle cx={22} cy={28} r={8} fill="#22C55E" />
    <Circle cx={32} cy={26} r={9} fill="#16A34A" />
    <Circle cx={42} cy={29} r={8} fill="#22C55E" />
    <Circle cx={28} cy={30} r={6} fill="#15803D" />
    {/* Carrot slices */}
    <Circle cx={26} cy={27} r={3} fill="#F97316" />
    <Circle cx={38} cy={26} r={3.5} fill="#F97316" />
    {/* Tomato slices */}
    <Circle cx={33} cy={30} r={4} fill="#EF4444" />
    <Circle cx={32.5} cy={29.5} r={1.5} fill="#FFF" opacity={0.7} />
  </Svg>
);

const SnackMascot = () => (
  <Svg width={64} height={64} viewBox="0 0 64 64">
    {/* Watermelon rind */}
    <Path
      d="M12 20 C18 42, 46 42, 52 20 C46 36, 18 36, 12 20 Z"
      fill="#15803D"
    />
    <Path
      d="M15 20 C20 36, 44 36, 49 20 C44 32, 20 32, 15 20 Z"
      fill="#4ADE80"
    />
    {/* Watermelon flesh */}
    <Path
      d="M18 20 C22 32, 42 32, 46 20 Z"
      fill="#EF4444"
    />
    {/* Seeds */}
    <Circle cx={26} cy={23} r={1.5} fill="#000000" />
    <Circle cx={32} cy={25} r={1.5} fill="#000000" />
    <Circle cx={38} cy={23} r={1.5} fill="#000000" />
  </Svg>
);

const DinnerMascot = () => (
  <Svg width={64} height={64} viewBox="0 0 64 64">
    {/* Plate */}
    <Ellipse cx={32} cy={36} rx={22} ry={10} fill="#E5E7EB" />
    <Ellipse cx={32} cy={35} rx={18} ry={8} fill="#F3F4F6" />
    {/* Sushi Roll 1 */}
    <Rect x={18} y={24} width={12} height={14} rx={2} fill="#1F2937" />
    <Ellipse cx={24} cy={25} rx={5} ry={2.5} fill="#FFFFFF" />
    <Circle cx={24} cy={25} r={2} fill="#EF4444" />
    {/* Sushi Roll 2 */}
    <Rect x={34} y={24} width={12} height={14} rx={2} fill="#1F2937" />
    <Ellipse cx={40} cy={25} rx={5} ry={2.5} fill="#FFFFFF" />
    <Circle cx={40} cy={25} r={2} fill="#EF4444" />
  </Svg>
);

// ── Components ───────────────────────────────────────────────────────────────

interface MealCardProps {
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  title: string;
  gradient: readonly string[];
  mascot: React.ReactNode;
  onPress: () => void;
}

const MealCard = ({ type, title, gradient, mascot, onPress }: MealCardProps) => {
  const { meals } = useNutritionStore();
  const meal = meals[type];

  return (
    <PressableScale style={styles.cardWrapper} onPress={onPress} scaleDown={0.96}>
      <LinearGradient
        colors={gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Mascot Overlapping Container */}
        <View style={styles.mascotContainer}>{mascot}</View>

        {/* Text Details */}
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {meal.isLogged ? meal.food : `Recommend:\n${meal.calories} kcal`}
          </Text>
        </View>

        {/* Bottom indicator */}
        <View style={styles.cardBottom}>
          {meal.isLogged ? (
            <Text style={styles.cardCalories}>{meal.calories} kcal</Text>
          ) : (
            <View style={styles.plusButton}>
              <Ionicons name="add" size={18} color={gradient[0]} />
            </View>
          )}
        </View>
      </LinearGradient>
    </PressableScale>
  );
};

export const MealsToday = () => {
  const { meals, logMeal, removeMeal } = useNutritionStore();
  const [selectedType, setSelectedType] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner' | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Custom logging form fields
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');

  const openLoggingModal = (type: 'breakfast' | 'lunch' | 'snack' | 'dinner') => {
    setSelectedType(type);
    const meal = meals[type];
    if (meal.isLogged) {
      // Show deletion/reset alert directly or modal
      Alert.alert(
        'Meal Logged',
        `You logged "${meal.food}" (${meal.calories} kcal). Do you want to remove this meal?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeMeal(type),
          },
        ]
      );
    } else {
      // Set default preset suggestions in the text input fields
      const preset = DEFAULT_MEALS[type];
      setFoodName(preset.food);
      setCalories(preset.calories.toString());
      setCarbs(preset.carbs.toString());
      setProtein(preset.protein.toString());
      setFat(preset.fat.toString());
      setModalVisible(true);
    }
  };

  const handleQuickAdd = () => {
    if (!selectedType) return;
    const preset = DEFAULT_MEALS[selectedType];
    logMeal(selectedType, preset.food, preset.calories, preset.carbs, preset.protein, preset.fat);
    setModalVisible(false);
  };

  const handleCustomAdd = () => {
    if (!selectedType) return;
    if (!foodName.trim()) {
      Alert.alert('Validation Error', 'Please enter a food description.');
      return;
    }
    const calVal = parseInt(calories, 10);
    if (isNaN(calVal) || calVal < 0) {
      Alert.alert('Validation Error', 'Please enter valid calories.');
      return;
    }

    logMeal(
      selectedType,
      foodName.trim(),
      calVal,
      parseInt(carbs, 10) || 0,
      parseInt(protein, 10) || 0,
      parseInt(fat, 10) || 0
    );
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meals today</Text>
        <TouchableOpacity style={styles.customizeBtn} onPress={() => Alert.alert('Customize', 'Customize meals feature coming soon!')}>
          <Text style={styles.customizeBtnText}>Customize</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.accentPurple} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <MealCard
          type="breakfast"
          title="Breakfast"
          gradient={['#FF9A9E', '#FECFEF']} // Peach
          mascot={<BreakfastMascot />}
          onPress={() => openLoggingModal('breakfast')}
        />
        <MealCard
          type="lunch"
          title="Lunch"
          gradient={['#4F46E5', '#06B6D4']} // Deep blue / Teal
          mascot={<LunchMascot />}
          onPress={() => openLoggingModal('lunch')}
        />
        <MealCard
          type="snack"
          title="Snack"
          gradient={['#EC4899', '#F43F5E']} // Pink / Rose
          mascot={<SnackMascot />}
          onPress={() => openLoggingModal('snack')}
        />
        <MealCard
          type="dinner"
          title="Dinner"
          gradient={['#7C3AED', '#A855F7']} // Purple / Violet
          mascot={<DinnerMascot />}
          onPress={() => openLoggingModal('dinner')}
        />
      </ScrollView>

      {/* Logging Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalScrim}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Log {selectedType ? selectedType.charAt(0).toUpperCase() + selectedType.slice(1) : ''}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Quick Add Section */}
              <View style={styles.quickAddBox}>
                <Text style={styles.sectionHeading}>RECOMMENDED PRESET</Text>
                {selectedType && (
                  <View style={styles.presetRow}>
                    <View style={styles.presetInfo}>
                      <Text style={styles.presetFood}>{DEFAULT_MEALS[selectedType].food}</Text>
                      <Text style={styles.presetMacros}>
                        {DEFAULT_MEALS[selectedType].calories} kcal · C: {DEFAULT_MEALS[selectedType].carbs}g · P:{' '}
                        {DEFAULT_MEALS[selectedType].protein}g · F: {DEFAULT_MEALS[selectedType].fat}g
                      </Text>
                    </View>
                    <TouchableOpacity onPress={handleQuickAdd} activeOpacity={0.85}>
                      <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.quickAddBtn}
                      >
                        <Text style={styles.quickAddBtnText}>Quick Add</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Or manual divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR LOG CUSTOM MEAL</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Inputs */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Food Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={foodName}
                  onChangeText={setFoodName}
                  placeholder="e.g. Scrambled eggs with toast"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Calories (kcal)</Text>
                <TextInput
                  style={styles.textInput}
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="numeric"
                  placeholder="e.g. 350"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Macro row */}
              <View style={styles.macroInputsRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Carbs (g)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={carbs}
                    onChangeText={setCarbs}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 8 }]}>
                  <Text style={styles.inputLabel}>Protein (g)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Fat (g)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={fat}
                    onChangeText={setFat}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity onPress={handleCustomAdd} activeOpacity={0.85} style={{ marginTop: 8 }}>
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtn}
                >
                  <Text style={styles.submitBtnText}>Log Custom Meal</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 0,
  },
  headerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  customizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customizeBtnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.accentPurple,
  },
  scrollContent: {
    paddingLeft: 0,
    paddingRight: 0,
    gap: 14,
    paddingBottom: 8,
  },
  cardWrapper: {
    width: 142,
    height: 185,
  },
  cardGradient: {
    flex: 1,
    borderRadius: radius.lg,
    borderTopRightRadius: 64, // leaf shape
    padding: 14,
    justifyContent: 'space-between',
    position: 'relative',
  },
  mascotContainer: {
    position: 'absolute',
    top: -16,
    right: 0,
    zIndex: 5,
  },
  cardTextContainer: {
    marginTop: 22,
  },
  cardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 14,
  },
  cardBottom: {
    alignItems: 'flex-start',
  },
  cardCalories: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Modal styles
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  quickAddBox: {
    backgroundColor: '#F7F5FF',
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 20,
  },
  sectionHeading: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  presetInfo: {
    flex: 1,
    paddingRight: 8,
  },
  presetFood: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  presetMacros: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textSecondary,
  },
  quickAddBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  quickAddBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textOnGradient,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderHairline,
  },
  dividerText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: colors.textMuted,
    marginHorizontal: 10,
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textPrimary,
  },
  macroInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  submitBtn: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: colors.textOnGradient,
  },
});
export default MealsToday;
