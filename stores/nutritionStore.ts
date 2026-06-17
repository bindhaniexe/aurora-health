import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayISO } from '@/utils/dateUtils';

export interface MealLog {
  isLogged: boolean;
  food: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export interface NutritionState {
  date: string; // YYYY-MM-DD
  meals: {
    breakfast: MealLog;
    lunch: MealLog;
    snack: MealLog;
    dinner: MealLog;
  };
  logMeal: (
    type: 'breakfast' | 'lunch' | 'snack' | 'dinner',
    food: string,
    calories: number,
    carbs: number,
    protein: number,
    fat: number
  ) => void;
  removeMeal: (type: 'breakfast' | 'lunch' | 'snack' | 'dinner') => void;
  resetMeals: () => void;
  checkDateAndReset: () => void;
}

export const DEFAULT_MEALS = {
  breakfast: {
    isLogged: false,
    food: 'Bread, Peanut butter',
    calories: 525,
    carbs: 50,
    protein: 15,
    fat: 25,
  },
  lunch: {
    isLogged: false,
    food: 'Salmon, Mixed veggies',
    calories: 602,
    carbs: 40,
    protein: 45,
    fat: 22,
  },
  snack: {
    isLogged: false,
    food: 'Watermelon slice',
    calories: 800, // Matching the visual image recommendation: 800 kcal
    carbs: 80,
    protein: 5,
    fat: 2,
  },
  dinner: {
    isLogged: false,
    food: 'Chicken salad & quinoa',
    calories: 700, // Matching the visual image recommendation: 700 kcal
    carbs: 60,
    protein: 55,
    fat: 12,
  },
};

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      date: todayISO(),
      meals: { ...DEFAULT_MEALS },

      logMeal: (type, food, calories, carbs, protein, fat) => {
        get().checkDateAndReset();
        set((state) => ({
          meals: {
            ...state.meals,
            [type]: {
              isLogged: true,
              food,
              calories,
              carbs,
              protein,
              fat,
            },
          },
        }));
      },

      removeMeal: (type) => {
        get().checkDateAndReset();
        // Reset back to recommended template default, but unlogged
        set((state) => ({
          meals: {
            ...state.meals,
            [type]: {
              ...DEFAULT_MEALS[type],
              isLogged: false,
            },
          },
        }));
      },

      resetMeals: () => {
        set({
          date: todayISO(),
          meals: {
            breakfast: { ...DEFAULT_MEALS.breakfast, isLogged: false },
            lunch: { ...DEFAULT_MEALS.lunch, isLogged: false },
            snack: { ...DEFAULT_MEALS.snack, isLogged: false },
            dinner: { ...DEFAULT_MEALS.dinner, isLogged: false },
          },
        });
      },

      checkDateAndReset: () => {
        const today = todayISO();
        if (get().date !== today) {
          set({
            date: today,
            meals: {
              breakfast: { ...DEFAULT_MEALS.breakfast, isLogged: false },
              lunch: { ...DEFAULT_MEALS.lunch, isLogged: false },
              snack: { ...DEFAULT_MEALS.snack, isLogged: false },
              dinner: { ...DEFAULT_MEALS.dinner, isLogged: false },
            },
          });
        }
      },
    }),
    {
      name: 'aurora-nutrition-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
