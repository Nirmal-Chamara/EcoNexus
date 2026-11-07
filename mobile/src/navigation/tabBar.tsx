import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';

export type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

export function roleTabScreenOptions(activeColor: string): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      paddingBottom: 6,
      paddingTop: 6,
      height: 64,
    },
    tabBarActiveTintColor: activeColor,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
    tabBarHideOnKeyboard: true,
  };
}

export function TabIcon({
  icon,
  focused,
  color,
  size = 22,
}: {
  icon: TabIconName;
  focused: boolean;
  color: string;
  size?: number;
}) {
  return (
    <Ionicons
      name={icon}
      size={focused ? size : Math.max(size - 1, 18)}
      color={color}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
