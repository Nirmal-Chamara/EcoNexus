import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/recycling-center/DashboardScreen';
import IncomingMaterialsScreen from '../screens/recycling-center/IncomingMaterialsScreen';
import ProcessingScreen from '../screens/recycling-center/ProcessingScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import { colors } from '../theme/colors';
import { roleTabScreenOptions, TabIcon } from './tabBar';

export type RecyclingCenterTabParamList = {
  Dashboard: undefined;
  IncomingMaterials: undefined;
  Processing: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<RecyclingCenterTabParamList>();

export default function RecyclingCenterNavigator() {
  return (
    <Tab.Navigator screenOptions={roleTabScreenOptions(colors.roleCenter)}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon="home-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="IncomingMaterials"
        component={IncomingMaterialsScreen}
        options={{
          tabBarLabel: 'Incoming',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon="cube-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Processing"
        component={ProcessingScreen}
        options={{
          tabBarLabel: 'Processing',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon="sync-outline" focused={focused} color={color} size={size} />
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
