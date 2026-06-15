import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';

interface InsightBannerProps {
  insight: string | null;
  isLoading: boolean;
}

export default function InsightBanner({ insight, isLoading }: InsightBannerProps) {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    if (isLoading) {
      shimmerValue.value = withRepeat(
        withTiming(1, { duration: 1200 }),
        -1,
        false
      );
    } else {
      shimmerValue.value = 0;
    }
  }, [isLoading, shimmerValue]);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(shimmerValue.value, [0, 1], [-300, 300]) }
      ]
    };
  });

  if (!isLoading && !insight) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={[StyleSheet.absoluteFillObject, shimmerStyle]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
        
        {/* Skeleton content */}
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" color="white" size={22} />
          </View>
          <View style={styles.textContent}>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonText} />
            <View style={[styles.skeletonText, { width: '60%', marginTop: 6 }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Animated.View 
      entering={FadeInDown.duration(400).withInitialValues({ transform: [{ translateY: 20 }] })}
      style={styles.container}
    >
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: radius.lg }]}
      />
      
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" color="white" size={22} />
        </View>
        
        <View style={styles.textContent}>
          <Text style={styles.label}>AURORA'S INSIGHT</Text>
          <Text style={styles.text}>{insight}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 20,
    minHeight: 80,
  },
  loadingContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 20,
    minHeight: 80,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    marginTop: 4,
  },
  skeletonLabel: {
    height: 11,
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonText: {
    height: 14,
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  }
});
