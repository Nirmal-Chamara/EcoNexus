// RecyclingCenterNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import DashboardScreen from '../screens/recycling-center/DashboardScreen';
import IncomingMaterialsScreen from '../screens/recycling-center/IncomingMaterialsScreen';
import ProcessingScreen from '../screens/recycling-center/ProcessingScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import { colors } from '../theme/colors';

export type RecyclingCenterTabParamList = {
  Dashboard:         undefined;
  IncomingMaterials: undefined;
  Processing:        undefined;
  ProfileTab:        undefined;
};

const Tab = createBottomTabNavigator<RecyclingCenterTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function RecyclingCenterNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor:   colors.roleCenter,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏭" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="IncomingMaterials"
        component={IncomingMaterialsScreen}
        options={{
          tabBarLabel: 'Incoming',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Processing"
        component={ProcessingScreen}
        options={{
          tabBarLabel: 'Processing',
          tabBarIcon: ({ focused }) => <TabIcon emoji="♻️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
