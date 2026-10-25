// RootNavigator.tsx
import React from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import PendingVerificationScreen from '../screens/auth/PendingVerificationScreen';
import RejectedAccountScreen from '../screens/auth/RejectedAccountScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RoleNavigator from './RoleNavigator';
import SplashScreen from '../screens/auth/SplashScreen';
import { hasSeenOnboarding, markOnboardingSeen } from '../services/appPreferences';

/**
 * RootNavigator – decides which navigation flow to render based on authentication state.
 *   - loading → SplashScreen
 *   - signedOut → AuthNavigator (login/register flow)
 *   - PENDING_VERIFICATION → PendingVerificationScreen
 *   - REJECTED → RejectedAccountScreen
 *   - SUSPENDED → show a message and clear the local session
 *   - ACTIVE → role-specific tabs
 */
export default function RootNavigator() {
  const { status, user, signOut } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (status !== 'signedOut' || onboardingSeen !== null) return;
    hasSeenOnboarding()
      .then(setOnboardingSeen)
      .catch(() => {
        Alert.alert(
          'Onboarding unavailable',
          'Continuing to sign in without saving onboarding progress.'
        );
        setOnboardingSeen(true);
      });
  }, [onboardingSeen, status]);

  React.useEffect(() => {
    if (status !== 'signedIn' || user?.status !== 'SUSPENDED') return;

    Alert.alert('Account suspended', 'Your account is suspended. You have been signed out.');
    signOut().catch(() => {
      Alert.alert('Sign-out failed', 'Please close and reopen the app to clear this session.');
    });
  }, [signOut, status, user?.status]);

  let screen: React.ReactNode;

  if (status === 'loading') {
    screen = <SplashScreen />;
  } else if (status === 'signedOut' || !user) {
    if (onboardingSeen === null) {
      screen = <SplashScreen />;
    } else if (!onboardingSeen) {
      screen = (
        <OnboardingScreen
          onComplete={async () => {
            await markOnboardingSeen();
            setOnboardingSeen(true);
          }}
        />
      );
    } else {
      screen = <AuthNavigator />;
    }
  } else {
    switch (user.status) {
      case 'PENDING_VERIFICATION':
        screen = <PendingVerificationScreen />;
        break;
      case 'REJECTED':
        screen = <RejectedAccountScreen />;
        break;
      case 'SUSPENDED':
        screen = <SplashScreen />;
        break;
      case 'ACTIVE':
        screen = <RoleNavigator />;
        break;
    }
  }

  return <NavigationContainer>{screen}</NavigationContainer>;
}
