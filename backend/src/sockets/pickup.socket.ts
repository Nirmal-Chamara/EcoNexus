import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

export function registerPickupSocket(io: Server) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    // Join room for a specific pickup request (user tracks their pickup)
    socket.on('join_pickup', (pickupId: string) => {
      socket.join(`pickup:${pickupId}`);
    });

    // Join room for collector tracking
    socket.on('join_collector', (collectorId: string) => {
      socket.join(`collector:${collectorId}`);
    });

    // Collectors join the available pool to receive broadcasts
    socket.on('collector_online', () => {
      socket.join('collectors_available');
    });

    socket.on('leave_pickup', (pickupId: string) => {
      socket.leave(`pickup:${pickupId}`);
    });
  });
}

/**
 * Emit event to all online collectors
 */
export function emitToNearbyCollectors(event: string, payload: any) {
  if (ioInstance) {
    ioInstance.to('collectors_available').emit(event, payload);
  }
}

/**
 * Emit pickup status change to users tracking this pickup
 */
export function emitPickupStatusUpdate(pickupId: string, payload: any) {
  if (ioInstance) {
    ioInstance.to(`pickup:${pickupId}`).emit('pickup_status_changed', {
      pickupId,
      ...payload,
    });
  }
}

/**
 * Emit live location of collector to subscribers
 */
export function emitCollectorLocation(
  collectorId: string,
  location: { latitude: number; longitude: number }
) {
  if (ioInstance) {
    ioInstance.to(`collector:${collectorId}`).emit('collector_location_updated', {
      collectorId,
      ...location,
    });
  }
}