import type { Server, Socket } from 'socket.io';
import { pool } from '../config/database';
import { signAccessToken } from '../utils/tokens';
import { authorizeSubscription } from '../services/socket-access.service';
import {
  registerPickupSocket,
  emitPickupStatusUpdate,
  emitCollectorLocation,
} from '../sockets/pickup.socket';
import type { UserRole, AccountStatus } from '../types/express';

jest.mock('../config/database', () => ({ pool: { query: jest.fn() } }));
const userId = '00000000-0000-4000-8000-000000000001';
const resourceId = '00000000-0000-4000-8000-000000000002';
let account: {
  id: string;
  role: UserRole;
  status: AccountStatus;
  token_version: number;
  email_verified_at: string | null;
};
let ownsResource: boolean;
let socket: {
  connected: boolean;
  handshake: { auth: { token?: string } };
  on: jest.Mock;
  join: jest.Mock;
  leave: jest.Mock;
  emit: jest.Mock;
  disconnect: jest.Mock;
};
let server: { use: jest.Mock; on: jest.Mock; in: jest.Mock };
const token = () =>
  signAccessToken({ id: userId, role: 'USER', token_version: 0 });

beforeEach(() => {
  jest.clearAllMocks();
  account = { id: userId, role: 'USER', status: 'ACTIVE', token_version: 0, email_verified_at: '2026-11-16' };
  ownsResource = false;
  jest
    .mocked(pool.query)
    .mockImplementation(
      async (sql: unknown) =>
        ({
          rows: String(sql).includes('SELECT id, role')
            ? [account]
            : ownsResource
              ? [{ id: resourceId }]
              : [],
        }) as never
    );
  socket = {
    connected: true,
    handshake: { auth: { token: token() } },
    on: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };
  server = {
    use: jest.fn(),
    on: jest.fn(),
    in: jest
      .fn()
      .mockReturnValue({ fetchSockets: jest.fn().mockResolvedValue([socket]) }),
  };
  registerPickupSocket(server as unknown as Server);
});

it('rejects unauthenticated socket connections', async () => {
  socket.handshake.auth = {};
  const next = jest.fn();
  await server.use.mock.calls[0][0](socket, next);
  expect(next).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ code: 'UNAUTHORIZED' }),
    })
  );
});
it.each(['PENDING_VERIFICATION', 'REJECTED', 'SUSPENDED'] as AccountStatus[])(
  'rejects %s connections',
  async (status) => {
    account.status = status;
    const next = jest.fn();
    await server.use.mock.calls[0][0](socket, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  }
);
it('accepts an authenticated active connection', async () => {
  const next = jest.fn();
  await server.use.mock.calls[0][0](socket, next);
  expect(next).toHaveBeenCalledWith();
});

it('rejects ACTIVE but email-unverified connections and existing deliveries', async () => {
  account.email_verified_at = null;
  const next = jest.fn(); await server.use.mock.calls[0][0](socket, next);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ code: 'EMAIL_VERIFICATION_REQUIRED' }) }));
  await emitPickupStatusUpdate(resourceId, { status: 'IN_TRANSIT' });
  expect(socket.emit).not.toHaveBeenCalledWith('pickup_status_changed', expect.anything());
  expect(socket.disconnect).toHaveBeenCalledWith(true);
});
it('does not join another household pickup room', async () => {
  server.on.mock.calls[0][1](socket as unknown as Socket);
  await socket.on.mock.calls.find(([event]) => event === 'join_pickup')![1](
    resourceId
  );
  expect(socket.join).not.toHaveBeenCalled();
  expect(socket.emit).toHaveBeenCalledWith(
    'subscription_error',
    expect.objectContaining({ code: 'FORBIDDEN' })
  );
});
it('joins only an authorized pickup room', async () => {
  ownsResource = true;
  server.on.mock.calls[0][1](socket as unknown as Socket);
  await socket.on.mock.calls.find(([event]) => event === 'join_pickup')![1](
    resourceId
  );
  expect(socket.join).toHaveBeenCalledWith(`pickup:${resourceId}`);
});
it('rejects malformed identifiers instead of passing objects into room names', async () => {
  await expect(
    authorizeSubscription(token(), 'pickup', { id: resourceId })
  ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
});
it('does not allow household users into the collector broadcast pool', async () => {
  await expect(
    authorizeSubscription(token(), 'available')
  ).rejects.toMatchObject({ code: 'FORBIDDEN' });
});
it('allows active collectors into the available pool and their own location room', async () => {
  account.role = 'COLLECTOR';
  await expect(
    authorizeSubscription(token(), 'available')
  ).resolves.toMatchObject({ id: userId });
  await expect(
    authorizeSubscription(token(), 'collector', userId)
  ).resolves.toMatchObject({ id: userId });
});
it('does not allow collectors to track an unrelated collector', async () => {
  account.role = 'COLLECTOR';
  await expect(
    authorizeSubscription(token(), 'collector', resourceId)
  ).rejects.toMatchObject({ code: 'FORBIDDEN' });
});
it('allows a household with an active assigned pickup to receive its collector location', async () => {
  ownsResource = true;
  await emitCollectorLocation(resourceId, { latitude: 6.9, longitude: 79.8 });
  expect(socket.emit).toHaveBeenCalledWith(
    'collector_location_updated',
    expect.objectContaining({ collectorId: resourceId })
  );
});
it('rechecks record ownership on delivery even after subscription', async () => {
  ownsResource = false;
  await emitPickupStatusUpdate(resourceId, { status: 'IN_TRANSIT' });
  expect(socket.emit).not.toHaveBeenCalledWith('pickup_status_changed', expect.anything());
  expect(socket.leave).toHaveBeenCalledWith(`pickup:${resourceId}`);
});
it.each(['SUSPENDED', 'PENDING_VERIFICATION'] as AccountStatus[])(
  'stops existing deliveries after state becomes %s',
  async (status) => {
    ownsResource = true;
    account.status = status;
    await emitPickupStatusUpdate(resourceId, { status: 'IN_TRANSIT' });
    expect(socket.emit).not.toHaveBeenCalledWith('pickup_status_changed', expect.anything());
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  }
);
it('stops existing deliveries after token revocation', async () => {
  ownsResource = true;
  account.token_version = 1;
  await emitPickupStatusUpdate(resourceId, { status: 'IN_TRANSIT' });
  expect(socket.emit).not.toHaveBeenCalledWith('pickup_status_changed', expect.anything());
  expect(socket.disconnect).toHaveBeenCalledWith(true);
});
