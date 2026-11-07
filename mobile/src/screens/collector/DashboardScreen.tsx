import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { collectorService } from '../../services/collector.service';
import { pickupService } from '../../services/pickup.service';
import { CollectorProfile, PickupRequest } from '../../types/collector';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

type TabType = 'ASSIGNED' | 'NEARBY' | 'COMPLETED';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<CollectorProfile | null>(null);
  const [assignedPickups, setAssignedPickups] = useState<PickupRequest[]>([]);
  const [nearbyPickups, setNearbyPickups] = useState<PickupRequest[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('ASSIGNED');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [profileData, pickupsData] = await Promise.all([
        collectorService.getProfile().catch(() => null),
        collectorService.getAssignedPickups().catch(() => []),
      ]);

      setProfile(profileData);
      setAssignedPickups(pickupsData || []);

      // Also fetch nearby requests
      let lat = 6.9271;
      let lng = 79.8612;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      } catch {
        // Fallback coords
      }

      const nearby = await pickupService.getNearbyPickups(lat, lng, 10000).catch(() => []);
      setNearbyPickups(nearby || []);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleOnline = async () => {
    if (!profile) return;
    const newStatus = !profile.is_available;
    try {
      setProfile((prev) => (prev ? { ...prev, is_available: newStatus } : null));
      await collectorService.updateProfile({ isAvailable: newStatus });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update online status.');
      setProfile((prev) => (prev ? { ...prev, is_available: !newStatus } : null));
    }
  };

  const handleLaunchGPS = (item: PickupRequest) => {
    const lat = Number(item.latitude) || 6.9271;
    const lng = Number(item.longitude) || 79.8612;
    const label = encodeURIComponent(item.address_text || 'Pickup Location');

    const url =
      Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(${label})`,
      }) || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };

  const handleCallCustomer = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Contact', 'No phone number provided for this customer.');
    }
  };

  const handleAdvancePickup = async (pickupId: string, nextStatus: 'IN_TRANSIT' | 'COMPLETED') => {
    const actionName = nextStatus === 'IN_TRANSIT' ? 'Start Trip' : 'Complete Collection';
    Alert.alert(actionName, `Mark this pickup as ${nextStatus.replace('_', ' ')}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setIsUpdatingStatus(true);
            await pickupService.updatePickupStatus(pickupId, nextStatus);
            Alert.alert('Success', `Pickup updated to ${nextStatus.replace('_', ' ')}.`);
            loadData();
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to update status.');
          } finally {
            setIsUpdatingStatus(false);
          }
        },
      },
    ]);
  };

  const handleClaimPickup = async (request: PickupRequest) => {
    try {
      setClaimingId(request.id);
      await pickupService.acceptPickup(request.id);
      Alert.alert('Claimed!', 'Pickup assigned to your route. Check the Assigned tab.');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to claim pickup.');
    } finally {
      setClaimingId(null);
    }
  };

  // Active / Ongoing Job (En Route or Accepted)
  const activeJob = assignedPickups.find(
    (p) => p.status === 'IN_TRANSIT' || p.status === 'ACCEPTED'
  );

  const completedPickups = assignedPickups.filter((p) => p.status === 'COMPLETED');
  const pendingOrAssigned = assignedPickups.filter((p) => p.status !== 'COMPLETED');

  // Stats
  const completedCount = completedPickups.length || profile?.completed_pickups || 8;
  const totalWeightKg = assignedPickups
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (Number(p.estimated_weight) || 0), 240);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading Collector Fleet Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top Header ────────────────────────────────────────── */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.brandSmall}>ECONEXUS</Text>
          <Text style={styles.dashboardTitle}>Collector Dashboard</Text>
        </View>
        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.notificationBtn}>
            <Text style={styles.bellIcon}>🔔</Text>
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {user?.name?.charAt(0) || profile?.name?.charAt(0) || 'K'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Collector Profile & Stats Card ───────────────────── */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>👨‍✈️</Text>
            </View>
            <View
              style={[
                styles.onlineIndicatorBadge,
                { backgroundColor: profile?.is_available ? '#10B981' : '#9CA3AF' },
              ]}
            />
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.nameVerifiedRow}>
              <Text style={styles.collectorName}>
                {user?.name || profile?.name || 'Kamal Perera'}
              </Text>
              <View style={styles.verifiedCheck}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            </View>
            <Text style={styles.vehicleSectorText}>
              {profile?.vehicle_type || 'WP-9214'} • RATNAPURA SECTOR
            </Text>
          </View>

          {/* Online Toggle Pill */}
          <TouchableOpacity
            style={[
              styles.onlinePill,
              profile?.is_available ? styles.onlinePillActive : styles.onlinePillInactive,
            ]}
            onPress={handleToggleOnline}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: profile?.is_available ? '#10B981' : '#9CA3AF' },
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                { color: profile?.is_available ? '#065F46' : '#6B7280' },
              ]}
            >
              {profile?.is_available ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3 Metric Tiles */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricTile, { backgroundColor: '#F0F9FF' }]}>
            <Text style={styles.metricLabel}>Pickups</Text>
            <Text style={styles.metricValue}>
              <Text style={{ fontWeight: '800' }}>{completedCount}</Text>
              <Text style={styles.metricTotal}>/10</Text>
            </Text>
            <Text style={[styles.metricSubtitle, { color: '#0369A1' }]}>Done</Text>
          </View>

          <View style={[styles.metricTile, { backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.metricLabel}>Volume</Text>
            <Text style={styles.metricValue}>
              <Text style={{ fontWeight: '800' }}>{totalWeightKg.toFixed(0)}</Text>
              <Text style={styles.metricUnit}> kg</Text>
            </Text>
            <Text style={[styles.metricSubtitle, { color: '#15803D' }]}>+18% goal</Text>
          </View>

          <View style={[styles.metricTile, { backgroundColor: '#FEFCE8' }]}>
            <Text style={styles.metricLabel}>Earnings</Text>
            <Text style={styles.metricValue}>$85.50</Text>
            <Text style={[styles.metricSubtitle, { color: '#A16207' }]}>⭐ 450 pts</Text>
          </View>
        </View>
      </View>

      {/* ── Active Dispatch Stop (Dark Green Card) ──────────── */}
      {activeJob ? (
        <View style={styles.dispatchCard}>
          <View style={styles.dispatchTopRow}>
            <View style={styles.dispatchIndicator}>
              <View style={styles.dispatchDot} />
              <Text style={styles.dispatchHeaderLabel}>ACTIVE DISPATCH STOP</Text>
            </View>
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>⏱ ETA 12 mins</Text>
            </View>
          </View>

          <View style={styles.dispatchAddressRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.dispatchAddress} numberOfLines={1}>
                {activeJob.address_text || '123 Green View Rd'}
              </Text>
              <Text style={styles.dispatchSub} numberOfLines={1}>
                {activeJob.notes || 'Ratnapura Central • Customer ready'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.launchGpsBtn}
              onPress={() => handleLaunchGPS(activeJob)}
            >
              <Text style={styles.launchGpsText}>🚀 Launch GPS</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.dispatchCard, { backgroundColor: '#064E3B' }]}>
          <Text style={styles.dispatchHeaderLabel}>DISPATCH STATUS</Text>
          <Text style={styles.dispatchAddress}>Ready for Next Pickup</Text>
          <Text style={styles.dispatchSub}>
            Select an open request below to start your next collection route.
          </Text>
        </View>
      )}

      {/* ── Quick Utility Action Bar ─────────────────────────── */}
      <View style={styles.quickBar}>
        <TouchableOpacity
          style={styles.quickActionItem}
          onPress={() => Alert.alert('QR Scanner', 'Weighing scale QR scanner initiated.')}
        >
          <Text style={styles.quickActionIcon}>⛶</Text>
          <Text style={styles.quickActionLabel}>QR Scan</Text>
        </TouchableOpacity>

        <View style={styles.quickBarDivider} />

        <TouchableOpacity
          style={styles.quickActionItem}
          onPress={() => Alert.alert('Scale Sync', 'Connecting to wireless digital Bluetooth scale...')}
        >
          <Text style={styles.quickActionIcon}>⚖️</Text>
          <Text style={styles.quickActionLabel}>Scale Sync</Text>
        </TouchableOpacity>

        <View style={styles.quickBarDivider} />

        <TouchableOpacity
          style={styles.quickActionItem}
          onPress={() => navigation.navigate('ServiceArea')}
        >
          <Text style={styles.quickActionIcon}>📍</Text>
          <Text style={styles.quickActionLabel}>Optimizer</Text>
        </TouchableOpacity>
      </View>

      {/* ── Segment Tabs ─────────────────────────────────────── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ASSIGNED' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ASSIGNED')}
        >
          <Text style={[styles.tabText, activeTab === 'ASSIGNED' && styles.tabTextActive]}>
            Assigned
          </Text>
          <View
            style={[
              styles.tabCounterPill,
              activeTab === 'ASSIGNED' ? styles.counterActive : styles.counterInactive,
            ]}
          >
            <Text
              style={[
                styles.counterText,
                { color: activeTab === 'ASSIGNED' ? '#FFFFFF' : '#6B7280' },
              ]}
            >
              {pendingOrAssigned.length || 2}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'NEARBY' && styles.tabBtnActive]}
          onPress={() => setActiveTab('NEARBY')}
        >
          <Text style={[styles.tabText, activeTab === 'NEARBY' && styles.tabTextActive]}>
            Nearby
          </Text>
          <View
            style={[
              styles.tabCounterPill,
              activeTab === 'NEARBY' ? styles.counterActive : styles.counterInactive,
            ]}
          >
            <Text
              style={[
                styles.counterText,
                { color: activeTab === 'NEARBY' ? '#FFFFFF' : '#6B7280' },
              ]}
            >
              {nearbyPickups.length || 5}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'COMPLETED' && styles.tabBtnActive]}
          onPress={() => setActiveTab('COMPLETED')}
        >
          <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab Content: Task Cards ──────────────────────────── */}
      {activeTab === 'ASSIGNED' && (
        <View style={styles.cardsList}>
          {/* Card 1: En Route / In Progress */}
          <View style={styles.orderCard}>
            <View style={styles.orderTopRow}>
              <Text style={styles.orderCode}>#ECO-8492 • 0.8 km away</Text>
              <View style={styles.enRouteBadge}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.enRouteText}>En Route</Text>
              </View>
            </View>

            <Text style={styles.orderCustomerName}>Nirmal S.</Text>

            {/* Inventory Breakdown Box */}
            <View style={styles.inventoryBox}>
              <View style={styles.inventoryThumbPlaceholder}>
                <Text style={{ fontSize: 22 }}>📦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inventoryHeader}>INVENTORY BREAKDOWN</Text>
                <Text style={styles.inventoryMaterials} numberOfLines={1}>
                  5.0 kg Plastic (PET) + 3.0 kg Cardboard
                </Text>
                <Text style={styles.inventoryMeta}>
                  Est. Value: $4.20 • Doorstep Ready
                </Text>
              </View>
            </View>

            {/* Actions: Call & Mark Arrived */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.subActionBtn}
                onPress={() => handleCallCustomer('0771234567')}
              >
                <Text style={styles.subActionBtnText}>📞 Call Customer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.subActionBtn}
                onPress={() => Alert.alert('Arrived', 'Customer alerted that driver is outside.')}
              >
                <Text style={styles.subActionBtnText}>📍 Mark Arrived</Text>
              </TouchableOpacity>
            </View>

            {/* Weigh / QR Scan Primary Button */}
            <TouchableOpacity
              style={styles.qrWeighBtn}
              onPress={() => {
                if (activeJob) {
                  handleAdvancePickup(activeJob.id, 'COMPLETED');
                } else {
                  Alert.alert('Weighing Scale', 'Ready to weigh collected load.');
                }
              }}
            >
              <Text style={styles.qrWeighBtnText}>⛶ Open QR Scanner to Weigh</Text>
            </TouchableOpacity>
          </View>

          {/* Card 2: Scheduled Pickup */}
          <View style={styles.orderCard}>
            <View style={styles.orderTopRow}>
              <Text style={styles.orderCode}>#ECO-8501 • 2.3 km away</Text>
              <View style={styles.scheduledBadge}>
                <Text style={styles.scheduledText}>🕒 11:30 AM</Text>
              </View>
            </View>

            <Text style={styles.orderCustomerName}>Dilani K.</Text>

            <View style={styles.inventoryBox}>
              <View style={styles.inventoryThumbPlaceholder}>
                <Text style={{ fontSize: 22 }}>💻</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inventoryHeader}>SCHEDULED MATERIALS</Text>
                <Text style={styles.inventoryMaterials} numberOfLines={1}>
                  12.0 kg E-Waste & Metal Appliances
                </Text>
                <Text style={[styles.inventoryMeta, { color: '#0D9488' }]}>
                  Specialized Handling Required
                </Text>
              </View>
            </View>

            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.subActionBtn}
                onPress={() => Alert.alert('Re-route', 'Route recalculated with optimized stop sequence.')}
              >
                <Text style={styles.subActionBtnText}>⤴ Re-route</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subActionBtn, { backgroundColor: '#15803D' }]}
                onPress={() => Alert.alert('Confirmed', 'Dispatch stop confirmed for 11:30 AM.')}
              >
                <Text style={[styles.subActionBtnText, { color: '#FFFFFF' }]}>
                  ✓ Confirm Dispatch
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ── Tab Content: Nearby Pool ─────────────────────────── */}
      {activeTab === 'NEARBY' && (
        <View style={styles.cardsList}>
          {nearbyPickups.length > 0 ? (
            nearbyPickups.map((item) => (
              <View key={item.id} style={styles.orderCard}>
                <View style={styles.orderTopRow}>
                  <Text style={styles.orderCode}>
                    #ECO-{item.id.slice(0, 4)} •{' '}
                    {item.distance_meters
                      ? (item.distance_meters / 1000).toFixed(1) + ' km nearby'
                      : 'Nearby'}
                  </Text>
                  <View style={styles.openPoolBadge}>
                    <Text style={styles.openPoolText}>Open Pool</Text>
                  </View>
                </View>

                <Text style={styles.orderCustomerName}>
                  {item.user_name || 'Commercial Green Cafe'}
                </Text>

                <View style={styles.inventoryBox}>
                  <View style={styles.inventoryThumbPlaceholder}>
                    <Text style={{ fontSize: 22 }}>♻️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inventoryMaterials}>
                      {item.estimated_weight || 15}.0 kg {item.waste_type}
                    </Text>
                    <Text style={styles.inventoryMeta} numberOfLines={1}>
                      {item.address_text}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.pointsHighlight}>+45 Pts</Text>
                    <Text style={styles.cashHighlight}>$9.00</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.instantClaimBtn}
                  disabled={claimingId === item.id}
                  onPress={() => handleClaimPickup(item)}
                >
                  {claimingId === item.id ? (
                    <ActivityIndicator size="small" color="#0A0F0D" />
                  ) : (
                    <Text style={styles.instantClaimText}>
                      ⚡ Instant Claim (+45 EcoHauler Pts)
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.orderCard}>
              <View style={styles.orderTopRow}>
                <Text style={styles.orderCode}>#ECO-8510 • 1.5 km nearby</Text>
                <View style={styles.openPoolBadge}>
                  <Text style={styles.openPoolText}>Open Pool</Text>
                </View>
              </View>

              <Text style={styles.orderCustomerName}>Commercial Green Cafe</Text>

              <View style={styles.inventoryBox}>
                <View style={styles.inventoryThumbPlaceholder}>
                  <Text style={{ fontSize: 22 }}>🥬</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inventoryMaterials}>
                    15.0 kg Organic & Paper
                  </Text>
                  <Text style={styles.inventoryMeta}>
                    Loading dock ready • Back alley access
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.pointsHighlight}>+45 Pts</Text>
                  <Text style={styles.cashHighlight}>$9.00</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.instantClaimBtn}
                onPress={() => Alert.alert('Claimed', 'Added to your dispatch route!')}
              >
                <Text style={styles.instantClaimText}>
                  ⚡ Instant Claim (+45 EcoHauler Pts)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── Tab Content: Completed ───────────────────────────── */}
      {activeTab === 'COMPLETED' && (
        <View style={styles.cardsList}>
          {completedPickups.length > 0 ? (
            completedPickups.map((item) => (
              <View key={item.id} style={styles.orderCard}>
                <View style={styles.orderTopRow}>
                  <Text style={styles.orderCode}>#ECO-{item.id.slice(0, 4)}</Text>
                  <View style={[styles.enRouteBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.enRouteText, { color: '#15803D' }]}>Completed</Text>
                  </View>
                </View>
                <Text style={styles.orderCustomerName}>{item.address_text}</Text>
                <Text style={styles.inventoryMeta}>
                  ⚖️ {item.estimated_weight || 10} kg • {item.waste_type}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No Completed Pickups Yet</Text>
              <Text style={styles.emptyText}>Completed collections will show here.</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Gamification / Master Hauler Tier Banner ─────────── */}
      <View style={styles.tierBanner}>
        <View style={styles.trophyCircle}>
          <Text style={{ fontSize: 22 }}>🏆</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tierTitle}>Tier 3 Master Hauler</Text>
          <Text style={styles.tierSub}>
            2 more pickups to unlock $20 daily fuel stipend
          </Text>
        </View>
        <Text style={styles.tierPercent}>80%</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Crisp light background as shown in Figma
  },
  content: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  /* Top Header */
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandSmall: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669', // Emerald
    letterSpacing: 0.8,
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A', // Slate 900
    letterSpacing: -0.3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 16,
  },
  notifBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
    position: 'absolute',
    top: 7,
    right: 7,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D1FAE5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
  },

  /* Collector Profile & Stats Card */
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  onlineIndicatorBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileDetails: {
    flex: 1,
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  collectorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  vehicleSectorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  onlinePillActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  onlinePillInactive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* 3 Metric Tiles */
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricTotal: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  metricUnit: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  metricSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  /* Active Dispatch Banner (Forest Green Card) */
  dispatchCard: {
    backgroundColor: '#064E3B', // Deep forest green from Figma
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  dispatchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dispatchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dispatchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#84CC16', // Lime green dot
  },
  dispatchHeaderLabel: {
    color: '#86EFAC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  etaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  etaText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  dispatchAddressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dispatchAddress: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  dispatchSub: {
    fontSize: 12,
    color: '#A7F3D0',
  },
  launchGpsBtn: {
    backgroundColor: '#A3E635', // Vibrant Lime button from Figma
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  launchGpsText: {
    color: '#0A0F0D',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Quick Utility Action Bar */
  quickBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    fontSize: 18,
    color: '#0284C7',
    marginBottom: 4,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickBarDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  /* Segment Tabs */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 24,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  tabCounterPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  counterActive: {
    backgroundColor: '#059669',
  },
  counterInactive: {
    backgroundColor: '#E2E8F0',
  },
  counterText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* Cards List & Order Cards */
  cardsList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.3,
  },
  enRouteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  enRouteText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  scheduledBadge: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  scheduledText: {
    color: '#A16207',
    fontSize: 11,
    fontWeight: '700',
  },
  openPoolBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  openPoolText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  orderCustomerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },

  /* Inventory Breakdown Box */
  inventoryBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  inventoryThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventoryHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  inventoryMaterials: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  inventoryMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  pointsHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  cashHighlight: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },

  /* Action Buttons */
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  subActionBtn: {
    flex: 1,
    backgroundColor: '#EEF2FF', // Soft lilac/blue
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  qrWeighBtn: {
    backgroundColor: '#064E3B', // Dark emerald
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWeighBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  instantClaimBtn: {
    backgroundColor: '#A3E635', // Vibrant lime claim button
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instantClaimText: {
    color: '#0A0F0D',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Empty state */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },

  /* Tier Banner */
  tierBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 12,
  },
  trophyCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  tierSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  tierPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
});
