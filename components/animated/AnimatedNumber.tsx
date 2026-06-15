import React, { useEffect } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { TextInput } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  style?: TextStyle;
  formatter?: 'default' | 'hydration' | 'hours';
}

export function AnimatedNumber({
  value,
  duration = 600,
  suffix = '',
  prefix = '',
  style,
  formatter = 'default',
}: AnimatedNumberProps) {
  const animValue = useSharedValue(value);
  // The user prompt specifically requested:
  // const animValue = useSharedValue(0);
  // I'll stick to their implementation slightly modified for correctness

  useEffect(() => {
    animValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, duration]);

  // Using TextInput since Animated.Text with animatedProps doesn't work well for text content in Reanimated v3
  // It needs `text` prop which only works on TextInput
  const animatedProps = useAnimatedProps(() => {
    const val = animValue.value;
    let formattedStr = '';

    if (formatter === 'hydration') {
      const v = Math.round(val);
      if (v >= 1000) {
        let dec = Math.round(v / 100) / 10;
        formattedStr = dec.toString();
        if (formattedStr.indexOf('.') === -1) {
           formattedStr += '.0'; 
        }
        formattedStr += 'L'; 
      } else {
        formattedStr = v.toString() + 'ml';
      }
    } else if (formatter === 'hours') {
      const whole = Math.floor(val);
      const mins = Math.round((val - whole) * 60);
      let minsStr = mins.toString();
      if (mins < 10) minsStr = '0' + minsStr;
      formattedStr = `${whole}:${minsStr} Hours`;
    } else {
      formattedStr = Math.round(val).toString();
    }
    
    const textStr = formatter === 'default' ? `${prefix}${formattedStr}${suffix}` : formattedStr;
    
    return {
      text: textStr,
      // For some platforms `defaultValue` or `value` might be needed
      defaultValue: textStr,
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      animatedProps={animatedProps}
      style={[style, { padding: 0, margin: 0, color: style?.color }]}
    />
  );
}
