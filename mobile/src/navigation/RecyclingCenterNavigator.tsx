// RecyclingCenterNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/recycling-center/DashboardScreen';
import IncomingMaterialsScreen from '../screens/recycling-center/IncomingMaterialsScreen';
import ProcessingScreen from '../screens/recycling-center/ProcessingScreen';

export type RecyclingCenterTabParamList = {
  Dashboard: undefined;
  IncomingMaterials: undefined;
  Processing: undefined;
};

const Tab = createBottomTabNavigator<RecyclingCenterTabParamList>();

export default function RecyclingCenterNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="IncomingMaterials" component={IncomingMaterialsScreen} />
      <Tab.Screen name="Processing" component={ProcessingScreen} />
    </Tab.Navigator>
  );
}
