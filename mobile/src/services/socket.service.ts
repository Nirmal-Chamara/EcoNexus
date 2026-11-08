import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { tokenStorage } from './tokenStorage';

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
    const token = await tokenStorage.getAccessToken();

    this.socket = io(env.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: token ? { token } : undefined,
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      if (__DEV__) {
        console.log(`[Socket] Connected to ${env.SOCKET_URL} (${this.socket?.id})`);
      }
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
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
    if (this.socket?.connected) {
      this.socket.emit('join_pickup', pickupId);
    }
  }

  /**
   * Unsubscribe from a pickup request room
   */
  leavePickup(pickupId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_pickup', pickupId);
    }
  }

  /**
   * Subscribe to real-time live location updates of a specific collector
   */
  joinCollector(collectorId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_collector', collectorId);
    }
  }

  /**
   * Collectors join the available broadcast pool
   */
  joinAvailablePool(): void {
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

