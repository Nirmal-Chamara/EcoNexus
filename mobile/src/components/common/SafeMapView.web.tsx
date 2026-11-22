import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

export interface SafeMarkerProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function SafeMarker({ children, title, coordinate }: SafeMarkerProps) {
  return (
    <View style={styles.webMarker}>
      {children || <Text style={styles.defaultPin}>📍</Text>}
      {title && <Text style={styles.markerTitle}>{title}</Text>}
    </View>
  );
}

export function SafePolyline(_props: any) {
  return null;
}

export interface SafeMapViewProps {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  children?: React.ReactNode;
}

export const SafeMapView = React.forwardRef<any, SafeMapViewProps>(
  ({ style, initialRegion, children }, _ref) => {
    const lat = initialRegion?.latitude || 6.6828;
    const lng = initialRegion?.longitude || 80.3992;

    const openInMaps = () => {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      Linking.openURL(url).catch(() => {});
    };

    return (
      <View style={[styles.mapContainer, style]}>
        {/* Stylized Web GPS Map Canvas */}
        <View style={styles.gridBackground}>
          <View style={styles.radarRing1} />
          <View style={styles.radarRing2} />
          <View style={styles.routeLine} />

          {/* Children Markers */}
          <View style={styles.markersContainer}>{children}</View>
        </View>

        {/* GPS Control Pill */}
        <TouchableOpacity style={styles.openBtn} onPress={openInMaps}>
          <Text style={styles.openBtnText}>
            🗺️ Interactive Satellite GPS ({lat.toFixed(4)}°, {lng.toFixed(4)}°) ↗
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
);

SafeMapView.displayName = 'SafeMapView';

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: '#064E3B',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: 'rgba(163, 230, 53, 0.25)',
  },
  radarRing2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.15)',
  },
  routeLine: {
    position: 'absolute',
    width: '60%',
    height: 2,
    backgroundColor: '#A3E635',
    transform: [{ rotate: '25deg' }],
    opacity: 0.8,
  },
  markersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    zIndex: 10,
  },
  webMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultPin: {
    fontSize: 24,
  },
  markerTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  openBtn: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  openBtnText: {
    color: '#064E3B',
    fontSize: 11,
    fontWeight: '800',
  },
});
