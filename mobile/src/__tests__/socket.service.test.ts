import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { socketService } from '../services/socket.service';
import { tokenStorage } from '../services/tokenStorage';
import { io } from 'socket.io-client';
import { apiClient } from '../services/api';

jest.mock('../services/api', () => ({ apiClient: { get: jest.fn() } }));

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
      connect: jest.fn(),
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
        auth: expect.any(Function),
      })
    );
    expect(socket).toBe(mockSocket);
    const auth = (
      (io as jest.Mock).mock.calls[0][1] as {
        auth: (callback: (credentials: unknown) => void) => void;
      }
    ).auth;
    const callback = jest.fn();
    auth(callback);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledWith({ token: 'test-jwt-token' });
  });

  it('re-reads rotated access tokens on a subsequent handshake', async () => {
    await socketService.connect();
    const auth = (
      (io as jest.Mock).mock.calls[0][1] as {
        auth: (callback: (credentials: unknown) => void) => void;
      }
    ).auth;
    (tokenStorage.getAccessToken as jest.Mock).mockResolvedValue('rotated-token' as never);
    const callback = jest.fn();
    auth(callback);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledWith({ token: 'rotated-token' });
  });

  it('recovers an expired token through the shared API session once', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({} as never);
    await socketService.connect();
    const handler = mockSocket.on.mock.calls.find(
      ([event]: [string]) => event === 'connect_error'
    )[1];
    handler({ message: 'expired', data: { code: 'TOKEN_EXPIRED' } });
    handler({ message: 'expired', data: { code: 'TOKEN_EXPIRED' } });
    await Promise.resolve();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith('/users/me');
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });

  it('does not retry suspended or revoked credentials through socket refresh', async () => {
    await socketService.connect();
    const handler = mockSocket.on.mock.calls.find(
      ([event]: [string]) => event === 'connect_error'
    )[1];
    handler({ message: 'revoked', data: { code: 'TOKEN_REVOKED' } });
    handler({ message: 'disabled', data: { code: 'ACCOUNT_DISABLED' } });
    expect(apiClient.get).not.toHaveBeenCalled();
    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it('recovers expiry reported during an existing subscription', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({} as never);
    await socketService.connect();
    const handler = mockSocket.on.mock.calls.find(
      ([event]: [string]) => event === 'session_error'
    )[1];
    handler({ code: 'TOKEN_EXPIRED' });
    await Promise.resolve();
    expect(apiClient.get).toHaveBeenCalledWith('/users/me');
    expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  });

  it('restores subscriptions on reconnect and clears them on explicit disconnect', async () => {
    await socketService.connect();
    socketService.joinPickup('retained');
    socketService.joinPickup('removed');
    socketService.leavePickup('removed');
    socketService.joinCollector('collector');
    socketService.joinAvailablePool();
    mockSocket.emit.mockClear();
    const reconnect = mockSocket.on.mock.calls.find(([event]: [string]) => event === 'connect')[1];
    reconnect();
    expect(mockSocket.emit).toHaveBeenCalledWith('join_pickup', 'retained');
    expect(mockSocket.emit).not.toHaveBeenCalledWith('join_pickup', 'removed');
    expect(mockSocket.emit).toHaveBeenCalledWith('join_collector', 'collector');
    expect(mockSocket.emit).toHaveBeenCalledWith('collector_online');
    socketService.disconnect();
    await socketService.connect();
    mockSocket.emit.mockClear();
    reconnect();
    expect(mockSocket.emit).not.toHaveBeenCalled();
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
