import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

import DashboardScreen from '../screens/user/DashboardScreen';
import SuggestedCollectorsScreen from '../screens/user/SuggestedCollectorsScreen';
import CreateWasteListingScreen from '../screens/user/CreateWasteListingScreen';
import MyListingsScreen from '../screens/user/MyListingsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import DashboardScreen from '../screens/user/DashboardScreen';
import CreateWasteListingScreen from '../screens/user/CreateWasteListingScreen';
import RewardsScreen from '../screens/user/RewardsScreen';
import PickupTrackingScreen from '../screens/user/PickupTrackingScreen';
import WasteNavigator from './WasteNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import { colors } from '../theme/colors';
import { TabIcon } from './tabBar';

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
  Dashboard: undefined;
  Explore: undefined;
  ListWaste: undefined;
  Activity: undefined;
  HomeTab: undefined;
  WasteTab: undefined;
  TrackTab: { pickupId?: string } | undefined;
  Rewards: undefined;
  ProfileTab: undefined;
  Rewards?: undefined;
};

const Tab = createBottomTabNavigator<UserTabParamList>();

function CenterActionButton(props: BottomTabBarButtonProps) {
  return (
    <Pressable
      {...props}
      style={[props.style, styles.centerButtonContainer]}
      accessibilityRole="button"
      accessibilityLabel="List Waste"
    >
      <View style={styles.centerFab}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </View>
      <Text style={styles.centerLabel}>List Waste</Text>
    </Pressable>
  );
}

export default function UserNavigator() {
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
      {/* 1. Home */}
    <Tab.Navigator screenOptions={roleTabScreenOptions(colors.primary)}>
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
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'home' : 'home-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* 2. Explore */}
      <Tab.Screen
        name="Explore"
        component={SuggestedCollectorsScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'map' : 'map-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* 3. Center Raised FAB (List Waste) */}
      <Tab.Screen
        name="ListWaste"
        component={CreateWasteListingScreen}
        options={{
          tabBarLabel: 'List Waste',
          tabBarButton: (props) => <CenterActionButton {...props} />,
        }}
      />

      {/* 4. Activity */}
      <Tab.Screen
        name="Activity"
        component={MyListingsScreen}
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
          tabBarLabel: 'Activity',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'receipt' : 'receipt-outline'} focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* 5. Profile */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={focused ? 'person' : 'person-outline'} focused={focused} color={color} size={size} />
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
  centerButtonContainer: {
    top: -14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#064E3B',
    marginTop: 2,
  },
});
