import express from 'express';
import request from 'supertest';
import { pool } from '../config/database';
import { AuthService } from '../services/auth.service';
import { IdentityLinkService } from '../services/identity-link.service';
import { GoogleService } from '../services/google.service';
import { verifyPassword } from '../utils/password';
import { AppError } from '../utils/AppError';
import { signAccessToken } from '../utils/tokens';
import userRoutes from '../routes/user.routes';
import { errorHandler } from '../middleware/errorHandler';

jest.mock('../config/database', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));
jest.mock('../services/google.service', () => ({
  GoogleService: { verifyIdToken: jest.fn() },
}));
jest.mock('../utils/password', () => ({
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(),
  dummyVerifyPassword: jest.fn(),
}));
const userId = '00000000-0000-4000-8000-000000000001';
const otherId = '00000000-0000-4000-8000-000000000002';
const proof = {
  idToken: 'provider-token',
  nonce: 'request-nonce-123456789',
  currentPassword: 'CurrentPassword1',
};
let target: {
  id: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  role: string;
  status: string;
  token_version: number;
  email_verified_at: string | null;
  name: string;
};
let matchedSubject: (typeof target)[];
let matchedEmail: { id: string }[];
let linkedOwner: { id: string }[];
let query: jest.Mock;
let release: jest.Mock;
const app = express();
app.use(express.json());
app.use('/users', userRoutes);
app.use(errorHandler);
const bearer = () =>
  `Bearer ${signAccessToken({ id: userId, role: 'USER', token_version: 0 })}`;

beforeEach(() => {
  jest.clearAllMocks();
  target = {
    id: userId,
    email: 'user@example.com',
    password_hash: 'hash',
    google_id: null,
    role: 'USER',
    status: 'ACTIVE',
    token_version: 0,
    email_verified_at: '2026-11-16',
    name: 'User',
  };
  matchedSubject = [];
  matchedEmail = [];
  linkedOwner = [];
  jest
    .mocked(GoogleService.verifyIdToken)
    .mockResolvedValue({
      sub: 'google-subject',
      email: target.email,
      name: 'Google User',
      issuedAt: Date.now() / 1000,
    });
  jest.mocked(verifyPassword).mockResolvedValue(true);
  query = jest.fn(async (sql: string) => {
    if (sql.includes('SELECT id, email, password_hash'))
      return { rows: [target] };
    if (sql.includes('WHERE google_id = $1 AND id <>'))
      return { rows: linkedOwner };
    if (sql.includes('WHERE google_id = $1')) return { rows: matchedSubject };
    if (sql.includes('SELECT id FROM users WHERE email'))
      return { rows: matchedEmail };
    if (sql.includes('INSERT INTO users'))
      return { rows: [{ ...target, google_id: 'google-subject' }] };
    return { rows: [] };
  });
  release = jest.fn();
  jest.mocked(pool.connect).mockResolvedValue({ query, release } as never);
  jest
    .mocked(pool.query)
    .mockImplementation(
      async (sql: unknown) =>
        ({
          rows: String(sql).includes('AS "hasPassword"')
            ? [{ hasPassword: true, googleLinked: false }]
            : [target],
        }) as never
    );
});
const noWrites = () =>
  expect(query.mock.calls.some(([sql]) => /^(UPDATE|INSERT)/.test(sql))).toBe(
    false
  );

