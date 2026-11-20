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
import Ionicons from '@expo/vector-icons/Ionicons';
import { pickupService } from '../../services/pickup.service';
import { collectorService } from '../../services/collector.service';
import { PickupRequest } from '../../types/collector';
import { StatusBadge } from '../../components/status/StatusBadge';
import { ProgressTracker } from '../../components/status/ProgressTracker';
import { onboardingTheme } from '../../theme/onboardingTheme';
import * as Location from 'expo-location';

// Dynamically import MapView only on native to prevent web crashes
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch {
    // Map fallback
  }
}

const { width } = Dimensions.get('window');

interface RouteParams {
  pickupId: string;
}

function getWasteBadgeInfo(type: string) {
  const norm = (type || '').toUpperCase();
  switch (norm) {
    case 'PLASTIC':
      return { label: 'Plastic', emoji: '🧴', bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
    case 'PAPER':
      return { label: 'Paper', emoji: '📄', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
    case 'CARDBOARD':
      return { label: 'Cardboard', emoji: '📦', bg: '#FEF9C3', text: '#A16207', border: '#FEF08A' };
    case 'METAL':
      return { label: 'Metal', emoji: '🥫', bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' };
    case 'GLASS':
      return { label: 'Glass', emoji: '🍾', bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
    case 'E_WASTE':
      return { label: 'E-Waste', emoji: '💻', bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
    case 'TEXTILES':
      return { label: 'Textiles', emoji: '👕', bg: '#FCE7F3', text: '#BE185D', border: '#FBCFE8' };
    default:
      return { label: type || 'Recyclable', emoji: '♻️', bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' };
  }
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

  const mapRef = useRef<any>(null);

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
      if (Platform.OS === 'web') {
        window.alert(e?.message || 'Could not load pickup request details.');
      } else {
        Alert.alert('Error', e?.message || 'Could not load pickup request details.');
      }
    } finally {
      setLoading(false);
    }
  }, [pickupId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleOpenNavigation = () => {
    if (!pickup?.latitude || !pickup?.longitude) {
      if (Platform.OS === 'web') {
        window.alert('Coordinates not available for this pickup.');
      } else {
        Alert.alert('Navigation Error', 'Coordinates not available for this pickup.');
      }
      return;
    }

    const lat = Number(pickup.latitude);
    const lng = Number(pickup.longitude);
    const label = encodeURIComponent(pickup.address_text || 'Pickup Location');

    const url =
      Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(${label})`,
      }) || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };

  const handleCallUser = () => {
    const phone = pickup?.user_phone || pickup?.allocation?.collector_phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      if (Platform.OS === 'web') {
        window.alert('No contact phone number provided by citizen.');
      } else {
        Alert.alert('Contact', 'No contact phone number provided by citizen.');
      }
    }
  };

  const handleStatusTransition = (nextStatus: 'IN_TRANSIT' | 'COMPLETED') => {
    if (!pickup) return;

    const actionText = nextStatus === 'IN_TRANSIT' ? 'Start Trip' : 'Complete Collection';
    const message =
      nextStatus === 'IN_TRANSIT'
        ? 'Notify customer that you are en route to the collection location?'
        : 'Confirm that all recyclable materials have been collected?';

    const executeTransition = async () => {
      try {
        setUpdating(true);
        await pickupService.updatePickupStatus(pickup.id, nextStatus);
        if (Platform.OS === 'web') {
          window.alert(`Pickup order marked as ${nextStatus.replace('_', ' ')}.`);
        } else {
          Alert.alert('Status Updated', `Pickup order marked as ${nextStatus.replace('_', ' ')}.`);
        }
        loadDetails();
      } catch (e: any) {
        if (Platform.OS === 'web') {
          window.alert(e?.message || 'Failed to update pickup status.');
        } else {
          Alert.alert('Error', e?.message || 'Failed to update pickup status.');
        }
      } finally {
        setUpdating(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${actionText}\n\n${message}`)) {
        executeTransition();
      }
    } else {
      Alert.alert(actionText, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'default', onPress: executeTransition },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading pickup order details...</Text>
      </View>
    );
  }

  if (!pickup) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📦</Text>
        <Text style={styles.emptyTitle}>Pickup Request Not Found</Text>
        <Text style={styles.emptySubtitle}>This request may have been claimed or removed.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Return to Requests</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pickupLat = Number(pickup.latitude) || 6.9271;
  const pickupLng = Number(pickup.longitude) || 79.8612;
  const badge = getWasteBadgeInfo(pickup.waste_type);

  return (
    <View style={styles.container}>
      {/* ── Top App Bar ────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
          <Text style={styles.headerBackText}>Requests</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>ORDER DISPATCH</Text>
          <Text style={styles.headerTitle}>#{pickup.id.slice(0, 8)}</Text>
        </View>
        <StatusBadge status={pickup.status} size="small" />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Map / GPS Card ─────────────────────────────────────── */}
        {Platform.OS !== 'web' && MapView ? (
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
              <Ionicons name="navigate" size={16} color="#059669" />
              <Text style={styles.navOverlayText}>Open in GPS Navigation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.webMapFallbackCard}>
            <View style={styles.webMapHeader}>
              <View style={styles.webGpsIcon}>
                <Ionicons name="location" size={22} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.webMapTitle}>GPS Destination Coordinates</Text>
                <Text style={styles.webMapCoords}>
                  Lat {pickupLat.toFixed(4)}°, Lng {pickupLng.toFixed(4)}°
                </Text>
              </View>
            </View>

            <View style={styles.webAddressRow}>
              <Text style={styles.webAddressLabel}>Address:</Text>
              <Text style={styles.webAddressValue}>{pickup.address_text || 'Coordinates available'}</Text>
            </View>

            <TouchableOpacity style={styles.webNavActionBtn} onPress={handleOpenNavigation}>
              <Ionicons name="navigate-outline" size={18} color="#FFFFFF" />
              <Text style={styles.webNavActionText}>Launch Turn-by-Turn GPS Directions</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Customer Details Card ──────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>CITIZEN CONTACT</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {pickup.user_name?.charAt(0).toUpperCase() || 'C'}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{pickup.user_name || 'Household Citizen'}</Text>
              <Text style={styles.customerPhone}>{pickup.user_phone || 'Phone verified on profile'}</Text>
            </View>
            {pickup.user_phone ? (
              <TouchableOpacity style={styles.callCircleBtn} onPress={handleCallUser}>
                <Ionicons name="call" size={18} color="#059669" />
                <Text style={styles.callCircleText}>Call</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* ── Collection Specs Card ──────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>COLLECTION MANIFEST &amp; SPECS</Text>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Category</Text>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: badge.bg, borderColor: badge.border },
              ]}
            >
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              <Text style={[styles.categoryBadgeText, { color: badge.text }]}>
                {badge.label}
              </Text>
            </View>
          </View>

          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Pickup Address</Text>
            <Text style={styles.specValueAddress}>{pickup.address_text}</Text>
          </View>

          {pickup.estimated_weight ? (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Estimated Weight</Text>
              <Text style={styles.specValueBold}>⚖️ {pickup.estimated_weight} kg</Text>
            </View>
          ) : null}

          {pickup.scheduled_time ? (
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Scheduled Window</Text>
              <Text style={styles.specValue}>
                {new Date(pickup.scheduled_time).toLocaleString()}
              </Text>
            </View>
          ) : null}

          {pickup.notes ? (
            <View style={styles.instructionsBox}>
              <View style={styles.instructionsHeader}>
                <Ionicons name="information-circle-outline" size={16} color="#059669" />
                <Text style={styles.instructionsTitle}>Citizen Instructions / Notes</Text>
              </View>
              <Text style={styles.instructionsText}>{pickup.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Lifecycle Progress Card ────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>LIFECYCLE PROGRESS</Text>
          <ProgressTracker currentStatus={pickup.status} />
        </View>

        {/* ── Dispatch Action Buttons ────────────────────────────── */}
        <View style={styles.actionContainer}>
          {pickup.status === 'ACCEPTED' && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, updating && styles.btnDisabled]}
              disabled={updating}
              onPress={() => handleStatusTransition('IN_TRANSIT')}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="car-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Start Trip (En Route) 🚚</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {pickup.status === 'IN_TRANSIT' && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, styles.completeBtn, updating && styles.btnDisabled]}
              disabled={updating}
              onPress={() => handleStatusTransition('COMPLETED')}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Complete Collection ✓</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {pickup.status === 'COMPLETED' && (
            <View style={styles.completedNotice}>
              <Ionicons name="checkmark-circle" size={24} color="#059669" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.completedNoticeTitle}>Collection Completed</Text>
                <Text style={styles.completedNoticeSub}>
                  Recyclables collected and points rewarded to citizen.
                </Text>
              </View>
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
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#059669',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 10,
    gap: 4,
  },
  headerBackText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },

  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  /* Map Card */
  mapCard: {
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...onboardingTheme.cardShadow,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  pickupPin: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#059669',
  },
  collectorPin: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  pinText: {
    fontSize: 18,
  },
  navOverlayBtn: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
    ...onboardingTheme.cardShadow,
  },
  navOverlayText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Web Map Fallback */
  webMapFallbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...onboardingTheme.cardShadow,
  },
  webMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  webGpsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webMapTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  webMapCoords: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  webAddressRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAF9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 8,
  },
  webAddressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  webAddressValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  webNavActionBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  webNavActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Standard White Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...onboardingTheme.cardShadow,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  /* Customer Row */
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  customerPhone: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  callCircleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  callCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  /* Specs Rows */
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  specValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'right',
  },
  specValueBold: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800',
  },
  specValueAddress: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  badgeEmoji: {
    fontSize: 13,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Instructions Box */
  instructionsBox: {
    backgroundColor: '#F8FAF9',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  instructionsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  instructionsText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },

  /* Actions Container */
  actionContainer: {
    marginTop: 6,
  },
  primaryActionBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    ...onboardingTheme.cardShadow,
  },
  completeBtn: {
    backgroundColor: '#047857',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  completedNoticeTitle: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '800',
  },
  completedNoticeSub: {
    color: '#047857',
    fontSize: 12,
    marginTop: 2,
  },
});
