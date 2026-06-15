import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  { name: 'index',     label: 'Home',      icon: 'home'             },
  { name: 'hydration', label: 'Hydration', icon: 'water'            },
  { name: 'sleep',     label: 'Sleep',     icon: 'moon'             },
  { name: 'habits',    label: 'Habits',    icon: 'checkmark-circle' },
  { name: 'companion', label: 'Aurora',    icon: 'sparkles'         },
] as const;

// ── Custom Tab Bar ────────────────────────────────────────────────────────────
function AuroraTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const tab = TABS[index];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={tab.label}
          >
            {isFocused ? (
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activePill}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={colors.textOnGradient}
                />
                <Text style={styles.activeLabelText}>{tab.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveItem}>
                <Ionicons
                  name={`${tab.icon}-outline` as any}
                  size={22}
                  color={colors.textSecondary}
                />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AuroraTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="hydration" />
      <Tabs.Screen name="sleep" />
      <Tabs.Screen name="habits" />
      <Tabs.Screen name="companion" />
    </Tabs>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.bgCard,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderHairline,
    ...Platform.select({
      ios: {
        shadowColor: '#9499A7',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: -4 },
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  activeLabelText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.textOnGradient,
    includeFontPadding: false,
  },
  inactiveItem: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
