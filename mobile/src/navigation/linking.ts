import { LinkingOptions } from '@react-navigation/native';
import { env } from '../config/env';
import { Linking } from 'react-native';
import { passwordResetTokenFromUrl, emailVerificationTokenFromUrl } from '../services/emailLinks';

export const linking: LinkingOptions<Record<string, unknown>> = {
  prefixes: ['econexus://', ...(env.APP_LINK_BASE_URL ? [env.APP_LINK_BASE_URL] : [])],
  // Credential links are handled by the root/restricted screens across all
  // account trees, including before onboarding and while already signed in.
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    return passwordResetTokenFromUrl(url) || emailVerificationTokenFromUrl(url) ? null : url;
  },
  subscribe(listener) {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (!passwordResetTokenFromUrl(url) && !emailVerificationTokenFromUrl(url)) listener(url);
    });
    return () => subscription.remove();
  },
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
