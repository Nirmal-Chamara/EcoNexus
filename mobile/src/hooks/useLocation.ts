import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UseLocationOptions {
  enableWatch?: boolean;
  accuracy?: Location.Accuracy;
  distanceInterval?: number; // In meters
  timeInterval?: number;     // In milliseconds
}

export function useLocation(options: UseLocationOptions = {}) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      if (!granted) {
        setError('Location permission denied');
      }
      return granted;
    } catch (e: any) {
      setError(e?.message || 'Error requesting location permission');
      setHasPermission(false);
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<Coordinates | null> => {
    setLoading(true);
    setError(null);
    try {
      const granted = hasPermission ?? (await requestPermission());
      if (!granted) {
        setLoading(false);
        return null;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: options.accuracy || Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setLocation(coords);
      return coords;
    } catch (e: any) {
      setError(e?.message || 'Failed to acquire current location');
      return null;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, options.accuracy, requestPermission]);

  const reverseGeocode = useCallback(
    async (coords: Coordinates): Promise<string | null> => {
      try {
        const places = await Location.reverseGeocodeAsync(coords);
        if (places && places.length > 0) {
          const p = places[0];
          const formatted = [
            p.streetNumber,
            p.street,
            p.subregion || p.city,
            p.region,
          ]
            .filter(Boolean)
            .join(', ');

          const resolvedAddress = formatted || p.name || 'Unknown Address';
          setAddress(resolvedAddress);
          return resolvedAddress;
        }
        return null;
      } catch {
        return null;
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const granted = await requestPermission();
      if (!granted || !isMounted) return;

      const coords = await getCurrentLocation();
      if (coords && isMounted) {
        reverseGeocode(coords);
      }

      if (options.enableWatch && isMounted) {
        watchSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: options.accuracy || Location.Accuracy.Balanced,
            distanceInterval: options.distanceInterval || 10,
            timeInterval: options.timeInterval || 5000,
          },
          (loc) => {
            if (isMounted) {
              setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
            }
          }
        );
      }
    }

    init();

    return () => {
      isMounted = false;
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
    };
  }, [options.enableWatch, options.accuracy, options.distanceInterval, options.timeInterval, requestPermission, getCurrentLocation, reverseGeocode]);

  return {
    location,
    address,
    hasPermission,
    loading,
    error,
    requestPermission,
    getCurrentLocation,
    reverseGeocode,
  };
}

