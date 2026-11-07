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

  it('maps validation, permission, rate-limit, and conflict responses safely', () => {
    expect(
      mapApiError(
        { isAxiosError: true, response: { status: 400, data: { message: 'Invalid phone' } } },
        'fallback'
      )
    ).toBe('Invalid phone');
    expect(mapApiError({ isAxiosError: true, response: { status: 403 } }, 'fallback')).toContain(
      'permission'
    );
    expect(
      mapApiError({ isAxiosError: true, response: { status: 409, data: {} } }, 'fallback')
    ).toBe('This change conflicts with an existing account.');
    expect(mapApiError({ isAxiosError: true, response: { status: 429 } }, 'fallback')).toContain(
      'Too many attempts'
    );
    expect(mapApiError({ isAxiosError: true, response: { status: 418 } }, 'fallback')).toBe(
      'fallback'
    );
  });
});
