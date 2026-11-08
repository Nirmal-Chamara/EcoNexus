/**
 * ProfileStackNavigator
 *
 * A shared native-stack navigator that wraps:
 *   Profile → EditProfile → ChangePassword
 *
 * Consumed by every role tab navigator (User, Collector, RecyclingCenter, Admin)
 * as the Profile tab component.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen    from '../screens/shared/ProfileScreen';
import EditProfileScreen from '../screens/shared/EditProfileScreen';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';

export type ProfileStackParamList = {
  Profile:        undefined;
  EditProfile:    undefined;
  ChangePassword: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Profile"         component={ProfileScreen} />
      <Stack.Screen name="EditProfile"     component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword"  component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}
