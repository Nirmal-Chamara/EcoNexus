import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapView: any = React.forwardRef((props: any, ref: any) => {
  return (
    <View style={[styles.mapContainer, props.style]}>
      {props.children}
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>🗺️ Map View (Interactive GPS active on mobile)</Text>
      </View>
    </View>
  );
});

export const Marker: any = ({ children, title }: any) => (
  <View style={styles.marker}>
    {children || <Text style={styles.markerText}>📍 {title || ''}</Text>}
  </View>
);

export const Polyline: any = () => null;
export const Polygon: any = () => null;
export const Circle: any = () => null;
export const Callout: any = ({ children }: any) => <View>{children}</View>;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 180,
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  overlayText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    fontSize: 14,
  },
});

export default MapView;
