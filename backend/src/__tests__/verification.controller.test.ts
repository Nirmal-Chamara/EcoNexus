import type { NextFunction, Request, Response } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { UserController } from '../controllers/user.controller';
import { pool } from '../config/database';

jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

const mockedPool = jest.mocked(pool);

function response() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
}

describe('verification account state flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the latest rejected review note from /users/me', async () => {
    mockedPool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'user-id',
          name: 'Alex Green',
          email: 'alex@example.com',
          phone: null,
          role: 'COLLECTOR',
          status: 'REJECTED',
          rejectionReason: 'Please provide a current registration document.',
        },
      ],
    } as never);

    const req = { user: { id: 'user-id' } } as Request;
    const res = response();
    const next = jest.fn() as unknown as NextFunction;

    await UserController.getMe(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Profile retrieved successfully',
      data: expect.objectContaining({
        status: 'REJECTED',
        rejectionReason: 'Please provide a current registration document.',
      }),
    });
    expect(mockedPool.query).toHaveBeenCalledWith(expect.stringContaining('"rejectionReason"'), [
      'user-id',
    ]);
  });

  it('sets rejected users to REJECTED and invalidates their sessions', async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          rows: [
            {
              status: 'PENDING',
              user_id: 'user-id',
              requested_role: 'COLLECTOR',
            },
          ],
        })
        .mockResolvedValue(undefined),
      release: jest.fn(),
    };
    mockedPool.connect.mockResolvedValue(client as never);

    const req = {
      params: { id: 'verification-id' },
      body: { status: 'REJECTED', review_note: 'Please provide a current document.' },
      user: { id: 'admin-id' },
    } as unknown as Request;
    const res = response();
    const next = jest.fn() as unknown as NextFunction;

    await AdminController.processVerification(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'REJECTED', token_version = token_version + 1"),
      ['user-id']
    );
    expect(client.release).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns an admin user profile with recent audit activity', async () => {
    mockedPool.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'user-id',
            name: 'Alex Green',
            email: 'alex@example.com',
            phone: '+94770000000',
            role: 'COLLECTOR',
            status: 'ACTIVE',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-02T00:00:00.000Z',
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            action: 'USER_STATUS_CHANGED_TO_ACTIVE',
            target_id: 'user-id',
            meta: { new_status: 'ACTIVE' },
            created_at: '2026-01-02T00:00:00.000Z',
            actor_id: 'admin-id',
            actor_name: 'Admin User',
          },
        ],
      } as never);

    const req = { params: { id: 'user-id' } } as unknown as Request;
    const res = response();
    const next = jest.fn() as unknown as NextFunction;

    await AdminController.getUserById(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User details retrieved successfully',
      data: expect.objectContaining({
        id: 'user-id',
        activity: [expect.objectContaining({ action: 'USER_STATUS_CHANGED_TO_ACTIVE' })],
      }),
    });
  });
});
