/**
 * AdminStackNavigator.tsx
 *
 * Provides two native-stack navigators for the ADMIN role:
 *  • UsersStackNavigator         — UserListScreen → UserDetailScreen
 *  • VerificationsStackNavigator — VerificationQueueScreen → VerificationDetailScreen
 *
 * Each is used as the component for the corresponding tab in AdminNavigator.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AdminUser, VerificationRequest } from '../services/admin.service';
import UserListScreen           from '../screens/admin/UserListScreen';
import UserDetailScreen         from '../screens/admin/UserDetailScreen';
import VerificationQueueScreen  from '../screens/admin/VerificationQueueScreen';
import VerificationDetailScreen from '../screens/admin/VerificationDetailScreen';

// ─── Param Lists ──────────────────────────────────────────────────────────────

export type AdminUsersStackParamList = {
  UserList:   undefined;
  UserDetail: { user: AdminUser };
};

export type AdminVerificationsStackParamList = {
  VerificationQueue:  undefined;
  VerificationDetail: { verification: VerificationRequest };
};

// ─── Users Stack ──────────────────────────────────────────────────────────────

const UsersStack = createNativeStackNavigator<AdminUsersStackParamList>();

export function UsersStackNavigator() {
  return (
    <UsersStack.Navigator
      initialRouteName="UserList"
      screenOptions={{
        headerShown:  false,
        animation:    'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <UsersStack.Screen name="UserList"   component={UserListScreen} />
      <UsersStack.Screen name="UserDetail" component={UserDetailScreen} />
    </UsersStack.Navigator>
  );
}

// ─── Verifications Stack ──────────────────────────────────────────────────────

const VerificationsStack = createNativeStackNavigator<AdminVerificationsStackParamList>();

export function VerificationsStackNavigator() {
  return (
    <VerificationsStack.Navigator
      initialRouteName="VerificationQueue"
      screenOptions={{
        headerShown:  false,
        animation:    'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <VerificationsStack.Screen name="VerificationQueue"  component={VerificationQueueScreen} />
      <VerificationsStack.Screen name="VerificationDetail" component={VerificationDetailScreen} />
    </VerificationsStack.Navigator>
  );
}
