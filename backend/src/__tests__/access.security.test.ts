import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import collectorRoutes from '../routes/collector.routes';
import pickupRoutes from '../routes/pickup.routes';
import userRoutes from '../routes/user.routes';
import { pool } from '../config/database';
import { PickupService } from '../services/pickup.service';
import { errorHandler } from '../middleware/errorHandler';
import { signAccessToken } from '../utils/tokens';
import { env } from '../config/env';
import type { AccountStatus, UserRole } from '../types/express';

jest.mock('../config/database', () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));
jest.mock('../services/pickup.service', () => ({
  PickupService: {
    getPickupById: jest.fn(),
    getUserPickups: jest.fn(),
    createPickup: jest.fn(),
    getNearbyPickups: jest.fn(),
    acceptPickup: jest.fn(),
    updatePickupStatus: jest.fn(),
  },
}));
jest.mock('../controllers/collector.controller', () => ({
  CollectorController: Object.fromEntries(
    [
      'updateLocation',
      'getProfile',
      'updateProfile',
      'getAssignedPickups',
      'getStats',
    ].map((name) => [
      name,
      (_req: express.Request, res: express.Response) => res.json({ ok: true }),
    ])
  ),
}));

const userId = '00000000-0000-4000-8000-000000000001';
const otherId = '00000000-0000-4000-8000-000000000002';
const pickupId = '00000000-0000-4000-8000-000000000003';
let account: {
  id: string;
  role: UserRole;
  status: AccountStatus;
  token_version: number;
  email_verified_at: string | null;
};
const app = express();
app.use(express.json());
app.use('/collector', collectorRoutes);
app.use('/pickup', pickupRoutes);
app.use('/users', userRoutes);
app.use(errorHandler);
const token = () =>
  signAccessToken({ id: userId, role: 'COLLECTOR', token_version: 0 });

beforeEach(() => {
  jest.clearAllMocks();
  account = {
    id: userId,
    role: 'COLLECTOR',
    status: 'ACTIVE',
    token_version: 0,
    email_verified_at: '2026-11-16',
  };
  jest
    .mocked(pool.query)
    .mockImplementation(async () => ({ rows: [account] }) as never);
  jest
    .mocked(PickupService.getPickupById)
    .mockResolvedValue({ user_id: otherId, allocation: null } as never);
});

const operationalRoutes = [
  ['get', '/collector/profile'],
  ['put', '/collector/profile'],
  ['put', '/collector/location'],
  ['get', '/collector/pickups'],
  ['get', '/collector/stats'],
  ['post', '/pickup/request'],
  ['get', '/pickup/nearby'],
  ['get', '/pickup/my'],
  ['get', `/pickup/${pickupId}`],
  ['post', `/pickup/${pickupId}/accept`],
  ['put', `/pickup/${pickupId}/status`],
] as const;

describe.each([
  'PENDING_VERIFICATION',
  'REJECTED',
  'SUSPENDED',
] as AccountStatus[])('%s operational restrictions', (status) => {
  it.each(operationalRoutes)(
    'denies %s %s before the controller',
    async (method, path) => {
      account.status = status;
      const response = await request(app)
        [method](path)
        .set('Authorization', `Bearer ${token()}`)
        .send({});
      expect(response.status).toBe(403);
      expect(PickupService.getPickupById).not.toHaveBeenCalled();
    }
  );
});

it('allows a pending account to retrieve its own setup profile', async () => {
  account.status = 'PENDING_VERIFICATION';
  expect(
    (
      await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${token()}`)
    ).status
  ).toBe(200);
});
it('rejects an invalidated token even after reactivation', async () => {
  account.token_version = 1;
  const response = await request(app)
    .get('/collector/profile')
    .set('Authorization', `Bearer ${token()}`);
  expect(response.status).toBe(401);
  expect(response.body.code).toBe('TOKEN_REVOKED');
});
it('rejects expired tokens', async () => {
  const expired = jwt.sign({ sub: userId, tv: 0 }, env.JWT_ACCESS_SECRET, {
    expiresIn: -1,
  });
  const response = await request(app)
    .get('/collector/profile')
    .set('Authorization', `Bearer ${expired}`);
  expect(response.body.code).toBe('TOKEN_EXPIRED');
});
it('uses the current database role rather than an old token role', async () => {
  account.role = 'USER';
  expect(
    (
      await request(app)
        .get('/collector/profile')
        .set('Authorization', `Bearer ${token()}`)
    ).status
  ).toBe(403);
});
it('permits an active collector profile', async () => {
  expect(
    (
      await request(app)
        .get('/collector/profile')
        .set('Authorization', `Bearer ${token()}`)
    ).status
  ).toBe(200);
});

it('ACTIVE accounts without email proof remain restricted while own setup stays available', async () => {
  account.email_verified_at = null;
  const response = await request(app).get('/collector/profile').set('Authorization', `Bearer ${token()}`);
  expect(response.status).toBe(403); expect(response.body.code).toBe('EMAIL_VERIFICATION_REQUIRED');
  expect((await request(app).get('/users/me').set('Authorization', `Bearer ${token()}`)).status).toBe(200);
});
it('denies another household pickup', async () => {
  account.role = 'USER';
  expect(
    (
      await request(app)
        .get(`/pickup/${pickupId}`)
        .set('Authorization', `Bearer ${token()}`)
    ).status
  ).toBe(403);
});
it.each(['owner', 'assigned collector', 'admin'])(
  'permits pickup details for %s',
  async (access) => {
    if (access === 'owner') account.role = 'USER';
    if (access === 'admin') account.role = 'ADMIN';
    jest
      .mocked(PickupService.getPickupById)
      .mockResolvedValue({
        user_id: access === 'owner' ? userId : otherId,
        allocation:
          access === 'assigned collector' ? { collector_id: userId } : null,
      } as never);
    expect(
      (
        await request(app)
          .get(`/pickup/${pickupId}`)
          .set('Authorization', `Bearer ${token()}`)
      ).status
    ).toBe(200);
  }
);
