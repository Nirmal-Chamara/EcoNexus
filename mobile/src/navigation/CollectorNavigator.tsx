import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/collector/DashboardScreen';
import RequestsScreen from '../screens/collector/RequestsScreen';
import ServiceAreaScreen from '../screens/collector/ServiceAreaScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import { colors } from '../theme/colors';
import { roleTabScreenOptions, TabIcon } from './tabBar';

export type CollectorTabParamList = {
  Dashboard: undefined;
  Requests: undefined;
  ServiceArea: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<CollectorTabParamList>();

export default function CollectorNavigator() {
  return (
    <Tab.Navigator screenOptions={roleTabScreenOptions(colors.roleCollector)}>
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
        name="Requests"
        component={RequestsScreen}
        options={{
          tabBarLabel: 'Requests',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon="clipboard-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ServiceArea"
        component={ServiceAreaScreen}
        options={{
          tabBarLabel: 'Area',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon="map-outline" focused={focused} color={color} size={size} />
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