it('never grants access or attaches Google to an account matched only by email', async () => {
  matchedEmail = [{ id: userId }];
  await expect(
    AuthService.loginWithGoogle({
      idToken: proof.idToken,
      role: 'USER',
      nonce: proof.nonce,
    })
  ).rejects.toMatchObject({ code: 'GOOGLE_LINK_REQUIRED' });
  noWrites();
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
});
it('existing Google identities keep their server role regardless of enrollment selection', async () => {
  target.google_id = 'google-subject';
  target.role = 'ADMIN';
  matchedSubject = [target];
  const session = await AuthService.loginWithGoogle({
    idToken: proof.idToken,
    role: 'USER',
  });
  expect(session.user).toMatchObject({ id: userId, role: 'ADMIN' });
  expect(
    query.mock.calls.some(([sql]) =>
      sql.includes('SELECT id FROM users WHERE email')
    )
  ).toBe(false);
});
it('new Google users can enroll without any email/subject collision', async () => {
  const session = await AuthService.loginWithGoogle({
    idToken: proof.idToken,
    role: 'USER',
  });
  expect(session.user.id).toBe(userId);
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO users'),
    expect.arrayContaining(['google-subject', 'USER', 'ACTIVE'])
  );
});
it('maps concurrent Google enrollment uniqueness conflicts without issuing a session', async () => {
  const implementation = query.getMockImplementation()!;
  query.mockImplementation(async (...args) => {
    if (args[0].includes('INSERT INTO users')) throw { code: '23505' };
    return implementation(...args);
  });
  await expect(
    AuthService.loginWithGoogle({ idToken: proof.idToken, role: 'USER' })
  ).rejects.toMatchObject({ code: 'GOOGLE_IDENTITY_CONFLICT' });
  expect(
    query.mock.calls.some(([sql]) => sql.includes('INSERT INTO refresh_tokens'))
  ).toBe(false);
});
it('connects only the authenticated account, revokes sessions and audits without storing proof', async () => {
  expect(await IdentityLinkService.linkGoogle(userId, proof)).toEqual({
    googleLinked: true,
    signInRequired: true,
  });
  expect(GoogleService.verifyIdToken).toHaveBeenCalledWith(
    proof.idToken,
    proof.nonce
  );
  expect(verifyPassword).toHaveBeenCalledWith(proof.currentPassword, 'hash');
  expect(query).toHaveBeenCalledWith(
    'UPDATE users SET google_id = $1, token_version = token_version + 1, updated_at = NOW() WHERE id = $2',
    ['google-subject', userId]
  );
  expect(query).toHaveBeenCalledWith(
    'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
    [userId]
  );
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining('INSERT INTO audit_logs'),
    [userId, 'GOOGLE_IDENTITY_LINKED', userId, { provider: 'google' }]
  );
  expect(query).toHaveBeenLastCalledWith('COMMIT');
  expect(JSON.stringify(query.mock.calls)).not.toContain(proof.currentPassword);
  expect(JSON.stringify(query.mock.calls)).not.toContain(proof.idToken);
});
it('rejects an incorrect password before identity mutation', async () => {
  jest.mocked(verifyPassword).mockResolvedValue(false);
  await expect(
    IdentityLinkService.linkGoogle(userId, proof)
  ).rejects.toMatchObject({ code: 'INVALID_PASSWORD' });
  noWrites();
});
it('rejects a different Google email even after correct password proof', async () => {
  target.email = 'other@example.com';
  await expect(
    IdentityLinkService.linkGoogle(userId, proof)
  ).rejects.toMatchObject({ code: 'GOOGLE_EMAIL_MISMATCH' });
  noWrites();
});
it('does not replace a different linked Google identity', async () => {
  target.google_id = 'old-google-subject';
  await expect(
    IdentityLinkService.linkGoogle(userId, proof)
  ).rejects.toMatchObject({ code: 'GOOGLE_IDENTITY_CONFLICT' });
  noWrites();
});
it('does not attach an identity already owned by another account', async () => {
  linkedOwner = [{ id: otherId }];
  await expect(
    IdentityLinkService.linkGoogle(userId, proof)
  ).rejects.toMatchObject({ code: 'GOOGLE_IDENTITY_CONFLICT' });
  noWrites();
});
it.each(['SUSPENDED', 'REJECTED'])(
  'rechecks %s state inside the transaction',
  async (status) => {
    target.status = status;
    await expect(
      IdentityLinkService.linkGoogle(userId, proof)
    ).rejects.toMatchObject({ code: 'ACCOUNT_DISABLED' });
    noWrites();
  }
);
it('does not pass a Google-only null password hash to bcrypt', async () => {
  target.password_hash = null;
  await expect(
    IdentityLinkService.linkGoogle(userId, proof)
  ).rejects.toMatchObject({ code: 'PASSWORD_NOT_CONFIGURED' });
  expect(verifyPassword).not.toHaveBeenCalled();
});
it.each([-301, 60])(
  'requires a recent Google identity proof (offset %s seconds)',
  async (offset) => {
    jest
      .mocked(GoogleService.verifyIdToken)
      .mockResolvedValue({
        sub: 'google-subject',
        email: target.email,
        name: 'Google User',
        issuedAt: Date.now() / 1000 + offset,
      });
    await expect(
      IdentityLinkService.linkGoogle(userId, proof)
    ).rejects.toMatchObject({ code: 'GOOGLE_REAUTH_REQUIRED' });
    expect(pool.connect).not.toHaveBeenCalled();
  }
);
it('rolls back binding and revocation when audit saving fails', async () => {
  const implementation = query.getMockImplementation()!;
  query.mockImplementation(async (...args) => {
    if (args[0].startsWith('INSERT INTO audit_logs'))
      throw new Error('Audit failed');
    return implementation(...args);
  });
  await expect(IdentityLinkService.linkGoogle(userId, proof)).rejects.toThrow(
    'Audit failed'
  );
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(query).not.toHaveBeenCalledWith('COMMIT');
});
it('maps a raced unique binding into a conflict and rolls back', async () => {
  const implementation = query.getMockImplementation()!;
  query.mockImplementation(async (...args) => {
    if (args[0].startsWith('UPDATE users')) throw { code: '23505' };
    return implementation(...args);
  });
  await expect(
    IdentityLinkService.linkGoogle(userId, proof)
  ).rejects.toMatchObject({ code: 'GOOGLE_IDENTITY_CONFLICT' });
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
});
it('requires a real bearer token for the linking HTTP endpoint', async () => {
  expect(
    (await request(app).post('/users/me/google-link').send(proof)).status
  ).toBe(401);
  expect(GoogleService.verifyIdToken).not.toHaveBeenCalled();
});
it('rejects injected target identity/role in the linking body', async () => {
  expect(
    (
      await request(app)
        .post('/users/me/google-link')
        .set('Authorization', bearer())
        .send({ ...proof, userId: otherId, role: 'ADMIN' })
    ).status
  ).toBe(400);
  expect(pool.connect).not.toHaveBeenCalled();
});
it('returns an invalid Google proof as a form error without invalidating the bearer session', async () => {
  jest
    .mocked(GoogleService.verifyIdToken)
    .mockRejectedValue(
      new AppError(401, 'Invalid Google proof', 'INVALID_GOOGLE_TOKEN')
    );
  const response = await request(app)
    .post('/users/me/google-link')
    .set('Authorization', bearer())
    .send(proof);
  expect(response.status).toBe(400);
  expect(response.body.code).toBe('INVALID_GOOGLE_TOKEN');
});
it('returns sign-in capabilities without hashes, raw provider IDs or tokens', async () => {
  const response = await request(app)
    .get('/users/me/sign-in-methods')
    .set('Authorization', bearer());
  expect(response.status).toBe(200);
  expect(response.body.data).toEqual({
    hasPassword: true,
    googleLinked: false,
  });
});
