import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, expect, jest, test } from '@jest/globals';
import SignInMethodsScreen from '../screens/shared/SignInMethodsScreen';
import { userService } from '../services/user.service';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useAuth } from '../hooks/useAuth';
import type { UseGoogleAuthResult } from '../hooks/useGoogleAuth';

jest.mock('../hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('../hooks/useGoogleAuth', () => ({ useGoogleAuth: jest.fn() }));
jest.mock('../services/user.service', () => ({
  userService: { getSignInMethods: jest.fn(), linkGoogle: jest.fn() },
}));
const logout = jest.fn<(reason: string) => Promise<void>>();
let googleOptions: { onIdentity?: (token: string, nonce: string) => Promise<void> } | undefined;
let prompt: ReturnType<typeof jest.fn<() => Promise<void>>>;
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(useAuth)
    .mockReturnValue({
      user: { id: 'user-id', email: 'user@example.com' },
      forceLogout: logout,
    } as never);
  jest
    .mocked(userService.getSignInMethods)
    .mockResolvedValue({ hasPassword: true, googleLinked: false });
  jest
    .mocked(userService.linkGoogle)
    .mockResolvedValue({ googleLinked: true, signInRequired: true });
  prompt = jest.fn(async () => {
    await googleOptions?.onIdentity?.('provider-token', 'request-nonce-123456789');
  });
  jest.mocked(useGoogleAuth).mockImplementation((options) => {
    googleOptions = options;
    return {
      promptGoogleSignIn: prompt,
      isLoading: false,
      error: null,
      isConfigured: true,
      clearError: jest.fn(),
    } as UseGoogleAuthResult;
  });
});
test('requires the password, submits proof to the existing-account endpoint, then ends the session', async () => {
  const screen = render(React.createElement(SignInMethodsScreen));
  await waitFor(() => expect(screen.getByText('Google: Not connected')).toBeTruthy());
  fireEvent.press(screen.getByRole('button', { name: 'Connect Google' }));
  expect(prompt).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText('Current account password'), 'CurrentPassword1');
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Connect Google' }));
  });
  await waitFor(() =>
    expect(userService.linkGoogle).toHaveBeenCalledWith({
      idToken: 'provider-token',
      nonce: 'request-nonce-123456789',
      currentPassword: 'CurrentPassword1',
    })
  );
  expect(logout).toHaveBeenCalledWith('SIGN_IN_METHOD_CHANGED');
});
test('does not offer replacement of an already linked identity', async () => {
  jest
    .mocked(userService.getSignInMethods)
    .mockResolvedValue({ hasPassword: true, googleLinked: true });
  const screen = render(React.createElement(SignInMethodsScreen));
  expect(await screen.findByText('Google: Connected')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Connect Google' })).toBeNull();
});
test('does not sign out or report success after a failed backend link', async () => {
  jest.mocked(userService.linkGoogle).mockRejectedValue(new Error('Rejected'));
  render(React.createElement(SignInMethodsScreen));
  await waitFor(() => expect(userService.getSignInMethods).toHaveBeenCalled());
  await act(async () => {
    await expect(
      googleOptions?.onIdentity?.('provider-token', 'request-nonce-123456789')
    ).rejects.toThrow('Rejected');
  });
  expect(logout).not.toHaveBeenCalled();
});
