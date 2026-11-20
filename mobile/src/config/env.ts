import { Platform } from 'react-native';
import { readMobileEnvironment } from './environment';

// Expo inlines these direct property accesses into the bundle.
const settings = readMobileEnvironment(
  {
    environment: process.env.EXPO_PUBLIC_ENV,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL,
  },
  typeof __DEV__ !== 'undefined' && __DEV__,
  Platform.OS
);

export const env = {
  ...settings,
  APP_NAME: 'EcoNexus',
  APP_LINK_BASE_URL: process.env.EXPO_PUBLIC_APP_LINK_BASE_URL || '',
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
};
export default env;
