import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/collector/DashboardScreen';
import { RequestsStackNavigator } from './CollectorStackNavigator';
import CollectionHistoryScreen from '../screens/collector/CollectionHistoryScreen';
import ServiceAreaScreen from '../screens/collector/ServiceAreaScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import { roleTabScreenOptions, TabIcon } from './tabBar';
import { colors } from '../theme/colors';

export type CollectorTabParamList = {
  Dashboard: undefined;
  RequestsTab: undefined;
  HistoryTab: undefined;
  ServiceArea: undefined;
  ProfileTab: undefined;
  Requests?: undefined;
};

const Tab = createBottomTabNavigator<CollectorTabParamList>();

export default function CollectorNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={roleTabScreenOptions(colors.roleCollector)}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'home' : 'home-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="RequestsTab"
        component={RequestsStackNavigator}
        options={{
          tabBarLabel: 'Collect',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'car' : 'car-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={CollectionHistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'time' : 'time-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ServiceArea"
        component={ServiceAreaScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'map' : 'map-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Hub',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'business' : 'business-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
