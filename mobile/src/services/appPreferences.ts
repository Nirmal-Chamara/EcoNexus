import * as SecureStore from 'expo-secure-store';

const HAS_SEEN_ONBOARDING = 'econexus_has_seen_onboarding';

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await SecureStore.getItemAsync(HAS_SEEN_ONBOARDING)) === '1';
}

export async function markOnboardingSeen(): Promise<void> {
  await SecureStore.setItemAsync(HAS_SEEN_ONBOARDING, '1');
}
