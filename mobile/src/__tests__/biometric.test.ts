import { beforeEach, expect, jest, test } from '@jest/globals';
import * as LocalAuthentication from 'expo-local-authentication';
import { authenticateBiometric, canUseBiometrics } from '../services/biometric';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const localAuthentication = jest.mocked(LocalAuthentication);

beforeEach(() => {
  jest.clearAllMocks();
  localAuthentication.hasHardwareAsync.mockResolvedValue(true);
  localAuthentication.isEnrolledAsync.mockResolvedValue(true);
  localAuthentication.authenticateAsync.mockResolvedValue({ success: true });
});

test('reports biometrics unavailable when hardware is missing or enrollment fails', async () => {
  localAuthentication.hasHardwareAsync.mockResolvedValue(false);
  expect(await canUseBiometrics()).toBe(false);

  localAuthentication.hasHardwareAsync.mockResolvedValue(true);
  localAuthentication.isEnrolledAsync.mockRejectedValueOnce(new Error('unsupported'));
  expect(await canUseBiometrics()).toBe(false);
});

test('returns false when the biometric prompt is denied or throws', async () => {
  localAuthentication.authenticateAsync.mockResolvedValueOnce({
    success: false,
    error: 'user_cancel',
  });
  expect(await authenticateBiometric('Unlock')).toBe(false);

  localAuthentication.authenticateAsync.mockRejectedValueOnce(new Error('cancelled'));
  expect(await authenticateBiometric('Unlock')).toBe(false);
});

test('does not open a prompt when biometrics are unavailable', async () => {
  localAuthentication.isEnrolledAsync.mockResolvedValue(false);

  expect(await authenticateBiometric('Unlock')).toBe(false);
  expect(localAuthentication.authenticateAsync).not.toHaveBeenCalled();
});
