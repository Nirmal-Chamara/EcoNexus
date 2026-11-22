import express from 'express';
import request from 'supertest';
import { pool } from '../config/database';
import { normalizePhone } from '../utils/phone';
import { auditPhoneValues } from '../services/phone-audit.service';
import { registerSchema } from '../validators/auth.validator';
import { updateProfileSchema } from '../validators/user.validator';
import { validateRequest } from '../middleware/validation.middleware';
import { errorHandler } from '../middleware/errorHandler';
import { UserController } from '../controllers/user.controller';
import { AuthService } from '../services/auth.service';

jest.mock('../config/database', () => ({ pool: { query: jest.fn(), connect: jest.fn() } }));
jest.mock('../utils/password', () => ({ hashPassword: jest.fn(async () => 'hash') }));
const app = express();
app.use(express.json());
app.use((req, _res, next) => { req.user = { id: 'self' } as express.Request['user']; next(); });
app.patch('/me', validateRequest(updateProfileSchema), UserController.updateMe);
app.use(errorHandler);
beforeEach(() => jest.clearAllMocks());

it.each([
  ['+94 77 123 4567', '+94771234567'],
  [' +94 (71) 123-4567 ', '+94711234567'],
  ['+1 (213) 373-4253', '+12133734253'],
])('normalizes an explicit international number %s', (input, expected) => {
  expect(normalizePhone(input)).toBe(expected);
  const registered = registerSchema.parse({ body: { name: ' Person ', email: 'person@example.com', password: 'Password1', phone: input } });
  expect(registered.body.phone).toBe(expected);
  expect(registered.body.name).toBe('Person');
});
it.each(['0771234567', '94771234567', '0094771234567', '+0001234567', '+9991234567', '+9477123456712345', '+94771234567 ext 9', 'Call +94771234567', '+94++771234567', ' ', '+94 11', '+94 ７７1234567'])('rejects invalid/ambiguous OTP destination %s', (input) => {
  expect(normalizePhone(input)).toBeNull();
  if (input.trim()) expect(updateProfileSchema.safeParse({ body: { phone: input } }).success).toBe(false);
});
it.each([null, '', '   '])('clears an optional profile phone with %s as database NULL', async (phone) => {
  jest.mocked(pool.query).mockResolvedValueOnce({ rows: [{ id: 'self', phone: null }] } as never);
  const response = await request(app).patch('/me').send({ phone });
  expect(response.status).toBe(200);
  expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('phone = $1'), [null, 'self']);
});
it('stores a normalized value rather than a formatted alias', async () => {
  jest.mocked(pool.query).mockResolvedValueOnce({ rows: [{ id: 'self', phone: '+94771234567' }] } as never);
  expect((await request(app).patch('/me').send({ phone: '+94 77 123 4567' })).status).toBe(200);
  expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['+94771234567', 'self']);
});
it('rejects invalid profile data before writes, including whitespace-only names', async () => {
  expect((await request(app).patch('/me').send({ phone: '0771234567' })).status).toBe(400);
  expect((await request(app).patch('/me').send({ name: '  ' })).status).toBe(400);
  expect(pool.query).not.toHaveBeenCalled();
});
it('returns a stable conflict when another account owns a phone alias', async () => {
  jest.mocked(pool.query).mockImplementationOnce(async () => { throw { code: '23505', constraint: 'idx_users_phone_international' }; });
  const response = await request(app).patch('/me').send({ phone: '+94 77 123 4567' });
  expect(response.status).toBe(409);
  expect(response.body.code).toBe('PHONE_EXISTS');
});
it.each(['users_phone_key', 'idx_users_phone_international', 'users_email_key'])('rolls back signup on unique constraint %s', async (constraint) => {
  const query = jest.fn(async (sql: string) => {
    if (sql.includes('INSERT INTO users')) throw { code: '23505', constraint };
    return { rows: [] };
  });
  const release = jest.fn();
  jest.mocked(pool.connect).mockResolvedValueOnce({ query, release } as never);
  await expect(AuthService.register({ name: 'Person', email: 'person@example.com', password: 'Password1', role: 'USER' }))
    .rejects.toMatchObject({ code: constraint === 'users_email_key' ? 'EMAIL_EXISTS' : 'PHONE_EXISTS' });
  expect(query).toHaveBeenLastCalledWith('ROLLBACK');
  expect(release).toHaveBeenCalled();
});
it('audits legacy collisions without returning identities or guessing national numbers', () => {
  const report = auditPhoneValues([null, '', '+94771234567', '+94 77 123 4567', '0771234567', 'invalid']);
  expect(report).toEqual({ total: 6, blank: 2, invalidOrAmbiguous: 2, formatted: 1, canonicalCollisionGroups: 1, accountsInCollisionGroups: 2 });
  expect(JSON.stringify(report)).not.toContain('9477');
});
