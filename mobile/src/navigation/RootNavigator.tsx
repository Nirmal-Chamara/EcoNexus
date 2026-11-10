import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Easing, Platform, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import PendingVerificationScreen from '../screens/auth/PendingVerificationScreen';
import RejectedAccountScreen from '../screens/auth/RejectedAccountScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import RoleNavigator from './RoleNavigator';
import SplashScreen from '../screens/auth/SplashScreen';
import { hasSeenOnboarding, markOnboardingSeen } from '../services/appPreferences';
import { getRootFlow } from './rootFlow';
import { linking } from './linking';
export { getRootFlow } from './rootFlow';
export type { RootFlow } from './rootFlow';

/**
 * Root flow decision table:
 * loading → Splash
 * signed out + first launch → Onboarding → RoleSelection → AuthNavigator
 * signed in + pending/rejected/suspended → restricted account state
 * signed in + active → role-specific tab navigator
 */
export default function RootNavigator() {
  const { status, user, signOut } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = React.useState<boolean | null>(null);
  const [ftueStep, setFtueStep] = React.useState<'onboarding' | 'roleSelection'>('onboarding');

  useEffect(() => {
    if (status !== 'signedOut' || onboardingSeen !== null) return;
    hasSeenOnboarding()
      .then(setOnboardingSeen)
      .catch(() => {
        setOnboardingSeen(false);
      });
  }, [onboardingSeen, status]);

  useEffect(() => {
    if (status !== 'signedIn' || user?.status !== 'SUSPENDED') return;

    Alert.alert('Account suspended', 'Your account is suspended. You have been signed out.');
    signOut().catch(() => {
      Alert.alert('Sign-out failed', 'Please close and reopen the app to clear this session.');
    });
  }, [signOut, status, user?.status]);

  const flow = getRootFlow(status, user, onboardingSeen);
  const transitionKey = `${flow}:${user?.role ?? 'public'}:${user?.status ?? 'signedOut'}:${ftueStep}`;
  const opacity = useRef(new Animated.Value(1)).current;
  const previousTransitionKey = useRef(transitionKey);

  useEffect(() => {
    if (previousTransitionKey.current === transitionKey) return;
    previousTransitionKey.current = transitionKey;
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [opacity, transitionKey]);

  let screen: React.ReactNode;
  switch (flow) {
    case 'loading':
    case 'onboarding-loading':
    case 'suspended':
      screen = (
        <SplashScreen
          onGetStarted={() => {
            setOnboardingSeen(false);
            setFtueStep('onboarding');
          }}
        />
      );
      break;
    case 'onboarding':
      screen =
        ftueStep === 'onboarding' ? (
          <OnboardingScreen
            onComplete={() => setFtueStep('roleSelection')}
            onSkip={() => setFtueStep('roleSelection')}
            onSignIn={async () => {
              await markOnboardingSeen();
              setOnboardingSeen(true);
            }}
          />
        ) : (
          <RoleSelectionScreen
            onProceed={async (selectedRole) => {
              await markOnboardingSeen();
              setOnboardingSeen(true);
            }}
            onLogin={async () => {
              await markOnboardingSeen();
              setOnboardingSeen(true);
            }}
          />
        );
      break;
    case 'signed-out':
      screen = <AuthNavigator />;
      break;
    case 'pending-verification':
      screen = <PendingVerificationScreen />;
      break;
    case 'rejected':
      screen = <RejectedAccountScreen />;
      break;
    case 'role':
      screen = <RoleNavigator key={user?.role} />;
      break;
  }

  return (
    <NavigationContainer key={transitionKey} linking={linking}>
      <Animated.View style={[styles.flow, { opacity }]}>{screen}</Animated.View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  flow: { flex: 1 },
});
