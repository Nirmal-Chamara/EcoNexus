import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const HAS_SEEN_ONBOARDING = 'econexus_has_seen_onboarding';
const isWeb = Platform.OS === 'web';

export async function hasSeenOnboarding(): Promise<boolean> {
  if (isWeb) {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(HAS_SEEN_ONBOARDING) === '1';
    } catch {
      return true; // Don't block web preview with onboarding
    }
  }
  try {
    return (await SecureStore.getItemAsync(HAS_SEEN_ONBOARDING)) === '1';
  } catch {
    return true;
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
