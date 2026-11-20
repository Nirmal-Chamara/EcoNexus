import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { isEnrollmentRole, EnrollmentRole } from '../navigation/enrollment';

const HAS_SEEN_ONBOARDING = 'econexus_has_seen_onboarding';
const isWeb = Platform.OS === 'web';
const ENROLLMENT_ROLE = 'econexus_enrollment_role';

export async function getEnrollmentRole(): Promise<EnrollmentRole | null> {
  try {
    const value = isWeb ? (typeof localStorage !== 'undefined' ? localStorage.getItem(ENROLLMENT_ROLE) : null) : await SecureStore.getItemAsync(ENROLLMENT_ROLE);
    return isEnrollmentRole(value) ? value : null;
  } catch { return null; }
}
export async function saveEnrollmentRole(role: EnrollmentRole): Promise<void> {
  if (!isEnrollmentRole(role)) throw new Error('Invalid enrollment role');
  try {
    if (isWeb) { if (typeof localStorage !== 'undefined') localStorage.setItem(ENROLLMENT_ROLE, role); }
    else await SecureStore.setItemAsync(ENROLLMENT_ROLE, role);
  } catch { /* In-memory enrollment can still continue if preferences are unavailable. */ }
}
export async function clearEnrollmentRole(): Promise<void> {
  try {
    if (isWeb) { if (typeof localStorage !== 'undefined') localStorage.removeItem(ENROLLMENT_ROLE); }
    else await SecureStore.deleteItemAsync(ENROLLMENT_ROLE);
  } catch { /* Non-sensitive navigation preference. */ }
}

export async function hasSeenOnboarding(): Promise<boolean> {
  if (isWeb) {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(HAS_SEEN_ONBOARDING) === '1';
    } catch {
      return false;
    }
  }
  try {
    return (await SecureStore.getItemAsync(HAS_SEEN_ONBOARDING)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  if (isWeb) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(HAS_SEEN_ONBOARDING, '1');
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(HAS_SEEN_ONBOARDING, '1');
  } catch {}
}

export async function resetOnboardingSeen(): Promise<void> {
  await clearEnrollmentRole();
  if (isWeb) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(HAS_SEEN_ONBOARDING);
    } catch {}
    return;
  }
  try {
    await SecureStore.deleteItemAsync(HAS_SEEN_ONBOARDING);
  } catch {}
}
