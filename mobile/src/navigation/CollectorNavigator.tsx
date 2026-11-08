import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/collector/DashboardScreen';
import RequestsScreen from '../screens/collector/RequestsScreen';
import ServiceAreaScreen from '../screens/collector/ServiceAreaScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import { TabIcon } from './tabBar';

export type CollectorTabParamList = {
  Dashboard: undefined;
  Requests: undefined;
  ServiceArea: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<CollectorTabParamList>();

export default function CollectorNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      }}
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
        name="Requests"
        component={RequestsScreen}
        options={{
          tabBarLabel: 'Collect',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'car' : 'car-outline'} focused={focused} color={color} size={size} />
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
    height: 64,
    paddingTop: 6,
    paddingBottom: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
