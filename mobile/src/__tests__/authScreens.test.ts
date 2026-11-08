import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, expect, jest, test } from '@jest/globals';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import { useAuth } from '../hooks/useAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { canUseBiometrics } from '../services/biometric';
import { tokenStorage } from '../services/tokenStorage';

jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
jest.mock('../hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('../hooks/useGoogleAuth', () => ({
  useGoogleAuth: jest.fn(),
}));
jest.mock('../services/biometric', () => ({ canUseBiometrics: jest.fn() }));
jest.mock('../services/tokenStorage', () => ({
  tokenStorage: {
    getBiometricEnabled: jest.fn(),
    setBiometricEnabled: jest.fn(),
  },
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseGoogleAuth = jest.mocked(useGoogleAuth);
const mockedCanUseBiometrics = jest.mocked(canUseBiometrics);
const mockedTokenStorage = jest.mocked(tokenStorage);
const navigation = { navigate: jest.fn() };
const mockPromptGoogleSignIn = jest.fn<(keepSignedIn?: boolean, role?: string) => Promise<void>>();

beforeEach(() => {
  jest.clearAllMocks();
  mockPromptGoogleSignIn.mockImplementation(async () => undefined);
  mockedUseGoogleAuth.mockReturnValue({
    promptGoogleSignIn: mockPromptGoogleSignIn,
    isLoading: false,
    error: null,
    clearError: jest.fn(),
    isConfigured: true,
  });
  mockedCanUseBiometrics.mockImplementation(async () => false);
  mockedTokenStorage.getBiometricEnabled.mockImplementation(async () => false);
  mockedTokenStorage.setBiometricEnabled.mockImplementation(async () => undefined);
  mockedUseAuth.mockReturnValue({
    signIn: jest.fn().mockImplementation(async () => undefined),
    signUp: jest.fn().mockImplementation(async () => undefined),
    logoutReason: null,
    dismissLogoutReason: jest.fn(),
  } as never);
});

test('login validates fields, submits credentials, and navigates to registration', async () => {
  const screen = render(React.createElement(LoginScreen, { navigation }));
  const auth = mockedUseAuth.mock.results[0]?.value as { signIn: jest.Mock };

  fireEvent.press(screen.getByRole('tab', { name: 'Create Account' }));
  expect(navigation.navigate).toHaveBeenCalledWith('Register');

  fireEvent.changeText(screen.getByLabelText('Email address'), 'alex@example.com');
  fireEvent.changeText(screen.getByLabelText('Password'), 'Password1');

  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Sign In' }));
  });

  await waitFor(() => {
    expect(auth.signIn).toHaveBeenCalledWith(
      { email: 'alex@example.com', password: 'Password1' },
      true
    );
  });
  expect(screen.getByLabelText('Email address').props.accessibilityHint).toContain('Valid');
}, 15000);

test('login maps an authentication failure to a generic message', async () => {
  const signIn = jest.fn().mockImplementation(async () => {
    throw {
      isAxiosError: true,
      response: { status: 401, data: { message: 'email exists' } },
    };
  });
  mockedUseAuth.mockReturnValue({
    signIn,
    logoutReason: null,
    dismissLogoutReason: jest.fn(),
  } as never);
  const screen = render(React.createElement(LoginScreen, { navigation }));

  fireEvent.changeText(screen.getByLabelText('Email address'), 'alex@example.com');
  fireEvent.changeText(screen.getByLabelText('Password'), 'Password1');
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Sign In' }));
  });

  expect(await screen.findByText('Invalid email or password. Please try again.')).toBeTruthy();
  expect(screen.queryByText('email exists')).toBeNull();
});

test('registration hides ADMIN, collects the household flow, and submits only allowed fields', async () => {
  const screen = render(
    React.createElement(RegisterScreen, {
      navigation: navigation as never,
      route: { key: 'Register', name: 'Register' },
    })
  );
  const auth = mockedUseAuth.mock.results[0]?.value as { signUp: jest.Mock };

  expect(screen.queryByText('Admin')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  });
  await waitFor(() => expect(screen.getByLabelText('Full name')).toBeTruthy());

  fireEvent.changeText(screen.getByLabelText('Full name'), 'Alex Green');
  fireEvent.changeText(screen.getByLabelText('Email address'), 'alex@example.com');
  fireEvent.changeText(screen.getByLabelText('Password'), 'Password1');
  fireEvent.changeText(screen.getByLabelText('Confirm password'), 'Password1');

  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  });
  await waitFor(() => expect(screen.getByText('No organization details needed')).toBeTruthy());
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  });
  await waitFor(() => expect(screen.getByText('Review your details')).toBeTruthy());
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Create Account' }));
  });

  await waitFor(() => {
    expect(auth.signUp).toHaveBeenCalledWith({
      name: 'Alex Green',
      email: 'alex@example.com',
      password: 'Password1',
      role: 'USER',
      phone: undefined,
      organizationName: undefined,
    });
  });
});

test('login triggers google sign-in when Continue with Google is pressed', async () => {
  const screen = render(React.createElement(LoginScreen, { navigation }));

  const googleButton = screen.getByRole('button', { name: 'Continue with Google' });
  expect(googleButton).toBeTruthy();

  await act(async () => {
    fireEvent.press(googleButton);
  });

  expect(mockPromptGoogleSignIn).toHaveBeenCalledWith(true);
});
