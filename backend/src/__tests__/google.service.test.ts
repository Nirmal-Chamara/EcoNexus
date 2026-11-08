import { GoogleService } from '../services/google.service';
import { AppError } from '../utils/AppError';

describe('GoogleService', () => {
  it('throws AppError when idToken is missing or empty', async () => {
    await expect(GoogleService.verifyIdToken('')).rejects.toThrow(AppError);
  });

  it('correctly parses mock tokens in dev/test mode', async () => {
    const payload = await GoogleService.verifyIdToken(
      'mock-google-token:testuser@econexus.com:Test User:sub_12345'
    );

    expect(payload).toEqual({
      sub: 'sub_12345',
      email: 'testuser@econexus.com',
      name: 'Test User',
      picture: expect.any(String),
    });
  });

  it('provides default name and sub when optional mock parts are omitted', async () => {
    const payload = await GoogleService.verifyIdToken(
      'mock-google-token:simple@econexus.com'
    );

    expect(payload.email).toBe('simple@econexus.com');
    expect(payload.name).toBe('Google User');
    expect(payload.sub).toBe('google_simple_econexus_com');
  });
});

