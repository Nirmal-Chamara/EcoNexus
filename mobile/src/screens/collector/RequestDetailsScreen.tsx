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
  Platform,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import { colors } from '../../theme/colors';
import { pickupService } from '../../services/pickup.service';
import { collectorService } from '../../services/collector.service';
import { PickupRequest } from '../../types/collector';
import { StatusBadge } from '../../components/status/StatusBadge';
import { ProgressTracker } from '../../components/status/ProgressTracker';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

interface RouteParams {
  pickupId: string;
}

export default function RequestDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { pickupId } = (route.params as RouteParams) || {};

  const [pickup, setPickup] = useState<PickupRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [collectorLocation, setCollectorLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const mapRef = useRef<MapView | null>(null);

  const loadDetails = useCallback(async () => {
    if (!pickupId) return;
    try {
      const data = await pickupService.getPickupById(pickupId);
      setPickup(data);

      // Get collector's own current position to display on map
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCollectorLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        // Also ping backend with live location
        collectorService
          .updateLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          })
          .catch(() => {});
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not load pickup request details.');
    } finally {
      setLoading(false);
    }
  }, [pickupId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleOpenNavigation = () => {
    if (!pickup?.latitude || !pickup?.longitude) {
      Alert.alert('Navigation Error', 'Coordinates not available for this pickup.');
      return;
    }

    const lat = Number(pickup.latitude);
    const lng = Number(pickup.longitude);
    const label = encodeURIComponent(pickup.address_text || 'Pickup Location');

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    }) || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
      }
    });
  };

  const handleCallUser = () => {
    const phone = pickup?.user_phone || pickup?.allocation?.collector_phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Contact', 'No contact phone number provided by the user.');
    }
  };

  const handleStatusTransition = (nextStatus: 'IN_TRANSIT' | 'COMPLETED') => {
    if (!pickup) return;

    const actionText = nextStatus === 'IN_TRANSIT' ? 'Start Trip' : 'Complete Collection';
    const message =
      nextStatus === 'IN_TRANSIT'
        ? 'Notify customer that you are en route to the collection location?'
        : 'Confirm that all recyclable materials have been collected?';

    Alert.alert(actionText, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: 'default',
        onPress: async () => {
          try {
            setUpdating(true);
            await pickupService.updatePickupStatus(pickup.id, nextStatus);
            Alert.alert('Status Updated', `Pickup order marked as ${nextStatus.replace('_', ' ')}.`);
            loadDetails();
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to update pickup status.');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.roleCollector} />
        <Text style={styles.loadingText}>Loading pickup order...</Text>
      </View>
    );
  }

  if (!pickup) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>Pickup Request Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pickupLat = Number(pickup.latitude) || 6.9271;
  const pickupLng = Number(pickup.longitude) || 79.8612;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{pickup.id.slice(0, 8)}</Text>
        <StatusBadge status={pickup.status} size="small" />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        {/* Map Preview */}
        <View style={styles.mapCard}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: pickupLat,
              longitude: pickupLng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            {/* Pickup Marker */}
            <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }} title="Pickup Location">
              <View style={styles.pickupPin}>
                <Text style={styles.pinText}>📍</Text>
              </View>
            </Marker>

            {/* Collector Live Location */}
            {collectorLocation && (
              <Marker coordinate={collectorLocation} title="Your Vehicle">
                <View style={styles.collectorPin}>
                  <Text style={styles.pinText}>🚛</Text>
                </View>
              </Marker>
            )}
          </MapView>

          <TouchableOpacity style={styles.navOverlayBtn} onPress={handleOpenNavigation}>
            <Text style={styles.navOverlayText}>🗺️ Open in GPS Navigation</Text>
          </TouchableOpacity>
        </View>

        {/* Status Lifecycle Progress */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Lifecycle Progress</Text>
          <ProgressTracker currentStatus={pickup.status} />
        </View>

        {/* Customer Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Customer Details</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {pickup.user_name?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{pickup.user_name || 'Household Citizen'}</Text>
              <Text style={styles.customerPhone}>{pickup.user_phone || 'No phone provided'}</Text>
            </View>
            {pickup.user_phone && (
              <TouchableOpacity style={styles.callCircleBtn} onPress={handleCallUser}>
                <Text style={styles.callCircleText}>📞</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Pickup Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Collection Specs</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Waste Category</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{pickup.waste_type}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup Address</Text>
            <Text style={styles.detailValue}>{pickup.address_text}</Text>
          </View>

          {pickup.estimated_weight ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estimated Weight</Text>
              <Text style={styles.detailValue}>{pickup.estimated_weight} kg</Text>
            </View>
          ) : null}

          {pickup.scheduled_time ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Scheduled Time</Text>
              <Text style={styles.detailValue}>
                {new Date(pickup.scheduled_time).toLocaleString()}
              </Text>
            </View>
          ) : null}

          {pickup.notes ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes from Citizen</Text>
              <Text style={styles.detailValue}>{pickup.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Buttons depending on State */}
        <View style={styles.actionContainer}>
          {pickup.status === 'ACCEPTED' && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.roleCollector }]}
              disabled={updating}
              onPress={() => handleStatusTransition('IN_TRANSIT')}
            >
              <Text style={styles.actionBtnText}>
                {updating ? 'Updating...' : 'Start Trip (En Route) 🚚'}
              </Text>
            </TouchableOpacity>
          )}

          {pickup.status === 'IN_TRANSIT' && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.success }]}
              disabled={updating}
              onPress={() => handleStatusTransition('COMPLETED')}
            >
              <Text style={styles.actionBtnText}>
                {updating ? 'Updating...' : 'Complete Collection ✓'}
              </Text>
            </TouchableOpacity>
          )}

          {pickup.status === 'COMPLETED' && (
            <View style={styles.completedNotice}>
              <Text style={styles.completedNoticeText}>
                ✓ This collection was completed successfully.
              </Text>
            </View>
          )}
        </View>
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
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBackBtn: {
    paddingVertical: 6,
    paddingRight: 10,
  },
  headerBackText: {
    color: colors.roleCollector,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  mapCard: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  pickupPin: {
    backgroundColor: colors.surface,
    padding: 6,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  collectorPin: {
    backgroundColor: colors.surface,
    padding: 6,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.roleCollector,
  },
  pinText: {
    fontSize: 18,
  },
  navOverlayBtn: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.roleCollector,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  navOverlayText: {
    color: colors.roleCollector,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customerAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  customerPhone: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  callCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  callCircleText: {
    fontSize: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  categoryBadge: {
    backgroundColor: '#071C0D',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  categoryBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  actionContainer: {
    marginTop: 8,
  },
  primaryActionBtn: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  completedNotice: {
    backgroundColor: colors.successSurface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.success,
    alignItems: 'center',
  },
  completedNoticeText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
});

