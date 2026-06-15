// components/HabitItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';

interface HabitItemProps {
  id: string;
  name: string;
  isCompletedToday: boolean;
  streak: number;
  onComplete: (id: string) => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function HabitItem({ id, name, isCompletedToday, streak, onComplete }: HabitItemProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (isCompletedToday) return; // Prevent double trigger
    scale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    onComplete(id);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedTouchableOpacity 
      activeOpacity={0.8} 
      onPress={handlePress} 
      style={[styles.container, animatedStyle]}
    >
      <View style={styles.leftContent}>
        <Text style={[styles.name, isCompletedToday && styles.nameCompleted]}>
          {name}
        </Text>
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={12} color={colors.accentGreen} />
            <Text style={styles.streakText}>{streak} Day Streak</Text>
          </View>
        )}
      </View>

      <View style={styles.rightContent}>
        {isCompletedToday ? (
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.completedCircle}
          >
            <Ionicons name="checkmark" size={18} color={colors.textOnGradient} />
          </LinearGradient>
        ) : (
          <View style={styles.emptyCircle} />
        )}
      </View>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
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
  leftContent: {
    flex: 1,
  },
  name: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  nameCompleted: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgAuth,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  streakText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.accentGreen,
  },
  rightContent: {
    marginLeft: 16,
  },
  completedCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.borderHairline,
  },
});
