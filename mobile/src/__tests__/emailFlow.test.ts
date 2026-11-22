import React from 'react';
import { Linking } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, afterEach, expect, jest, test } from '@jest/globals';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import { authService } from '../services/auth.service';
import { useAuth } from '../hooks/useAuth';
import { getRootFlow } from '../navigation/rootFlow';
import { emailVerificationTokenFromUrl, passwordResetTokenFromUrl } from '../services/emailLinks';

jest.mock('../hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('../config/env', () => ({ env: { APP_LINK_BASE_URL: 'https://app.econexus.test' } }));
jest.mock('../services/auth.service', () => ({
  authService: {
    requestEmailVerification: jest.fn(),
    confirmEmailVerification: jest.fn(),
    requestPasswordReset: jest.fn(),
  },
}));
const refresh = jest.fn<() => Promise<void>>();
const user = {
  id: 'user',
  name: 'User',
  email: 'user@econexus.test',
  role: 'USER' as const,
  status: 'ACTIVE' as const,
  emailVerified: false,
};
const code = 'a'.repeat(64);
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({ user, refreshUser: refresh, signOut: jest.fn() } as never);
  jest.mocked(authService.requestEmailVerification).mockResolvedValue(undefined);
  jest.mocked(authService.confirmEmailVerification).mockResolvedValue(undefined);
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
});
afterEach(() => {
  jest.restoreAllMocks();
});

test('unverified ACTIVE and partner accounts go through email verification before role access', () => {
  expect(getRootFlow('signedIn', user, true)).toBe('email-verification');
  expect(getRootFlow('signedIn', { ...user, status: 'PENDING_VERIFICATION' }, true)).toBe(
    'email-verification'
  );
  expect(getRootFlow('signedIn', { ...user, emailVerified: true }, true)).toBe('role');
  expect(getRootFlow('signedIn', { ...user, status: 'SUSPENDED' }, true)).toBe('suspended');
});
test('only trusted links for the intended purpose can prefill a credential', () => {
  expect(emailVerificationTokenFromUrl(`econexus://verify-email?token=${code}`)).toBe(code);
  expect(
    emailVerificationTokenFromUrl(`https://app.econexus.test/verify-email?token=${code}`)
  ).toBe(code);
  expect(
    emailVerificationTokenFromUrl(`https://app.econexus.test.evil/verify-email?token=${code}`)
  ).toBeNull();
  expect(emailVerificationTokenFromUrl(`econexus://reset-password?token=${code}`)).toBeNull();
  expect(passwordResetTokenFromUrl(`econexus://reset-password?token=${code}`)).toBe(code);
  expect(passwordResetTokenFromUrl('econexus://reset-password?token=invalid')).toBeNull();
});
test('opening a verification email prefills but does not consume proof until the user confirms', async () => {
  jest.mocked(Linking.getInitialURL).mockResolvedValue(`econexus://verify-email?token=${code}`);
  const screen = render(React.createElement(EmailVerificationScreen));
  await waitFor(() =>
    expect(screen.getByLabelText('Email verification code').props.value).toBe(code)
  );
  expect(authService.confirmEmailVerification).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Verify email' }));
  });
  expect(authService.confirmEmailVerification).toHaveBeenCalledWith(code);
  expect(refresh).toHaveBeenCalled();
});
test('verification errors do not locally grant access', async () => {
  jest
    .mocked(authService.confirmEmailVerification)
    .mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { code: 'INVALID_EMAIL_TOKEN' } },
    });
  const screen = render(React.createElement(EmailVerificationScreen));
  fireEvent.changeText(screen.getByLabelText('Email verification code'), code);
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Verify email' }));
  });
  expect(await screen.findByText(/invalid or expired/)).toBeTruthy();
  expect(refresh).not.toHaveBeenCalled();
});
test('resend reports queued delivery and applies a local cooldown', async () => {
  const screen = render(React.createElement(EmailVerificationScreen));
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Send verification email' }));
  });
  expect(await screen.findByText(/Verification email queued/)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Request another email in 60s' }));
  expect(authService.requestEmailVerification).toHaveBeenCalledTimes(1);
});
test('recovery never displays or prefills a developer/API supplied reset credential', async () => {
  jest
    .mocked(authService.requestPasswordReset)
    .mockResolvedValue({ message: 'Generic', devResetToken: 'server-secret' } as never);
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  const screen = render(React.createElement(ForgotPasswordScreen, { navigation }));
  fireEvent.changeText(screen.getByLabelText('Email address'), user.email);
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Send reset code' }));
  });
  fireEvent.press(await screen.findByRole('button', { name: 'Enter reset code' }));
  expect(screen.queryByText('server-secret')).toBeNull();
  expect(navigation.navigate).toHaveBeenCalledWith('ResetPassword');
}, 15000);
