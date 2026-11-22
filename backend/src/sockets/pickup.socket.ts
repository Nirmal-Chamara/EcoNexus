import { Server, Socket } from 'socket.io';
import {
  authenticateAccessToken,
  assertActive,
} from '../services/access.service';
import {
  authorizeSubscription,
  SubscriptionKind,
} from '../services/socket-access.service';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

let ioInstance: Server | null = null;

export function registerPickupSocket(io: Server) {
  ioInstance = io;
  io.use(async (socket, next) => {
    try {
      assertActive(await authenticateAccessToken(socket.handshake.auth?.token));
      next();
    } catch (error) {
      const failure = new Error(
        'Live update authentication failed'
      ) as Error & { data?: unknown };
      failure.data = publicError(error);
      next(failure);
    }
  });

  io.on('connection', (socket: Socket) => {
    function subscribe(event: string, kind: SubscriptionKind, prefix: string) {
      socket.on(event, async (id?: unknown) => {
        try {
          await authorizeSubscription(socket.handshake.auth?.token, kind, id);
          if (socket.connected)
            await socket.join(
              kind === 'available' ? prefix : `${prefix}:${id}`
            );
        } catch (error) {
          socket.emit('subscription_error', publicError(error));
        }
      });
    }
    subscribe('join_pickup', 'pickup', 'pickup');
    subscribe('join_collector', 'collector', 'collector');
    subscribe('collector_online', 'available', 'collectors_available');

    socket.on('leave_pickup', (pickupId: unknown) => {
      if (typeof pickupId === 'string') void socket.leave(`pickup:${pickupId}`);
    });
  });
}

function publicError(error: unknown) {
  return error instanceof AppError
    ? { code: error.code, message: error.message }
    : {
        code: 'SUBSCRIPTION_FAILED',
        message: 'Unable to authorize live updates',
      };
}

async function deliver(
  room: string,
  kind: SubscriptionKind,
  id: string | undefined,
  event: string,
  payload: unknown
): Promise<void> {
  if (!ioInstance) return;
  try {
    const sockets = await ioInstance.in(room).fetchSockets();
    await Promise.all(
      sockets.map(async (socket) => {
        try {
          await authorizeSubscription(socket.handshake.auth?.token, kind, id);
          socket.emit(event, payload);
        } catch (error) {
          // Recheck account, token version, expiry and ownership on each delivery.
          await socket.leave(room);
          if (
            error instanceof AppError &&
            [
              'TOKEN_EXPIRED',
              'TOKEN_REVOKED',
              'ACCOUNT_DISABLED',
              'ACCOUNT_NOT_ACTIVE',
              'EMAIL_VERIFICATION_REQUIRED',
            ].includes(error.code || '')
          ) {
            socket.emit('session_error', publicError(error));
            socket.disconnect(true);
          }
        }
      })
    );
  } catch {
    logger.error('Live update delivery failed');
  }
}

/**
 * Emit event to all online collectors
 */
export function emitToNearbyCollectors(event: string, payload: unknown) {
  return deliver(
    'collectors_available',
    'available',
    undefined,
    event,
    payload
  );
}

/**
 * Emit pickup status change to users tracking this pickup
 */
export function emitPickupStatusUpdate(
  pickupId: string,
  payload: Record<string, unknown>
) {
  return deliver(
    `pickup:${pickupId}`,
    'pickup',
    pickupId,
    'pickup_status_changed',
    { ...payload, pickupId }
  );
}

/**
 * Emit live location of collector to subscribers
 */
export function emitCollectorLocation(
  collectorId: string,
  location: { latitude: number; longitude: number }
) {
  return deliver(
    `collector:${collectorId}`,
    'collector',
    collectorId,
    'collector_location_updated',
    { ...location, collectorId }
  );
}
