/**
 * CollectorStackNavigator.tsx
 *
 * Provides a native-stack navigator for the Collector Requests tab:
 *  • RequestsScreen        — Overview of nearby available and assigned pickups
 *  • RequestDetailsScreen  — Detailed view with map, turn-by-turn navigation, and lifecycle actions
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RequestsScreen from '../screens/collector/RequestsScreen';
import RequestDetailsScreen from '../screens/collector/RequestDetailsScreen';

export type CollectorRequestsStackParamList = {
  RequestsList: undefined;
  RequestDetails: { pickupId: string };
};

const Stack = createNativeStackNavigator<CollectorRequestsStackParamList>();

export function RequestsStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="RequestsList"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="RequestsList" component={RequestsScreen} />
      <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
    </Stack.Navigator>
  );
}

