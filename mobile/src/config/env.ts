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

export const env = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || getDevApiUrl(),
  SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL || getDevSocketUrl(),
  ENV: process.env.EXPO_PUBLIC_ENV || 'development',
  IS_DEV: (process.env.EXPO_PUBLIC_ENV || 'development') === 'development',
  APP_NAME: 'EcoNexus',
};

export default env;
