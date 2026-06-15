import React from 'react';
import { useRoute } from '@react-navigation/native';
import Animated, { FadeInDown, Easing, EntryAnimationsValues, BaseAnimationBuilder } from 'react-native-reanimated';

interface ScreenTransitionProps {
  children: React.ReactNode;
  entering?: any;
  delay?: number;
}

export function ScreenTransition({ children, entering, delay = 0 }: ScreenTransitionProps) {
  const route = useRoute();
  
  const enteringAnim = entering || FadeInDown.duration(350).easing(Easing.out(Easing.cubic)).delay(delay);

  return (
    <Animated.View key={route.key} style={{ flex: 1 }} entering={enteringAnim}>
      {children}
    </Animated.View>
  );
}
