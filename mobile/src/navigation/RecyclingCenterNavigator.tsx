import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/recycling-center/DashboardScreen';
import IncomingMaterialsScreen from '../screens/recycling-center/IncomingMaterialsScreen';
import ProcessingScreen from '../screens/recycling-center/ProcessingScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import { TabIcon } from './tabBar';

export type RecyclingCenterTabParamList = {
  Dashboard: undefined;
  IncomingMaterials: undefined;
  Processing: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<RecyclingCenterTabParamList>();

export default function RecyclingCenterNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Operations',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'grid' : 'grid-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="IncomingMaterials"
        component={IncomingMaterialsScreen}
        options={{
          tabBarLabel: 'Intake',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'cube' : 'cube-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Processing"
        component={ProcessingScreen}
        options={{
          tabBarLabel: 'Processing',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'sync' : 'sync-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Facility Hub',
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
    height: 68,
    paddingTop: 6,
    paddingBottom: 8,
    elevation: 8,
    shadowColor: '#000000',
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
