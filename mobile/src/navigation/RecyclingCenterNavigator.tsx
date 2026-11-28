/* eslint-disable react-native/no-color-literals */
import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/recycling-center/DashboardScreen';
import IncomingMaterialsScreen from '../screens/recycling-center/IncomingMaterialsScreen';
import ProcessingScreen from '../screens/recycling-center/ProcessingScreen';
import VerificationStatusScreen from '../screens/recycling-center/VerificationStatusScreen';
import CapacityScreen from '../screens/recycling-center/CapacityScreen';
import AcceptedCategoriesScreen from '../screens/recycling-center/AcceptedCategoriesScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import { TabIcon } from './tabBar';

export type RecyclingOperationsStackParamList = {
  DashboardMain: undefined;
  VerificationStatus: undefined;
  Capacity: undefined;
  AcceptedCategories: undefined;
};

const OperationsStack = createNativeStackNavigator<RecyclingOperationsStackParamList>();

function OperationsStackNavigator() {
  return (
    <OperationsStack.Navigator screenOptions={{ headerShown: false }}>
      <OperationsStack.Screen name="DashboardMain" component={DashboardScreen} />
      <OperationsStack.Screen name="VerificationStatus" component={VerificationStatusScreen} />
      <OperationsStack.Screen name="Capacity" component={CapacityScreen} />
      <OperationsStack.Screen name="AcceptedCategories" component={AcceptedCategoriesScreen} />
    </OperationsStack.Navigator>
  );
}

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
        component={OperationsStackNavigator}
        options={{
          tabBarLabel: 'Operations',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              icon={focused ? 'grid' : 'grid-outline'}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="IncomingMaterials"
        component={IncomingMaterialsScreen}
        options={{
          tabBarLabel: 'Intake',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              icon={focused ? 'cube' : 'cube-outline'}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Processing"
        component={ProcessingScreen}
        options={{
          tabBarLabel: 'Processing',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              icon={focused ? 'sync' : 'sync-outline'}
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Facility Hub',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              icon={focused ? 'business' : 'business-outline'}
              focused={focused}
              color={color}
              size={size}
            />
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
