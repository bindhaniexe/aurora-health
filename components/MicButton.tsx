import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  withDelay,
  SharedValue,
} from 'react-native-reanimated';
import { gradients } from '@/constants/gradients';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/radius';
import { CompanionState } from '@/stores/companionStore';
import { PressableScale } from './animated/PressableScale';

interface MicButtonProps {
  state: CompanionState;
  onPress: () => void;
}

const BUTTON_SIZE = 64;

export function MicButton({ state, onPress }: MicButtonProps) {
  const spinRotation = useSharedValue(0);

  // 3 Rings for listening state
  const ring1Scale = useSharedValue(1);
  const ring1Opac = useSharedValue(0);
  const ring2Scale = useSharedValue(1);
  const ring2Opac = useSharedValue(0);
  const ring3Scale = useSharedValue(1);
  const ring3Opac = useSharedValue(0);

  // 5 Bars for speaking state
  const bar1H = useSharedValue(4);
  const bar2H = useSharedValue(4);
  const bar3H = useSharedValue(4);
  const bar4H = useSharedValue(4);
  const bar5H = useSharedValue(4);

  useEffect(() => {
    // Processing spin
    if (state === 'processing') {
      spinRotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      spinRotation.value = 0;
    }

    // Listening rings
    if (state === 'listening') {
      const ringAnim = (scale: SharedValue<number>, opac: SharedValue<number>, delay: number) => {
        scale.value = withDelay(
          delay,
          withRepeat(
            withTiming(1.3, { duration: 1200, easing: Easing.out(Easing.ease) }),
            -1,
            false
          )
        );
        opac.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(1, { duration: 0 }),
              withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) })
            ),
            -1,
            false
          )
        );
      };
      
      ringAnim(ring1Scale, ring1Opac, 0);
      ringAnim(ring2Scale, ring2Opac, 400);
      ringAnim(ring3Scale, ring3Opac, 800);
    } else {
      ring1Scale.value = 1; ring1Opac.value = 0;
      ring2Scale.value = 1; ring2Opac.value = 0;
      ring3Scale.value = 1; ring3Opac.value = 0;
    }

    // Speaking waveform
    if (state === 'speaking') {
      const animateBar = (bar: SharedValue<number>, delay: number, duration: number) => {
        bar.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(28, { duration, easing: Easing.inOut(Easing.ease) }),
              withTiming(4, { duration, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
          )
        );
      };
      
      animateBar(bar1H, 0, 400);
      animateBar(bar2H, 100, 300);
      animateBar(bar3H, 200, 500);
      animateBar(bar4H, 150, 350);
      animateBar(bar5H, 50, 450);
    } else {
      bar1H.value = withTiming(4);
      bar2H.value = withTiming(4);
      bar3H.value = withTiming(4);
      bar4H.value = withTiming(4);
      bar5H.value = withTiming(4);
    }
  }, [state]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRotation.value}deg` }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opac.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opac.value,
  }));

  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: ring3Opac.value,
  }));

  const bar1Style = useAnimatedStyle(() => ({
    height: bar1H.value,
  }));

  const bar2Style = useAnimatedStyle(() => ({
    height: bar2H.value,
  }));

  const bar3Style = useAnimatedStyle(() => ({
    height: bar3H.value,
  }));

  const bar4Style = useAnimatedStyle(() => ({
    height: bar4H.value,
  }));

  const bar5Style = useAnimatedStyle(() => ({
    height: bar5H.value,
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
      case 'listening': return 'mic';
      default: return 'mic';
    }
  };

  return (
    <View style={styles.container}>
      {/* Listening Rings */}
      <Animated.View style={[styles.pulseRing, ring1Style]} />
      <Animated.View style={[styles.pulseRing, ring2Style]} />
      <Animated.View style={[styles.pulseRing, ring3Style]} />

      <PressableScale onPress={onPress} scaleDown={0.92} style={styles.buttonWrapper}>
        <Animated.View style={state === 'processing' ? spinStyle : undefined}>
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCircle}
          >
            {state === 'speaking' ? (
              <View style={styles.waveform}>
                <Animated.View style={[styles.bar, bar1Style, { backgroundColor: '#E9D5FF' }]} />
                <Animated.View style={[styles.bar, bar2Style, { backgroundColor: '#D8B4FE' }]} />
                <Animated.View style={[styles.bar, bar3Style, { backgroundColor: '#C084FC' }]} />
                <Animated.View style={[styles.bar, bar4Style, { backgroundColor: '#A855F7' }]} />
                <Animated.View style={[styles.bar, bar5Style, { backgroundColor: '#9333EA' }]} />
              </View>
            ) : (
              <Feather name={getIcon()} size={28} color="#FFFFFF" />
            )}
          </LinearGradient>
        </Animated.View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: BUTTON_SIZE * 2,
    height: BUTTON_SIZE * 2,
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
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.full,
    backgroundColor: gradients.primary[0],
    opacity: 0.3,
    zIndex: 1,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32, // container height
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
