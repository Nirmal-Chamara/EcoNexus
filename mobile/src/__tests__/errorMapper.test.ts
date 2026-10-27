import { describe, expect, it } from '@jest/globals';
import { mapApiError } from '../utils/errorMapper';

describe('mapApiError', () => {
  it('maps duplicate phone errors to an inline-friendly message', () => {
    expect(
      mapApiError(
        {
          isAxiosError: true,
          response: { status: 409, data: { code: 'PHONE_EXISTS' } },
        },
        'fallback'
      )
    ).toBe('This phone number is already in use.');
  });

  it('does not expose server internals for server errors', () => {
    expect(
      mapApiError(
        {
          isAxiosError: true,
          response: { status: 500, data: { message: 'SQL details' } },
        },
        'fallback'
      )
    ).toBe('The service is temporarily unavailable. Try again later.');
  });

  it('maps network errors and unknown errors safely', () => {
    expect(mapApiError({ isAxiosError: true }, 'fallback')).toContain('internet connection');
    expect(mapApiError(new Error('unexpected'), 'fallback')).toBe('fallback');
  });
});
