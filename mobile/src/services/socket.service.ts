import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { tokenStorage } from './tokenStorage';
import { apiClient } from './api';

export interface LocationPayload {
  collectorId: string;
  latitude: number;
  longitude: number;
}

export interface PickupStatusPayload {
  pickupId: string;
  status: string;
  collectorId?: string;
  updatedAt?: string;
  [key: string]: any;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;
  private recoveryAttempted = false;
  private pickupRooms = new Set<string>();
  private collectorRooms = new Set<string>();
  private availablePool = false;

  /**
   * Initialize or retrieve the active Socket.IO connection.
   */
  async connect(): Promise<Socket> {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket && !this.socket.connected && this.isConnecting) {
      return this.socket;
    }

    this.isConnecting = true;
    this.socket = io(env.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Re-read the access token on every handshake, including reconnects.
      auth: (callback) => {
        void tokenStorage.getAccessToken().then(
          (token) => callback(token ? { token } : {}),
          () => callback({})
        );
      },
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.recoveryAttempted = false;
      for (const id of this.pickupRooms) this.socket?.emit('join_pickup', id);
      for (const id of this.collectorRooms) this.socket?.emit('join_collector', id);
      if (this.availablePool) this.socket?.emit('collector_online');
      if (__DEV__) {
        console.log(`[Socket] Connected to ${env.SOCKET_URL} (${this.socket?.id})`);
      }
    });

    const recoverSession = (code?: string) => {
      if (code === 'TOKEN_EXPIRED' && !this.recoveryAttempted) {
        this.recoveryAttempted = true;
        const currentSocket = this.socket;
        // The shared API interceptor performs rotation once. Never create a
        // separate socket refresh-token implementation or retry a revoked login.
        void apiClient
          .get('/users/me')
          .then(() => {
            if (currentSocket && this.socket === currentSocket) currentSocket.connect();
          })
          .catch(() => {});
      }
    };
    this.socket.on('session_error', (error: { code?: string }) => recoverSession(error.code));
    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      recoverSession((error as Error & { data?: { code?: string } }).data?.code);
      if (__DEV__) {
        console.warn('[Socket] Connection error:', error.message);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      if (__DEV__) {
        console.log('[Socket] Disconnected:', reason);
      }
    });

    return this.socket;
  }

  /**
   * Gracefully disconnect the socket
   */
  disconnect(): void {
    this.isConnecting = false;
    this.recoveryAttempted = false;
    this.pickupRooms.clear();
    this.collectorRooms.clear();
    this.availablePool = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  /**
   * Return current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return Boolean(this.socket?.connected);
  }

  /**
   * Subscribe customer to a specific pickup request room
   */
  joinPickup(pickupId: string): void {
    this.pickupRooms.add(pickupId);
    if (this.socket?.connected) {
      this.socket.emit('join_pickup', pickupId);
    }
  }

  /**
   * Unsubscribe from a pickup request room
   */
  leavePickup(pickupId: string): void {
    this.pickupRooms.delete(pickupId);
    if (this.socket?.connected) {
      this.socket.emit('leave_pickup', pickupId);
    }
  }

  /**
   * Subscribe to real-time live location updates of a specific collector
   */
  joinCollector(collectorId: string): void {
    this.collectorRooms.add(collectorId);
    if (this.socket?.connected) {
      this.socket.emit('join_collector', collectorId);
    }
  }

  /**
   * Collectors join the available broadcast pool
   */
  joinAvailablePool(): void {
    this.availablePool = true;
    if (this.socket?.connected) {
      this.socket.emit('collector_online');
    }
  }

  /**
   * Listen for pickup status updates
   */
  onPickupStatusChanged(callback: (payload: PickupStatusPayload) => void): () => void {
    if (!this.socket) {
      this.connect().then((sock) => sock.on('pickup_status_changed', callback));
    } else {
      this.socket.on('pickup_status_changed', callback);
    }

    return () => {
      this.socket?.off('pickup_status_changed', callback);
    };
  }

  /**
   * Listen for live collector vehicle GPS location updates
   */
  onCollectorLocationUpdated(callback: (payload: LocationPayload) => void): () => void {
    if (!this.socket) {
      this.connect().then((sock) => sock.on('collector_location_updated', callback));
    } else {
      this.socket.on('collector_location_updated', callback);
    }

    return () => {
      this.socket?.off('collector_location_updated', callback);
    };
  }

  /**
   * Listen for new pickup requests (broadcast to online collectors)
   */
  onNewPickupRequest(callback: (payload: any) => void): () => void {
    if (!this.socket) {
      this.connect().then((sock) => sock.on('new_pickup_request', callback));
    } else {
      this.socket.on('new_pickup_request', callback);
    }

    return () => {
      this.socket?.off('new_pickup_request', callback);
    };
  }
}

export const socketService = new SocketService();
