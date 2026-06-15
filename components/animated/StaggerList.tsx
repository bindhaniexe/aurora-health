import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';

interface StaggerListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  initialDelay?: number;
  childContainerStyle?: StyleProp<ViewStyle>;
}

export function StaggerList({ children, staggerDelay = 80, initialDelay = 100, childContainerStyle }: StaggerListProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <Animated.View
            key={`stagger-${index}`}
            style={childContainerStyle}
            entering={FadeInDown.duration(400)
              .delay(initialDelay + index * staggerDelay)
              .easing(Easing.out(Easing.back(1.2)))}
          >
            {child}
          </Animated.View>
        );
      })}
    </>
  );
}
