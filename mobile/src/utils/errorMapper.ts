import axios from 'axios';

interface ApiErrorPayload {
  message?: string;
  code?: string;
}

export function mapApiError(error: unknown, fallbackMessage: string): string {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) return fallbackMessage;

  const { response } = error;
  if (!response) return 'Unable to connect. Check your internet connection and try again.';

  switch (response.status) {
    case 400:
      return response.data?.message ?? 'Please check the information and try again.';
    case 401:
      return 'Invalid email or password. Please try again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 409:
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
