import express from 'express';
import request from 'supertest';
import { AuthService } from '../services/auth.service';
import { GoogleService } from '../services/google.service';
import { pool } from '../config/database';
import {
  registerSchema,
  googleAuthSchema,
  RegisterInput,
  GoogleAuthInput,
} from '../validators/auth.validator';
import { validateRequest } from '../middleware/validation.middleware';
import { errorHandler } from '../middleware/errorHandler';

jest.mock('../config/database', () => ({
  pool: { connect: jest.fn(), query: jest.fn() },
}));
jest.mock('../services/google.service', () => ({
  GoogleService: { verifyIdToken: jest.fn() },
}));

const localPayload = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password123',
};
const app = express();
app.use(express.json());
// Exercise the real HTTP validation boundary without unrelated provider/rate limits.
app.post('/register', validateRequest(registerSchema), (req, res) =>
  res.json(req.body)
);
app.post('/google', validateRequest(googleAuthSchema), (req, res) =>
  res.json(req.body)
);
app.use(errorHandler);

beforeEach(() => jest.clearAllMocks());

describe('public enrollment HTTP contracts', () => {
  it.each(['ADMIN', 'admin', 'SUPERUSER'])(
    'rejects local privileged/unknown role %s',
    async (role) => {
      const response = await request(app)
        .post('/register')
        .send({ ...localPayload, role });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    }
  );
  it.each(['ADMIN', 'admin', 'AdMiN'])(
    'rejects Google privileged role %s after normalization',
    async (role) => {
      expect(
        (
          await request(app)
            .post('/google')
            .send({ idToken: 'untrusted-token', role })
        ).status
      ).toBe(400);
    }
  );
  it('passes only validated defaults and permitted fields to controllers', async () => {
    const response = await request(app)
      .post('/register')
      .send({ ...localPayload, status: 'ACTIVE', token_version: 100 });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ...localPayload, role: 'USER' });
  });
  it.each([
    ['collector', 'COLLECTOR'],
    ['center', 'RECYCLING_CENTER'],
    ['user', 'USER'],
  ])(
    'normalizes Google role %s to %s for controllers',
    async (input, expected) => {
      const response = await request(app)
        .post('/google')
        .send({ idToken: 'untrusted-token', role: input });
      expect(response.status).toBe(200);
      expect(response.body.role).toBe(expected);
    }
  );
  it('defaults Google enrollment to USER', async () => {
    const response = await request(app)
      .post('/google')
      .send({ idToken: 'untrusted-token' });
    expect(response.body.role).toBe('USER');
  });
});

describe('public enrollment service boundary', () => {
  it('rejects forged ADMIN local input before touching the database', async () => {
    const input = {
      ...localPayload,
      role: 'ADMIN',
    } as unknown as RegisterInput;
    await expect(AuthService.register(input)).rejects.toMatchObject({
      code: 'INVALID_ENROLLMENT_ROLE',
    });
    expect(pool.connect).not.toHaveBeenCalled();
    expect(pool.query).not.toHaveBeenCalled();
  });
  it('rejects forged ADMIN Google input before token verification or database access', async () => {
    const input = {
      idToken: 'untrusted-token',
      role: 'ADMIN',
    } as unknown as GoogleAuthInput;
    await expect(AuthService.loginWithGoogle(input)).rejects.toMatchObject({
      code: 'INVALID_ENROLLMENT_ROLE',
    });
    expect(GoogleService.verifyIdToken).not.toHaveBeenCalled();
    expect(pool.connect).not.toHaveBeenCalled();
  });
});
