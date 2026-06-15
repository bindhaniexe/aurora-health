import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { gradients } from '@/constants/gradients';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/radius';
import { CompanionState } from '@/stores/companionStore';

interface MicButtonProps {
  state: CompanionState;
  onPress: () => void;
}

export function MicButton({ state, onPress }: MicButtonProps) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);
  const spinRotation = useSharedValue(0);

  useEffect(() => {
    if (state === 'listening') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(0);
    }

    if (state === 'processing') {
      spinRotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      spinRotation.value = 0;
    }
  }, [state]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRotation.value}deg` }],
  }));

  const getGradientColors = () => {
    switch (state) {
      case 'error': return ['#EF4444', '#B91C1C'] as const;
      case 'listening': return gradients.primary;
      case 'processing': return gradients.primary;
      case 'speaking': return gradients.ctaButton;
      default: return gradients.ctaButton;
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'error': return 'alert-circle';
      case 'processing': return 'loader';
      case 'speaking': return 'volume-2';
      case 'listening': return 'mic';
      default: return 'mic';
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.pulseRing, pulseStyle, { backgroundColor: colors.gradientMid }]} />
      
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.buttonWrapper}>
        <Animated.View style={state === 'processing' ? spinStyle : undefined}>
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCircle}
          >
            <Feather name={getIcon()} size={28} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  buttonWrapper: {
    zIndex: 10,
    shadowColor: colors.gradientMid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: radius.full,
    zIndex: 1,
  },
});
