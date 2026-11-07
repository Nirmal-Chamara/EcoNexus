import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export async function authenticateBiometric(promptMessage: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    if (!hasHardware || !isEnrolled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Use password',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}

export async function canUseBiometrics(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}
