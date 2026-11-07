// CollectorNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import DashboardScreen from '../screens/collector/DashboardScreen';
import RequestDetailsScreen from '../screens/collector/RequestDetailsScreen';
import CapacityScreen from '../screens/collector/CapacityScreen';
import SchedulePickupScreen from '../screens/collector/SchedulePickupScreen';
import VerificationStatusScreen from '../screens/collector/VerificationStatusScreen';
import { RequestsStackNavigator } from './CollectorStackNavigator';
import CollectionHistoryScreen from '../screens/collector/CollectionHistoryScreen';
import ServiceAreaScreen from '../screens/collector/ServiceAreaScreen';
import ProfileStackNavigator from './ProfileStackNavigator';

export type CollectorHomeStackParamList = {
  DashboardHome: undefined;
  RequestDetails: { pickupId: string };
  Capacity: undefined;
  SchedulePickup: undefined;
  VerificationStatus: undefined;
};

const HomeStack = createNativeStackNavigator<CollectorHomeStackParamList>();

function CollectorHomeStackNavigator() {
  return (
    <HomeStack.Navigator
      initialRouteName="DashboardHome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <HomeStack.Screen name="DashboardHome" component={DashboardScreen} />
      <HomeStack.Screen name="RequestDetails" component={RequestDetailsScreen} />
      <HomeStack.Screen name="Capacity" component={CapacityScreen} />
      <HomeStack.Screen name="SchedulePickup" component={SchedulePickupScreen} />
      <HomeStack.Screen name="VerificationStatus" component={VerificationStatusScreen} />
    </HomeStack.Navigator>
  );
}

export type CollectorTabParamList = {
  Dashboard: undefined;
  RequestsTab: undefined;
  HistoryTab: undefined;
  ServiceArea: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<CollectorTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
  );
}

export default function CollectorNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 4,
        },
        tabBarActiveTintColor: '#059669', // Emerald from Figma
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={CollectorHomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="RequestsTab"
        component={RequestsStackNavigator}
        options={{
          tabBarLabel: 'Collect',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚛" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={CollectionHistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🕒" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ServiceArea"
        component={ServiceAreaScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Hub',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
