// RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import PendingVerificationScreen from '../screens/auth/PendingVerificationScreen';
import RoleGate from './RoleGate';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * RootNavigator – decides which navigation flow to render based on authentication state.
 *   - signedOut → AuthNavigator (login/register flow)
 *   - PENDING_VERIFICATION → PendingVerificationScreen
 *   - ACTIVE (any other signedIn status) → RoleGate (role‑specific tabs)
 */
export default function RootNavigator() {
  const { status, user } = useAuth();

  // While checking session restoration, show a loading spinner.
  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  // No active session – show authentication stack.
  if (status === 'signedOut' || !user) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // User signed in but pending verification.
  if (user.status === 'PENDING_VERIFICATION') {
    return (
      <NavigationContainer>
        <PendingVerificationScreen />
      </NavigationContainer>
    );
  }

  // Active user – delegate to role‑based navigator.
  return (
    <NavigationContainer>
      <RoleGate />
    </NavigationContainer>
  );
}
