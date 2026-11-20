import { LoginTicket, OAuth2Client, TokenPayload } from 'google-auth-library';
import { GoogleService } from '../services/google.service';
import { env } from '../config/env';

const initialClientId = env.GOOGLE_CLIENT_ID;
const initialEnvironment = env.NODE_ENV;
// Select the Promise overload; the library also exposes a callback overload.
const verify = jest.spyOn(
  OAuth2Client.prototype,
  'verifyIdToken'
) as unknown as jest.SpyInstance<
  Promise<LoginTicket>,
  [{ idToken: string; audience?: string | string[] }]
>;
const payload: TokenPayload = {
  sub: 'google-subject',
  email: 'User@Example.com',
  email_verified: true,
  name: 'Google User',
  aud: 'web-client',
  iss: 'https://accounts.google.com',
  iat: 1,
  exp: 9999999999,
};
beforeEach(() => {
  env.GOOGLE_CLIENT_ID = 'web-client, android-client';
  verify.mockReset();
  verify.mockResolvedValue(new LoginTicket('header', payload));
});
afterAll(() => {
  env.GOOGLE_CLIENT_ID = initialClientId;
  env.NODE_ENV = initialEnvironment;
  verify.mockRestore();
});

it('rejects missing tokens', async () => {
  await expect(GoogleService.verifyIdToken('')).rejects.toMatchObject({
    code: 'MISSING_GOOGLE_TOKEN',
  });
  expect(verify).not.toHaveBeenCalled();
});
it.each(['development', 'test', 'production'])(
  'rejects forged demo identities in %s',
  async (environment) => {
    env.NODE_ENV = environment;
    await expect(
      GoogleService.verifyIdToken(
        'mock-google-token:attacker@example.com:Attacker'
      )
    ).rejects.toMatchObject({ code: 'INVALID_GOOGLE_TOKEN' });
    expect(verify).not.toHaveBeenCalled();
  }
);
it('fails closed when no intended audience is configured', async () => {
  env.GOOGLE_CLIENT_ID = ' , ';
  await expect(
    GoogleService.verifyIdToken('provider-token')
  ).rejects.toMatchObject({ code: 'GOOGLE_AUTH_NOT_CONFIGURED', status: 503 });
  expect(verify).not.toHaveBeenCalled();
});
it('uses the official verifier with an explicit audience allowlist', async () => {
  expect(await GoogleService.verifyIdToken('provider-token')).toMatchObject({
    sub: 'google-subject',
    email: 'user@example.com',
  });
  expect(verify).toHaveBeenCalledWith({
    idToken: 'provider-token',
    audience: ['web-client', 'android-client'],
  });
});
it.each(['bad signature', 'expired token', 'wrong issuer', 'wrong audience'])(
  'rejects provider verification failure: %s',
  async (reason) => {
    verify.mockRejectedValue(new Error(reason));
    await expect(
      GoogleService.verifyIdToken('provider-token')
    ).rejects.toMatchObject({ code: 'INVALID_GOOGLE_TOKEN' });
  }
);
it('rejects unverified email', async () => {
  verify.mockResolvedValue(
    new LoginTicket('header', { ...payload, email_verified: false })
  );
  await expect(
    GoogleService.verifyIdToken('provider-token')
  ).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
});
it('rejects missing identity claims', async () => {
  verify.mockResolvedValue(
    new LoginTicket('header', { ...payload, email: undefined })
  );
  await expect(
    GoogleService.verifyIdToken('provider-token')
  ).rejects.toMatchObject({ code: 'INVALID_GOOGLE_TOKEN' });
});

it('checks the request nonce when one is supplied', async () => {
  const identity = { ...payload, nonce: 'matching-request-nonce' };
  verify.mockResolvedValue(new LoginTicket('header', identity));
  await expect(
    GoogleService.verifyIdToken('provider-token', 'different-request-nonce')
  ).rejects.toMatchObject({ code: 'INVALID_GOOGLE_NONCE' });
  await expect(
    GoogleService.verifyIdToken('provider-token', identity.nonce)
  ).resolves.toMatchObject({ sub: payload.sub, issuedAt: payload.iat });
});
