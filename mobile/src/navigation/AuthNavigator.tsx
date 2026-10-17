import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen    from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

export type AuthStackParamList = {
  Login:    undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * AuthNavigator — stack shown when auth status = 'signedOut'.
 * RootNavigator (Phase 6) will mount this when there is no active session.
 */
export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
