import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Easing, Platform, StyleSheet, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import PendingVerificationScreen from '../screens/auth/PendingVerificationScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import { passwordResetTokenFromUrl, emailVerificationTokenFromUrl } from '../services/emailLinks';
import RejectedAccountScreen from '../screens/auth/RejectedAccountScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import RoleNavigator from './RoleNavigator';
import SplashScreen from '../screens/auth/SplashScreen';
import {
  hasSeenOnboarding,
  markOnboardingSeen,
  getEnrollmentRole,
  saveEnrollmentRole,
  clearEnrollmentRole,
} from '../services/appPreferences';
import type { EnrollmentRole } from './enrollment';
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
  const [enrollmentRole, setEnrollmentRole] = React.useState<EnrollmentRole | null>(null);
  const [recoveryToken, setRecoveryToken] = React.useState<string | null>(null);
  const [emailToken, setEmailToken] = React.useState<string | null>(null);
  useEffect(() => { if (user?.emailVerified) setEmailToken(null); }, [user?.emailVerified]);
  useEffect(() => {
    let active = true;
    const receive = (url: string | null) => {
      const token = passwordResetTokenFromUrl(url);
      if (active && token) setRecoveryToken(token);
      const verificationToken = emailVerificationTokenFromUrl(url);
      if (active && verificationToken) setEmailToken(verificationToken);
    };
    void Linking.getInitialURL()
      .then(receive)
      .catch(() => {});
    const subscription = Linking.addEventListener('url', (event) => receive(event.url));
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (status !== 'signedOut' || onboardingSeen !== null) return;
    let active = true;
    Promise.all([hasSeenOnboarding(), getEnrollmentRole()])
      .then(([seen, role]) => {
        if (active) {
          setEnrollmentRole(role);
          setOnboardingSeen(seen);
        }
      })
      .catch(() => {
        if (active) setOnboardingSeen(false);
      });
    return () => {
      active = false;
    };
  }, [onboardingSeen, status]);

  useEffect(() => {
    if (status !== 'signedIn') return;
    setEnrollmentRole(null);
    setOnboardingSeen(true);
    void clearEnrollmentRole();
    void markOnboardingSeen();
  }, [status]);

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
  if (recoveryToken) {
    screen = (
      <ResetPasswordScreen
        route={{ params: { token: recoveryToken } }}
        navigation={{
          goBack: () => setRecoveryToken(null),
          navigate: () => {
            void signOut()
              .catch(() => {})
              .finally(() => {
                setRecoveryToken(null);
                setOnboardingSeen(true);
                void markOnboardingSeen();
              });
          },
        }}
      />
    );
  } else
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
                await clearEnrollmentRole();
                setEnrollmentRole(null);
                await markOnboardingSeen();
                setOnboardingSeen(true);
              }}
            />
          ) : (
            <RoleSelectionScreen
              onProceed={async (selectedRole) => {
                await saveEnrollmentRole(selectedRole);
                setEnrollmentRole(selectedRole);
                await markOnboardingSeen();
                setOnboardingSeen(true);
              }}
              onLogin={async () => {
                await clearEnrollmentRole();
                setEnrollmentRole(null);
                await markOnboardingSeen();
                setOnboardingSeen(true);
              }}
            />
          );
        break;
      case 'signed-out':
        screen = <AuthNavigator initialRegistrationRole={enrollmentRole} />;
        break;
      case 'pending-verification':
        screen = <PendingVerificationScreen />;
        break;
      case 'email-verification':
        screen = <EmailVerificationScreen initialToken={emailToken} />;
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
