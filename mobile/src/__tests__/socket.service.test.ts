import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { socketService } from '../services/socket.service';
import { tokenStorage } from '../services/tokenStorage';
import { io } from 'socket.io-client';

jest.mock('../services/tokenStorage', () => ({
  tokenStorage: {
    getAccessToken: jest.fn(),
  },
}));

jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

describe('socketService', () => {
  let mockSocket: any;

  beforeEach(() => {
    socketService.disconnect();
    jest.clearAllMocks();

    mockSocket = {
      connected: true,
      id: 'mock-socket-id',
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    (io as jest.Mock).mockReturnValue(mockSocket);
    (tokenStorage.getAccessToken as jest.Mock).mockResolvedValue('test-jwt-token' as never);
  });

  it('connects with authentication token and configured transport options', async () => {
    const socket = await socketService.connect();

    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        transports: ['websocket', 'polling'],
        auth: { token: 'test-jwt-token' },
      })
    );
    expect(socket).toBe(mockSocket);
  });

  it('emits join_pickup and leave_pickup events to the server', async () => {
    await socketService.connect();

    socketService.joinPickup('pickup-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('join_pickup', 'pickup-123');

    socketService.leavePickup('pickup-123');
    expect(mockSocket.emit).toHaveBeenCalledWith('leave_pickup', 'pickup-123');
  });

  it('emits join_collector and collector_online events', async () => {
    await socketService.connect();

    socketService.joinCollector('collector-456');
    expect(mockSocket.emit).toHaveBeenCalledWith('join_collector', 'collector-456');

    socketService.joinAvailablePool();
    expect(mockSocket.emit).toHaveBeenCalledWith('collector_online');
  });

  it('registers pickup_status_changed listener and unsubscribes cleanly', async () => {
    await socketService.connect();
    const handler = jest.fn();

    const unsubscribe = socketService.onPickupStatusChanged(handler);
    expect(mockSocket.on).toHaveBeenCalledWith('pickup_status_changed', handler);

    unsubscribe();
    expect(mockSocket.off).toHaveBeenCalledWith('pickup_status_changed', handler);
  });

  it('registers collector_location_updated listener and unsubscribes cleanly', async () => {
    await socketService.connect();
    const handler = jest.fn();

    const unsubscribe = socketService.onCollectorLocationUpdated(handler);
    expect(mockSocket.on).toHaveBeenCalledWith('collector_location_updated', handler);

    unsubscribe();
    expect(mockSocket.off).toHaveBeenCalledWith('collector_location_updated', handler);
  });
});

