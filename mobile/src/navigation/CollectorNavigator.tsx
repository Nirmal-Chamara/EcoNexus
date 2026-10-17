// CollectorNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/collector/DashboardScreen';
import RequestsScreen from '../screens/collector/RequestsScreen';
import ServiceAreaScreen from '../screens/collector/ServiceAreaScreen';

export type CollectorTabParamList = {
  Dashboard: undefined;
  Requests: undefined;
  ServiceArea: undefined;
};

const Tab = createBottomTabNavigator<CollectorTabParamList>();

export default function CollectorNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="ServiceArea" component={ServiceAreaScreen} />
    </Tab.Navigator>
  );
}
