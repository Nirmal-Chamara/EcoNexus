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
import MapView, { Marker, Polyline } from 'react-native-maps';
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

  const mapRef = useRef<MapView | null>(null);
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
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: 15,
  },
  socketStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  refreshBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    height: 260,
    width: width,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  pickupMarker: {
    backgroundColor: colors.surface,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  collectorMarker: {
    backgroundColor: colors.surface,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  markerEmoji: {
    fontSize: 20,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.border,
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
    fontWeight: '700',
    color: colors.textPrimary,
  },
  orderIdText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  collectorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  collectorAvatarText: {
    color: colors.warning,
    fontSize: 18,
    fontWeight: 'bold',
  },
  collectorDetails: {
    flex: 1,
  },
  collectorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  collectorSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  callBtn: {
    backgroundColor: colors.surfaceAlt,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  callBtnEmoji: {
    fontSize: 18,
  },
  searchingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1607',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: 14,
  },
  searchingTitle: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  searchingSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
    maxWidth: '65%',
    textAlign: 'right',
  },
  backButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
