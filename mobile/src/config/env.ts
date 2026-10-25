import { Platform } from 'react-native';

const DEFAULT_PORT = 4000;

const getDevApiUrl = (): string => {
  // Android emulator maps 10.0.2.2 to the host loopback (localhost)
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}/api`;
  }
  return `http://localhost:${DEFAULT_PORT}/api`;
};

const getDevSocketUrl = (): string => {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }
  return `http://localhost:${DEFAULT_PORT}`;
};

const environment = process.env.EXPO_PUBLIC_ENV || 'development';
const apiUrl = process.env.EXPO_PUBLIC_API_URL || getDevApiUrl();
const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || getDevSocketUrl();

if (
  environment !== 'development' &&
  (!apiUrl.startsWith('https://') || !socketUrl.startsWith('https://'))
) {
  throw new Error('API and socket URLs must use HTTPS outside development builds.');
}

export const env = {
  API_URL: apiUrl,
  SOCKET_URL: socketUrl,
  ENV: environment,
  IS_DEV: environment === 'development',
  APP_NAME: 'EcoNexus',
};

export default env;
