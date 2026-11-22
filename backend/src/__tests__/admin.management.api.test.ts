import express from 'express';
import request from 'supertest';
import adminRoutes from '../routes/admin.routes';
import { errorHandler } from '../middleware/errorHandler';
import { pool } from '../config/database';
import { signAccessToken } from '../utils/tokens';

jest.mock('../config/database', () => ({
  pool: { connect: jest.fn(), query: jest.fn() },
}));
const actorId = '00000000-0000-4000-8000-000000000001';
const targetId = '00000000-0000-4000-8000-000000000002';
const applicationId = '00000000-0000-4000-8000-000000000003';
const actor = {
  id: actorId,
  role: 'ADMIN',
  status: 'ACTIVE',
  token_version: 0,
  email_verified_at: '2026-11-16',
};
let query: jest.Mock;
const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);
app.use(errorHandler);
const token = () =>
  signAccessToken({ id: actorId, role: 'ADMIN', token_version: 0 });
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(pool.query).mockResolvedValue({ rows: [actor] } as never);
  query = jest.fn(async (sql: string, values?: string[]) => {
    if (sql.startsWith('SELECT id, role, status'))
      return {
        rows: [
          values?.[0] === actorId
            ? actor
            : {
                id: targetId,
                role: 'COLLECTOR',
                email_verified_at: '2026-11-16',
                status: 'PENDING_VERIFICATION',
              },
        ],
      };
    if (sql.startsWith('SELECT user_id'))
      return { rows: [{ user_id: targetId }] };
    if (sql.startsWith('SELECT * FROM verification_requests'))
      return {
        rows: [
          {
            id: applicationId,
            requested_role: 'COLLECTOR',
            status: 'PENDING',
            organization_name: 'Collectors',
          },
        ],
      };
    return { rows: [] };
  });
  jest
    .mocked(pool.connect)
    .mockResolvedValue({ query, release: jest.fn() } as never);
});
it('blocks direct partner activation even with an authenticated administrator', async () => {
  const response = await request(app)
    .patch(`/admin/users/${targetId}/status`)
    .set('Authorization', `Bearer ${token()}`)
    .send({ status: 'ACTIVE', reason: 'Bypass review' });
  expect(response.status).toBe(409);
  expect(response.body.code).toBe('INVALID_STATUS_TRANSITION');
  expect(query.mock.calls.some(([sql]) => sql.startsWith('UPDATE'))).toBe(
    false
  );
});
it('rejects generic account rejection at the HTTP validation boundary', async () => {
  const response = await request(app)
    .patch(`/admin/users/${targetId}/status`)
    .set('Authorization', `Bearer ${token()}`)
    .send({ status: 'REJECTED', reason: 'Reject' });
  expect(response.status).toBe(400);
  expect(pool.connect).not.toHaveBeenCalled();
});
it('requires a restoration reason through the real router', async () => {
  const response = await request(app)
    .patch(`/admin/users/${targetId}/status`)
    .set('Authorization', `Bearer ${token()}`)
    .send({ status: 'ACTIVE' });
  expect(response.status).toBe(400);
  expect(pool.connect).not.toHaveBeenCalled();
});
it('cannot approve an incomplete application through the review endpoint', async () => {
  const response = await request(app)
    .patch(`/admin/verifications/${applicationId}/process`)
    .set('Authorization', `Bearer ${token()}`)
    .send({ status: 'APPROVED' });
  expect(response.status).toBe(409);
  expect(response.body.code).toBe('APPLICATION_INCOMPLETE');
  expect(query.mock.calls.some(([sql]) => sql.startsWith('UPDATE'))).toBe(
    false
  );
});
