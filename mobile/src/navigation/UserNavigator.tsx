// UserNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import DashboardScreen from '../screens/user/DashboardScreen';
import CreateWasteListingScreen from '../screens/user/CreateWasteListingScreen';
import RewardsScreen from '../screens/user/RewardsScreen';
import PickupTrackingScreen from '../screens/user/PickupTrackingScreen';
import WasteNavigator from './WasteNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import { colors } from '../theme/colors';

export type UserHomeStackParamList = {
  HomeMain: undefined;
  CreatePickup: undefined;
};

const HomeStack = createNativeStackNavigator<UserHomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      initialRouteName="HomeMain"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <HomeStack.Screen name="HomeMain" component={DashboardScreen} />
      <HomeStack.Screen name="CreatePickup" component={CreateWasteListingScreen} />
    </HomeStack.Navigator>
  );
}

export type UserTabParamList = {
  HomeTab: undefined;
  WasteTab: undefined;
  TrackTab: { pickupId?: string } | undefined;
  Rewards: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<UserTabParamList>();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function UserNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="WasteTab"
        component={WasteNavigator}
        options={{
          tabBarLabel: 'Waste',
          tabBarIcon: ({ focused }) => <TabIcon emoji="♻️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="TrackTab"
        component={PickupTrackingScreen}
        options={{
          tabBarLabel: 'Live Track',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📍" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarLabel: 'Rewards',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⭐" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
