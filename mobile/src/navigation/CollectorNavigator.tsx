import React from 'react';
import { StyleSheet } from 'react-native';
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
import { TabIcon } from './tabBar';

export type CollectorTabParamList = {
  Dashboard: undefined;
  Requests: undefined;

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
    <Tab.Navigator screenOptions={roleTabScreenOptions(colors.roleCollector)}>
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
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'home' : 'home-outline'} focused={focused} color={color} size={size} />
          ),
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
        name="ServiceArea"
        component={ServiceAreaScreen}
        name="HistoryTab"
        component={CollectionHistoryScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'map' : 'map-outline'} focused={focused} color={color} size={size} />
          ),
          tabBarLabel: 'History',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🕒" focused={focused} />,
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
          tabBarLabel: 'Map',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
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
          tabBarLabel: 'Hub',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
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
