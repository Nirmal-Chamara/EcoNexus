import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/user/DashboardScreen';
import RewardsScreen from '../screens/user/RewardsScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import { colors } from '../theme/colors';
import { roleTabScreenOptions, TabIcon } from './tabBar';

export type UserTabParamList = {
  Dashboard: undefined;
  Rewards: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<UserTabParamList>();

export default function UserNavigator() {
  return (
    <Tab.Navigator screenOptions={roleTabScreenOptions(colors.primary)}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon="home-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarLabel: 'Rewards',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon="trophy-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon="person-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
