import { useEffect, useState, useCallback, useRef } from 'react';
import {
  socketService,
  LocationPayload,
  PickupStatusPayload,
} from '../services/socket.service';

interface UseSocketOptions {
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = { autoConnect: true }) {
  const [isConnected, setIsConnected] = useState(socketService.isConnected());
  const listenersRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    let isMounted = true;

    if (options.autoConnect) {
      socketService.connect().then((sock) => {
        if (!isMounted) return;
        setIsConnected(sock.connected);

        const onConnect = () => isMounted && setIsConnected(true);
        const onDisconnect = () => isMounted && setIsConnected(false);

        sock.on('connect', onConnect);
        sock.on('disconnect', onDisconnect);

        listenersRef.current.push(() => {
          sock.off('connect', onConnect);
          sock.off('disconnect', onDisconnect);
        });
      });
    }

    return () => {
      isMounted = false;
      listenersRef.current.forEach((cleanup) => cleanup());
      listenersRef.current = [];
    };
  }, [options.autoConnect]);

  const joinPickup = useCallback((pickupId: string) => {
    socketService.joinPickup(pickupId);
  }, []);

  const leavePickup = useCallback((pickupId: string) => {
    socketService.leavePickup(pickupId);
  }, []);

  const joinCollector = useCallback((collectorId: string) => {
    socketService.joinCollector(collectorId);
  }, []);

  const subscribeToPickup = useCallback(
    (pickupId: string, onStatusChange: (payload: PickupStatusPayload) => void) => {
      joinPickup(pickupId);
      const unsubscribe = socketService.onPickupStatusChanged((payload) => {
        if (payload.pickupId === pickupId) {
          onStatusChange(payload);
        }
      });

      return () => {
        unsubscribe();
        leavePickup(pickupId);
      };
    },
    [joinPickup, leavePickup]
  );

  const subscribeToCollectorLocation = useCallback(
    (collectorId: string, onLocationChange: (payload: LocationPayload) => void) => {
      joinCollector(collectorId);
      const unsubscribe = socketService.onCollectorLocationUpdated((payload) => {
        if (payload.collectorId === collectorId) {
          onLocationChange(payload);
        }
      });

      return () => {
        unsubscribe();
      };
    },
    [joinCollector]
  );

  return {
    isConnected,
    socket: socketService.getSocket(),
    connect: socketService.connect.bind(socketService),
    disconnect: socketService.disconnect.bind(socketService),
    joinPickup,
    leavePickup,
    joinCollector,
    subscribeToPickup,
    subscribeToCollectorLocation,
  };
}

