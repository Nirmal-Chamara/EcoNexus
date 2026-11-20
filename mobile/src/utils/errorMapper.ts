import axios from 'axios';

import type { ApiError } from '../types/api';

export function mapApiError(error: unknown, fallbackMessage: string): string {
  if (!axios.isAxiosError<Partial<ApiError>>(error)) return fallbackMessage;

  const { response } = error;
  if (!response) return 'Unable to connect. Check your internet connection and try again.';
  if (response.data?.code === 'EMAIL_VERIFICATION_REQUIRED') return 'Verify the account email before continuing.';
  if (response.data?.code === 'EMAIL_NOT_CONFIGURED') return 'Email delivery is temporarily unavailable. Please try again later.';
  if (response.data?.code === 'INVALID_EMAIL_TOKEN') return 'The verification code is invalid or expired. Use the newest email or request another.';
  if (response.data?.code === 'INVALID_GOOGLE_TOKEN' || response.data?.code === 'INVALID_GOOGLE_NONCE') return 'Google could not verify this sign-in. Please try again.';

  switch (response.status) {
    case 400:
      if (response.data?.code === 'INVALID_PASSWORD') return 'Your current password is incorrect. Please try again.';
      if (response.data?.code === 'GOOGLE_REAUTH_REQUIRED') return 'Sign in to Google again before connecting this account.';
      return response.data?.message ?? 'Please check the information and try again.';
    case 401:
      return 'Invalid email or password. Please try again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 409:
      if (response.data?.code === 'GOOGLE_LINK_REQUIRED') return 'Sign in to your existing account first. Password accounts can connect Google from Profile > Sign-in methods.';
      if (response.data?.code === 'GOOGLE_EMAIL_MISMATCH') return 'Choose the Google account with the same email as your EcoNexus account.';
      if (response.data?.code === 'GOOGLE_IDENTITY_CONFLICT') return 'This Google identity is already connected. Use the existing sign-in method or contact support.';
      if (response.data?.code === 'PARTNER_REVIEW_REQUIRED')
        return 'This partner needs a valid reviewed application before access can be restored.';
      if (response.data?.code === 'APPLICATION_INCOMPLETE')
        return 'Complete the organization details, registration number and supporting document before approval.';
      if (response.data?.code === 'INVALID_STATUS_TRANSITION')
        return 'This status change is not allowed. Reload the account and use the verification queue for partner decisions.';
      if (response.data?.code === 'ALREADY_PROCESSED')
        return 'This application has already been processed or replaced. Reload the verification queue.';
      if (response.data?.code === 'LAST_ACTIVE_ADMIN')
        return 'At least one active administrator must remain before this account can be deactivated.';
      if (response.data?.code === 'EMAIL_EXISTS') return 'This email is already registered.';
      if (response.data?.code === 'PHONE_EXISTS') return 'This phone number is already in use.';
      return 'This change conflicts with an existing account.';
    case 429:
      return 'Too many attempts. Wait a while and try again.';
    default:
      if (response.status >= 500) return 'The service is temporarily unavailable. Try again later.';
      return fallbackMessage;
  }
}
