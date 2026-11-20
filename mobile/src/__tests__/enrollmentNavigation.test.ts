import React from 'react';
import { Animated, Linking } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import RootNavigator from '../navigation/RootNavigator';
import { useAuth } from '../context/AuthContext';
import * as preferences from '../services/appPreferences';
import type { EnrollmentRole } from '../navigation/enrollment';

jest.mock('../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../services/appPreferences', () => ({
  hasSeenOnboarding: jest.fn(),
  markOnboardingSeen: jest.fn(),
  getEnrollmentRole: jest.fn(),
  saveEnrollmentRole: jest.fn(),
  clearEnrollmentRole: jest.fn(),
}));
jest.mock(
  '../navigation/AuthNavigator',
  () =>
    ({ initialRegistrationRole }: { initialRegistrationRole?: string | null }) => {
      const React = require('react');
      const { Text } = require('react-native');
      return React.createElement(Text, null, `Auth: ${initialRegistrationRole || 'login'}`);
    }
);
jest.mock('../navigation/RoleNavigator', () => () => {
  const React = require('react');
  const { Text } = require('react-native');
  return React.createElement(Text, null, 'Account home');
});
jest.mock('../screens/auth/EmailVerificationScreen', () => ({ initialToken }: { initialToken?: string }) => {
  const React = require('react'); const { Text } = require('react-native');
  return React.createElement(Text, null, `Email verification: ${initialToken || ''}`);
});
jest.mock('../screens/auth/SplashScreen', () => () => null);
jest.mock('../screens/auth/PendingVerificationScreen', () => () => null);
jest.mock('../screens/auth/RejectedAccountScreen', () => () => null);
jest.mock(
  '../screens/auth/OnboardingScreen',
  () =>
    ({ onComplete, onSignIn }: { onComplete: () => void; onSignIn: () => void }) => {
      const React = require('react');
      const { View, Button } = require('react-native');
      return React.createElement(
        View,
        null,
        React.createElement(Button, { title: 'Choose role', onPress: onComplete }),
        React.createElement(Button, { title: 'Existing account', onPress: onSignIn })
      );
    }
);
jest.mock(
  '../screens/auth/RoleSelectionScreen',
  () =>
    ({ onProceed, onLogin }: { onProceed: (role: string) => void; onLogin: () => void }) => {
      const React = require('react');
      const { View, Button } = require('react-native');
      return React.createElement(
        View,
        null,
        ...['user', 'collector', 'center'].map((role) =>
          React.createElement(Button, {
            key: role,
            title: `Enroll ${role}`,
            onPress: () => onProceed(role),
          })
        ),
        React.createElement(Button, { title: 'Sign in instead', onPress: onLogin })
      );
    }
);
let seen: boolean;
let role: EnrollmentRole | null;
beforeEach(() => {
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
  jest.clearAllMocks();
  seen = false;
  role = null;
  jest
    .mocked(useAuth)
    .mockReturnValue({ status: 'signedOut', user: null, signOut: jest.fn() } as never);
  jest.mocked(preferences.hasSeenOnboarding).mockImplementation(async () => seen);
  jest.mocked(preferences.getEnrollmentRole).mockImplementation(async () => role);
  jest.mocked(preferences.saveEnrollmentRole).mockImplementation(async (value) => {
    role = value;
  });
  jest.mocked(preferences.clearEnrollmentRole).mockImplementation(async () => {
    role = null;
  });
  jest.mocked(preferences.markOnboardingSeen).mockImplementation(async () => {
    seen = true;
  });
  jest
    .spyOn(Animated, 'timing')
    .mockReturnValue({ start: () => {}, stop: () => {}, reset: () => {} });
});
afterEach(() => {
  jest.restoreAllMocks();
});

test.each(['user', 'collector', 'center'] as const)(
  'first-launch %s enrollment reaches registration with the selected role',
  async (selected) => {
    const screen = render(React.createElement(RootNavigator));
    fireEvent.press(await screen.findByText('Choose role'));
    await act(async () => {
      fireEvent.press(screen.getByText(`Enroll ${selected}`));
    });
    expect(await screen.findByText(`Auth: ${selected}`)).toBeTruthy();
    expect(preferences.saveEnrollmentRole).toHaveBeenCalledWith(selected);
  }
);
test('a restarted app restores unfinished recycling-center enrollment', async () => {
  seen = true;
  role = 'center';
  const screen = render(React.createElement(RootNavigator));
  expect(await screen.findByText('Auth: center')).toBeTruthy();
});

test('a cold reset link opens recovery before first-launch onboarding', async () => {
  const token = 'a'.repeat(64);
  jest.mocked(Linking.getInitialURL).mockResolvedValueOnce(`econexus://reset-password?token=${token}`);
  const screen = render(React.createElement(RootNavigator));
  expect(await screen.findByText('Choose a new password')).toBeTruthy();
  expect(screen.getByDisplayValue(token)).toBeTruthy();
  expect(screen.queryByText('Choose role')).toBeNull();
});

test('a warm verification link is retained until the intended account signs in', async () => {
  seen = true;
  const listener = jest.spyOn(Linking, 'addEventListener');
  const screen = render(React.createElement(RootNavigator));
  await screen.findByText('Auth: login');
  const receive = listener.mock.calls.find(([type]) => type === 'url')?.[1];
  const token = 'b'.repeat(64);
  await act(async () => { receive?.({ url: `econexus://verify-email?token=${token}` }); });
  jest.mocked(useAuth).mockReturnValue({ status: 'signedIn', user: { role: 'USER', status: 'ACTIVE', emailVerified: false }, signOut: jest.fn() } as never);
  screen.rerender(React.createElement(RootNavigator));
  expect(await screen.findByText(`Email verification: ${token}`)).toBeTruthy();
});
test('choosing existing-account login clears old registration intent', async () => {
  role = 'collector';
  const screen = render(React.createElement(RootNavigator));
  fireEvent.press(await screen.findByText('Choose role'));
  await act(async () => {
    fireEvent.press(screen.getByText('Sign in instead'));
  });
  expect(await screen.findByText('Auth: login')).toBeTruthy();
  expect(preferences.clearEnrollmentRole).toHaveBeenCalled();
});
test('successful authentication clears enrollment so the next logout opens login', async () => {
  seen = true;
  role = 'collector';
  const screen = render(React.createElement(RootNavigator));
  await screen.findByText('Auth: collector');
  jest
    .mocked(useAuth)
    .mockReturnValue({
      status: 'signedIn',
      user: { role: 'USER', status: 'ACTIVE', emailVerified: true },
      signOut: jest.fn(),
    } as never);
  screen.rerender(React.createElement(RootNavigator));
  await waitFor(() => expect(preferences.clearEnrollmentRole).toHaveBeenCalled());
  jest
    .mocked(useAuth)
    .mockReturnValue({ status: 'signedOut', user: null, signOut: jest.fn() } as never);
  screen.rerender(React.createElement(RootNavigator));
  expect(await screen.findByText('Auth: login')).toBeTruthy();
});
