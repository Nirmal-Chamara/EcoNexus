import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/admin/DashboardScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import { UsersStackNavigator, VerificationsStackNavigator } from './AdminStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import { colors } from '../theme/colors';
import { roleTabScreenOptions, TabIcon } from './tabBar';

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Verifications: undefined;
  Reports: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminNavigator() {
  return (
    <Tab.Navigator screenOptions={roleTabScreenOptions(colors.roleAdmin)}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon="bar-chart-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Users"
        component={UsersStackNavigator}
        options={{
          tabBarLabel: 'Users',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon="people-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Verifications"
        component={VerificationsStackNavigator}
        options={{
          tabBarLabel: 'Verify',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon="checkmark-done-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon="document-text-outline" focused={focused} color={color} size={size} />
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
