import React, { useEffect, Component } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  useSharedValue, 
  withRepeat,
  withSequence,
  LinearTransition,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { name: 'index',     label: 'Home',      iconName: 'home' },
  { name: 'hydration', label: 'Hydration', iconName: 'water' },
  { name: 'sleep',     label: 'Sleep',     iconName: 'moon' },
  { name: 'habits',    label: 'Habits',    iconName: 'checkmark-circle' },
] as const;

function TabItem({ 
  tab, 
  isFocused, 
  onPress 
}: { 
  tab: typeof TABS[number], 
  isFocused: boolean, 
  onPress: () => void 
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const pillStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(isFocused ? '#FFFFFF' : '#131929', {
        duration: 200,
      }),
    };
  });

  return (
    <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[animatedStyle, { alignItems: 'center' }]}>
        <Animated.View 
          layout={LinearTransition.springify().damping(16).stiffness(150)}
          style={[pillStyle, {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 48,
            paddingHorizontal: isFocused ? 16 : 0,
            width: isFocused ? undefined : 48,
            borderRadius: 999,
            overflow: 'hidden',
          }]}
        >
          <Ionicons 
            name={tab.iconName as any}
            size={22} 
            color={isFocused ? '#131929' : '#8A94A6'} 
          />
          {isFocused && (
            <Animated.Text 
              entering={FadeIn.duration(200).delay(100)}
              exiting={FadeOut.duration(100)}
              style={{
                marginLeft: 8,
                fontFamily: 'Poppins-SemiBold',
                fontSize: 13,
                color: '#131929',
                includeFontPadding: false,
              }} 
              numberOfLines={1}
            >
              {tab.label}
            </Animated.Text>
          )}
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  // Aurora Button pulse animation
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const pulseRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
    };
  });

  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom, 16) }]}>
      {/* Main Capsule */}
      <View style={styles.capsule}>
        {TABS.map((tab) => {
          const route = state.routes.find(r => r.name === tab.name);
          const isFocused = state.routes[state.index].name === tab.name;

          const onPress = () => {
            if (route) {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }
          };

          return (
            <TabItem 
              key={tab.name}
              tab={tab}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>

      {/* Detached Aurora Button */}
      <View style={styles.auroraButtonContainer}>
        <Animated.View style={[styles.pulseRing, pulseRingStyle]} />
        <TouchableWithoutFeedback onPress={() => navigation.navigate('companion')}>
          <LinearGradient
            colors={['#4A9EFF', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.auroraButton}
          >
            <Ionicons name="sparkles" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
}

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'red' }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>CRASH:</Text>
          <Text style={{ color: 'white' }}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function TabsLayout() {
  return (
    <ErrorBoundary>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ 
          headerShown: false,
          animation: 'fade' as any, // Supported in newer React Navigation versions
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="hydration" />
        <Tabs.Screen name="sleep" />
        <Tabs.Screen name="habits" options={{ href: null }} />
        <Tabs.Screen name="companion" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
      </Tabs>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  capsule: {
    flex: 1,
    height: 68,
    borderRadius: 999,
    backgroundColor: '#131929',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#131929',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  auroraButtonContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B5CF6',
  },
  auroraButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
