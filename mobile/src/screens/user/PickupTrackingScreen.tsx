import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  SafeMapView as MapView,
  SafeMarker as Marker,
  SafePolyline as Polyline,
} from '../../components/common/SafeMapView';
import { colors } from '../../theme/colors';
import { StatusBadge } from '../../components/status/StatusBadge';
import { ProgressTracker } from '../../components/status/ProgressTracker';
import { useSocket } from '../../hooks/useSocket';
import { pickupService } from '../../services/pickup.service';
import { PickupRequest } from '../../types/collector';

const { width } = Dimensions.get('window');

interface RouteParams {
  pickupId?: string;
}

export default function PickupTrackingScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const params = (route.params as RouteParams) || {};

  const [pickup, setPickup] = useState<PickupRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collectorCoords, setCollectorCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const mapRef = useRef<any>(null);
  const { isConnected, subscribeToPickup, subscribeToCollectorLocation } = useSocket({
    autoConnect: true,
  });

  const loadPickupData = useCallback(async (targetId?: string) => {
    try {
      let idToFetch = targetId;

      if (!idToFetch) {
        // If no ID passed in params, find user's latest active pickup
        const myPickups = await pickupService.getMyPickups();
        if (myPickups && myPickups.length > 0) {
          const active = myPickups.find(
            (p) => p.status === 'IN_TRANSIT' || p.status === 'ACCEPTED' || p.status === 'PENDING'
          );
          idToFetch = (active || myPickups[0]).id;
        }
      }

      if (idToFetch) {
        const details = await pickupService.getPickupById(idToFetch);
        setPickup(details);

        // Center map to pickup coords
        if (details.latitude && details.longitude && mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: Number(details.latitude),
            longitude: Number(details.longitude),
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          });
        }
      } else {
        setPickup(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load pickup request tracking details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPickupData(params.pickupId);
  }, [params.pickupId, loadPickupData]);

  // Handle live WebSocket events for this pickup and its assigned collector
  useEffect(() => {
    if (!pickup?.id) return;

    // 1. Subscribe to status transitions (PENDING -> ACCEPTED -> IN_TRANSIT -> COMPLETED)
    const unsubscribeStatus = subscribeToPickup(pickup.id, (payload) => {
      setPickup((prev) => (prev ? { ...prev, status: payload.status as any } : null));

      // Reload full record if collector was just assigned or status shifted
      loadPickupData(pickup.id);
    });

    // 2. Subscribe to driver live GPS updates if a collector is assigned
    const collectorId = pickup.allocation?.collector_id;
    let unsubscribeLocation: (() => void) | undefined;

    if (collectorId) {
      unsubscribeLocation = subscribeToCollectorLocation(collectorId, (location) => {
        const newCoords = {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
        };
        setCollectorCoords(newCoords);

        // Fit map bounds to show both user and collector
        if (pickup.latitude && pickup.longitude && mapRef.current) {
          mapRef.current.fitToCoordinates(
            [
              { latitude: Number(pickup.latitude), longitude: Number(pickup.longitude) },
              newCoords,
            ],
            {
              edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
              animated: true,
            }
          );
        }
      });
    }

    return () => {
      unsubscribeStatus();
      if (unsubscribeLocation) {
        unsubscribeLocation();
      }
    };
  }, [pickup?.id, pickup?.allocation?.collector_id, subscribeToPickup, subscribeToCollectorLocation, loadPickupData]);

  const handleCallCollector = () => {
    const phone = pickup?.allocation?.collector_phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Contact Collector', 'Phone number not available for this collector.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPickupData(pickup?.id || params.pickupId);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Connecting to live tracking...</Text>
      </View>
    );
  }

  if (!pickup) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No Active Pickup Request</Text>
        <Text style={styles.emptySubtitle}>
          You do not have any ongoing waste collection requests to track right now.
        </Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Categories')}
        >
          <Text style={styles.actionBtnText}>Request a Pickup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pickupLat = Number(pickup.latitude) || 6.9271;
  const pickupLng = Number(pickup.longitude) || 79.8612;
  const hasCollector = Boolean(pickup.allocation?.collector_id);
  const collector = pickup.allocation;

  return (
    <View style={styles.container}>
      {/* Real-time connection badge */}
      <View style={styles.socketStatusHeader}>
        <View style={styles.socketIndicatorRow}>
          <View
            style={[
              styles.socketDot,
              { backgroundColor: isConnected ? colors.success : colors.error },
            ]}
          />
          <Text style={styles.socketStatusText}>
            {isConnected ? 'Real-Time Sync Active' : 'Connecting to Server...'}
          </Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Text style={styles.refreshBtnText}>{refreshing ? 'Updating...' : '↻ Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={[styles.map, styles.webMapPlaceholder]}>
            <View style={styles.webRadarPing}>
              <Text style={{ fontSize: 32 }}>📡</Text>
            </View>
            <Text style={styles.webMapTitle}>Live GPS Telemetry Active</Text>
            <Text style={styles.webMapCoords}>
              Target: {pickupLat.toFixed(4)}°N, {pickupLng.toFixed(4)}°E
            </Text>
            {collectorCoords ? (
              <Text style={styles.webMapCollector}>
                🚛 Collector: {collectorCoords.latitude.toFixed(4)}°N, {collectorCoords.longitude.toFixed(4)}°E
              </Text>
            ) : (
              <Text style={styles.webMapWaiting}>Waiting for hauler telemetry...</Text>
            )}
            <TouchableOpacity
              style={styles.webExternalMapBtn}
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=${pickupLat},${pickupLng}`
                )
              }
            >
              <Text style={styles.webExternalMapText}>View on External Map ↗</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: pickupLat,
              longitude: pickupLng,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
          >
            {/* Pickup location pin */}
            <Marker
              coordinate={{ latitude: pickupLat, longitude: pickupLng }}
              title="Pickup Location"
              description={pickup.address_text}
            >
              <View style={styles.pickupMarker}>
                <Text style={styles.markerEmoji}>📍</Text>
              </View>
            </Marker>

            {/* Collector vehicle live pin */}
            {collectorCoords && (
              <Marker
                coordinate={collectorCoords}
                title={collector?.collector_name || 'Assigned Collector'}
                description="Collector Vehicle"
              >
                <View style={styles.collectorMarker}>
                  <Text style={styles.markerEmoji}>🚛</Text>
                </View>
              </Marker>
            )}

            {/* Line connecting user and collector */}
            {collectorCoords && (
              <Polyline
                coordinates={[
                  { latitude: pickupLat, longitude: pickupLng },
                  collectorCoords,
                ]}
                strokeColor={colors.primary}
                strokeWidth={3}
                lineDashPattern={[6, 4]}
              />
            )}
          </MapView>
        )}
      </View>

      {/* Details & Status Bottom Sheet */}
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dragHandle} />

        {/* Order Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.wasteTypeTitle}>{pickup.waste_type} Pickup</Text>
            <Text style={styles.orderIdText}>Order #{pickup.id.slice(0, 8)}</Text>
          </View>
          <StatusBadge status={pickup.status} />
        </View>

        {/* Progress Tracker */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Collection Progress</Text>
          <ProgressTracker currentStatus={pickup.status} />
        </View>

        {/* Collector Information Card (if assigned) */}
        {hasCollector ? (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Assigned Collector</Text>
            <View style={styles.collectorInfoRow}>
              <View style={styles.collectorAvatar}>
                <Text style={styles.collectorAvatarText}>
                  {collector?.collector_name?.charAt(0) || 'C'}
                </Text>
              </View>
              <View style={styles.collectorDetails}>
                <Text style={styles.collectorName}>
                  {collector?.collector_name || 'EcoNexus Verified Collector'}
                </Text>
                <Text style={styles.collectorSub}>
                  {collectorCoords ? '📍 Live location tracked' : 'En route to your location'}
                </Text>
              </View>
              {collector?.collector_phone && (
                <TouchableOpacity style={styles.callBtn} onPress={handleCallCollector}>
                  <Text style={styles.callBtnEmoji}>📞</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.searchingCard}>
            <ActivityIndicator size="small" color={colors.warning} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.searchingTitle}>Searching for Nearby Collector</Text>
              <Text style={styles.searchingSub}>
                We are matching your request with active verified collectors in your area.
              </Text>
            </View>
          </View>
        )}

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Pickup Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{pickup.address_text}</Text>
          </View>

          {pickup.estimated_weight ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Est. Weight</Text>
              <Text style={styles.detailValue}>{pickup.estimated_weight} kg</Text>
            </View>
          ) : null}

          {pickup.scheduled_time ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Scheduled For</Text>
              <Text style={styles.detailValue}>
                {new Date(pickup.scheduled_time).toLocaleString()}
              </Text>
            </View>
          ) : null}

          {pickup.notes ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{pickup.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Back navigation button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#64748B',
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  actionBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  socketStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: Platform.OS === 'ios' ? 44 : 10,
  },
  socketIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socketDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  socketStatusText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  refreshBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshBtnText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  mapContainer: {
    height: 260,
    width: width,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  pickupMarker: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#059669',
  },
  collectorMarker: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D97706',
  },
  markerEmoji: {
    fontSize: 20,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
  },
  sheetContent: {
    padding: 16,
    paddingBottom: 36,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  wasteTypeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderIdText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  collectorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  collectorAvatarText: {
    color: '#059669',
    fontSize: 18,
    fontWeight: 'bold',
  },
  collectorDetails: {
    flex: 1,
  },
  collectorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  collectorSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: '#ECFDF5',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  callBtnEmoji: {
    fontSize: 18,
  },
  searchingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  searchingTitle: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '700',
  },
  searchingSub: {
    color: '#78350F',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  backButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  backButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  webMapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    margin: 16,
    borderRadius: 18,
  },
  webRadarPing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  webMapTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  webMapCoords: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 2,
    fontWeight: '600',
  },
  webMapCollector: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
    marginTop: 4,
  },
  webMapWaiting: {
    fontSize: 11.5,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  webExternalMapBtn: {
    marginTop: 12,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  webExternalMapText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
