import { beforeEach, expect, jest, test } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import {
  getEnrollmentRole,
  saveEnrollmentRole,
  clearEnrollmentRole,
  resetOnboardingSeen,
} from '../services/appPreferences';
import { enrollmentAccountRole, enrollmentParams } from '../navigation/enrollment';

const mockDisk = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockDisk.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockDisk.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockDisk.delete(key);
  }),
}));
beforeEach(() => {
  mockDisk.clear();
  jest.clearAllMocks();
});
test.each(['user', 'collector', 'center'] as const)(
  'persists and restores the %s enrollment intent',
  async (role) => {
    await saveEnrollmentRole(role);
    expect(await getEnrollmentRole()).toBe(role);
    expect(enrollmentParams(role)).toEqual({ role, partner: role !== 'user' });
  }
);
test('stored privileged/invalid values never become a registration role', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('ADMIN');
  expect(await getEnrollmentRole()).toBeNull();
});
test('clears enrollment intent after completion or onboarding reset', async () => {
  await saveEnrollmentRole('collector');
  await clearEnrollmentRole();
  expect(await getEnrollmentRole()).toBeNull();
  await saveEnrollmentRole('center');
  await resetOnboardingSeen();
  expect(await getEnrollmentRole()).toBeNull();
});
test('uses one public-role mapping for both Google and password enrollment', () => {
  expect(enrollmentAccountRole('center')).toBe('RECYCLING_CENTER');
  expect(enrollmentAccountRole('collector')).toBe('COLLECTOR');
  expect(enrollmentAccountRole('user')).toBe('USER');
});
