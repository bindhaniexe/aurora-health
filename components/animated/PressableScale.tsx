import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface PressableScaleProps {
  onPress?: () => void;
  onLongPress?: () => void;
  scaleDown?: number;
  duration?: number;
  haptic?: 'light' | 'medium' | 'none';
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function PressableScale({
  onPress,
  onLongPress,
  scaleDown = 0.96,
  duration = 120,
  haptic = 'light',
  style,
  children,
  disabled = false,
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const triggerHaptic = (type: 'light' | 'medium') => {
    Haptics.impactAsync(
      type === 'light'
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    );
  };

  const handlePress = () => {
    if (onPress) onPress();
  };

  const handleLongPress = () => {
    if (onLongPress) onLongPress();
  };

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .maxDuration(250)
    .onBegin(() => {
      scale.value = withTiming(scaleDown, { duration });
    })
    .onFinalize((event, success) => {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      if (success) {
        if (haptic !== 'none') runOnJS(triggerHaptic)(haptic);
        runOnJS(handlePress)();
      }
    });

  const longPressGesture = Gesture.LongPress()
    .enabled(!disabled && !!onLongPress)
    .minDuration(500)
    .onBegin(() => {
      scale.value = withTiming(scaleDown, { duration });
    })
    .onStart(() => {
      if (haptic !== 'none') runOnJS(triggerHaptic)('medium');
      runOnJS(handleLongPress)();
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    });

  const gesture = onLongPress
    ? Gesture.Exclusive(longPressGesture, tapGesture)
    : tapGesture;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, animStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
