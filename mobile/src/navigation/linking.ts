import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<Record<string, unknown>> = {
  prefixes: ['econexus://', 'https://econexus.com'],
  config: {
    screens: {
      ResetPassword: {
        path: 'reset-password',
        parse: {
          token: (token: string) => decodeURIComponent(token),
        },
      },
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
    },
  },
};

export default linking;
