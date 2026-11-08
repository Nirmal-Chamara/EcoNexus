import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../hooks/useAuth';

const { width } = Dimensions.get('window');

interface Props {
  navigation?: {
    navigate: (screen: string, params?: unknown) => void;
  };
}

export default function CollectorDashboardScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const displayName = user?.name || 'Kamal Perera';

  const [activeTab, setActiveTab] = useState<'assigned' | 'nearby' | 'completed'>('assigned');
  const [claimed, setClaimed] = useState(false);

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Are you sure you want to sign out?')
          : true;
      if (confirmed) {
        signOut().catch(() => {});
      }
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut().catch(() => {}) },
    ]);
  };

  const handleLaunchGPS = () => {
    Alert.alert(
      'Launch GPS Navigation',
      'Opening live turn-by-turn route to 123 Green View Rd, Ratnapura...'
    );
  };

  const handleOpenQRScanner = () => {
    Alert.alert(
      'Open QR Scanner to Weigh',
      'Activating camera to scan customer waste batch QR code and connect Bluetooth scale...'
    );
  };

  const handleClaimPool = () => {
    setClaimed(true);
    Alert.alert(
      'Batch Claimed!',
      'You claimed Commercial Green Cafe (15.0 kg Organic & Paper). Added to your active route!'
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. Top Header Bar ────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerBrand}>ECONEXUS</Text>
          <Text style={styles.headerTitle}>Collector Dashboard</Text>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={styles.headerIconButton}
            onPress={() => Alert.alert('Notifications', 'You have 3 new route dispatch updates.')}
          >
            <Ionicons name="notifications-outline" size={22} color="#1F2937" />
            <View style={styles.notificationDot} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Collector Profile"
            style={styles.headerAvatarWrapper}
            onPress={() => navigation?.navigate('ProfileTab')}
          >
            <View style={styles.headerAvatarCircle}>
              <Text style={styles.headerAvatarText}>
                {displayName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.onlineStatusDot} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign Out"
            style={styles.headerLogoutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={19} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      {/* ── 2. Collector Profile Header Card ─────────────────────────── */}
      <View style={styles.collectorCard}>
        <View style={styles.collectorTopRow}>
          <View style={styles.collectorAvatarCircle}>
            <Text style={styles.collectorAvatarInitials}>
              {displayName
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
            <View style={styles.verifiedCheckBadge}>
              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.collectorInfoCol}>
            <View style={styles.collectorNameRow}>
              <Text style={styles.collectorName}>{displayName}</Text>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.collectorSector}>WP-9214 • RATNAPURA SECTOR</Text>
          </View>

          <View style={styles.onlineStatusBadge}>
            <View style={styles.onlinePillDot} />
            <Text style={styles.onlineStatusText}>Online</Text>
          </View>
        </View>

        {/* 3 Stat Metrics Row */}
        <View style={styles.statsRow}>
          {/* Stat 1: Pickups */}
          <View style={[styles.statBox, { backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.statLabel}>Pickups</Text>
            <Text style={styles.statValue}>8/10</Text>
            <Text style={[styles.statSub, { color: '#059669' }]}>Done</Text>
          </View>

          {/* Stat 2: Volume */}
          <View style={[styles.statBox, { backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>240 kg</Text>
            <Text style={[styles.statSub, { color: '#059669' }]}>+18% goal</Text>
          </View>

          {/* Stat 3: Earnings */}
          <View style={[styles.statBox, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.statLabel}>Earnings</Text>
            <Text style={styles.statValue}>$85.50</Text>
            <Text style={[styles.statSub, { color: '#D97706' }]}>• 480 pts</Text>
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

      {/* ── 3. Active Dispatch Stop Banner ───────────────────────────── */}
      <View style={styles.activeDispatchBanner}>
        <View style={styles.dispatchTopRow}>
          <View style={styles.activeDispatchTagRow}>
            <View style={styles.pulseGreenDot} />
            <Text style={styles.activeDispatchTag}>ACTIVE DISPATCH STOP</Text>
          </View>
          <View style={styles.etaPill}>
            <Ionicons name="time-outline" size={12} color="#A7F3D0" style={{ marginRight: 4 }} />
            <Text style={styles.etaText}>ETA 12 mins</Text>
          </View>
        </View>

        <View style={styles.dispatchContentRow}>
          <View style={styles.dispatchAddressCol}>
            <Text style={styles.dispatchAddress}>123 Green View Rd</Text>
            <Text style={styles.dispatchSubtext}>Ratnapura Central • Customer waiting</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Launch GPS"
            style={styles.launchGpsButton}
            onPress={handleLaunchGPS}
          >
            <Text style={styles.launchGpsText}>Launch GPS ↗</Text>
          </Pressable>
        </View>
      </View>

      {/* ── 4. Quick Action Tools Row ────────────────────────────────── */}
      <View style={styles.quickToolsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="QR Scan"
          style={styles.quickToolItem}
          onPress={handleOpenQRScanner}
        >
          <View style={[styles.quickToolCircle, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="scan-outline" size={22} color="#0284C7" />
          </View>
          <Text style={styles.quickToolLabel}>QR Scan</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scale Sync"
          style={styles.quickToolItem}
          onPress={() => Alert.alert('Scale Sync', 'Connecting to Bluetooth calibrated field scale... Status: Synced.')}
        >
          <View style={[styles.quickToolCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="hourglass-outline" size={22} color="#059669" />
          </View>
          <Text style={styles.quickToolLabel}>Scale Sync</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Route Optimizer"
          style={styles.quickToolItem}
          onPress={() => Alert.alert('Route Optimizer', 'Recalculating fuel-efficient multi-stop route. 3.4 km saved!')}
        >
          <View style={[styles.quickToolCircle, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="git-network-outline" size={22} color="#9333EA" />
          </View>
          <Text style={styles.quickToolLabel}>Optimizer</Text>
        </Pressable>
      </View>

      {/* ── 5. Request Queue Filter Tabs ─────────────────────────────── */}
      <View style={styles.filterTabsRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('assigned')}
          style={[styles.filterTab, activeTab === 'assigned' && styles.filterTabActive]}
        >
          <Text style={[styles.filterTabText, activeTab === 'assigned' && styles.filterTabTextActive]}>
            Assigned (2)
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('nearby')}
          style={[styles.filterTab, activeTab === 'nearby' && styles.filterTabActive]}
        >
          <Text style={[styles.filterTabText, activeTab === 'nearby' && styles.filterTabTextActive]}>
            Nearby (8)
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('completed')}
          style={[styles.filterTab, activeTab === 'completed' && styles.filterTabActive]}
        >
          <Text style={[styles.filterTabText, activeTab === 'completed' && styles.filterTabTextActive]}>
            Completed
          </Text>
        </Pressable>
      </View>

      {/* ── 6. Request Queue Cards ───────────────────────────────────── */}
      {/* Request Card 1: Active Stop */}
      <View style={styles.requestCard}>
        <View style={styles.requestCardHeader}>
          <Text style={styles.requestIdText}>#ECO-3492 • 0.5 km away</Text>
          <View style={styles.enRouteBadge}>
            <Text style={styles.enRouteBadgeText}>• En Route</Text>
          </View>
        </View>

        <Text style={styles.customerName}>Nirmal S.</Text>

        <View style={styles.inventoryBox}>
          <View style={styles.inventoryIconSquare}>
            <Ionicons name="cube-outline" size={24} color="#059669" />
          </View>
          <View style={styles.inventoryDetails}>
            <Text style={styles.inventoryHeader}>INVENTORY BREAKDOWN</Text>
            <Text style={styles.inventoryTitle}>5.0 kg Plastic (PET) + 3.0 kg Cardb</Text>
            <Text style={styles.inventorySub}>Est. Value: $4.20 • Doorstep Ready</Text>
          </View>
        </View>

        <View style={styles.cardActionsRow}>
          <Pressable
            accessibilityRole="button"
            style={styles.cardActionButton}
            onPress={() => Alert.alert('Calling Customer', 'Calling Nirmal S. (+94 77 123 4567)...')}
          >
            <Ionicons name="call-outline" size={15} color="#111827" style={{ marginRight: 4 }} />
            <Text style={styles.cardActionText}>Call Customer</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={styles.cardActionButton}
            onPress={() => Alert.alert('Customer Notified', 'Marked arrived. Automated SMS sent to customer.')}
          >
            <Ionicons name="location-outline" size={15} color="#111827" style={{ marginRight: 4 }} />
            <Text style={styles.cardActionText}>Mark Arrived</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open QR Scanner to Weigh"
          style={styles.weighButton}
          onPress={handleOpenQRScanner}
        >
          <Ionicons name="scan-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.weighButtonText}>Open QR Scanner to Weigh</Text>
        </Pressable>
      </View>

      {/* Request Card 2: Scheduled */}
      <View style={styles.requestCard}>
        <View style={styles.requestCardHeader}>
          <Text style={styles.requestIdMuted}>#ECO-8501 • 2.3 km away</Text>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={12} color="#D97706" style={{ marginRight: 3 }} />
            <Text style={styles.timeBadgeText}>11:30 AM</Text>
          </View>
        </View>

        <Text style={styles.customerName}>Dilani K.</Text>

        <View style={styles.inventoryBox}>
          <View style={[styles.inventoryIconSquare, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="hardware-chip-outline" size={24} color="#D97706" />
          </View>
          <View style={styles.inventoryDetails}>
            <Text style={styles.inventoryHeader}>SCHEDULED MATERIALS</Text>
            <Text style={styles.inventoryTitle}>12.0 kg E-Waste &amp; Metal Appliance</Text>
            <Text style={[styles.inventorySub, { color: '#D97706' }]}>
              Specialized Handling Required
            </Text>
          </View>
        </View>

        <View style={styles.cardActionsRow}>
          <Pressable
            accessibilityRole="button"
            style={styles.cardActionButton}
            onPress={() => Alert.alert('Re-route', 'Re-sequencing stop in routing plan...')}
          >
            <Ionicons name="swap-vertical-outline" size={15} color="#111827" style={{ marginRight: 4 }} />
            <Text style={styles.cardActionText}>Re-route</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={[styles.cardActionButton, { backgroundColor: '#047857', borderColor: '#047857' }]}
            onPress={() => Alert.alert('Dispatch Confirmed', 'Stop confirmed. Navigation queued.')}
          >
            <Ionicons name="checkmark" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={[styles.cardActionText, { color: '#FFFFFF' }]}>Confirm Dispatch</Text>
          </Pressable>
        </View>
      </View>

      {/* Request Card 3: Open Pool */}
      <View style={styles.requestCard}>
        <View style={styles.requestCardHeader}>
          <Text style={styles.requestIdMuted}>#ECO-5510 • 1.5 km nearby</Text>
          <View style={styles.openPoolBadge}>
            <Text style={styles.openPoolBadgeText}>Open Pool</Text>
          </View>
        </View>

        <Text style={styles.customerName}>Commercial Green Cafe</Text>

        <View style={styles.inventoryBox}>
          <View style={[styles.inventoryIconSquare, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="business-outline" size={24} color="#0284C7" />
          </View>
          <View style={styles.inventoryDetails}>
            <Text style={styles.inventoryTitle}>15.0 kg Organic &amp; Paper</Text>
            <Text style={styles.inventoryMutedText}>Loading dock ready • Back alley access</Text>
          </View>
          <View style={styles.pointsRewardCol}>
            <Text style={styles.rewardPtsText}>+45 Pts</Text>
            <Text style={styles.rewardCashText}>$9.00</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Instant Claim"
          style={[styles.instantClaimButton, claimed && { backgroundColor: '#DCFCE7' }]}
          onPress={handleClaimPool}
        >
          <Ionicons
            name={claimed ? 'checkmark-circle' : 'flash'}
            size={16}
            color={claimed ? '#047857' : '#064E3B'}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.instantClaimText}>
            {claimed ? 'Claimed to Active Route' : 'Instant Claim (+45 EcoHauler Pts)'}
          </Text>
        </Pressable>
      </View>

      {/* ── 7. Tier Progress Banner ──────────────────────────────────── */}
      <View style={styles.tierCard}>
        <View style={styles.tierTopRow}>
          <View style={styles.tierIconCircle}>
            <Ionicons name="trophy" size={20} color="#D97706" />
          </View>
          <View style={styles.tierInfoCol}>
            <Text style={styles.tierTitle}>Tier 3 Master Hauler</Text>
            <Text style={styles.tierSubtext}>2 more pickups to unlock $20 daily fuel stipend</Text>
          </View>
          <Text style={styles.tierPercentText}>80%</Text>
        </View>
        <View style={styles.tierProgressTrack}>
          <View style={styles.tierProgressFill} />
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
  screen: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
    gap: 14,
  },

  // 1. Header Bar
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  headerTitleGroup: {
    justifyContent: 'center',
  },
  headerBrand: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerAvatarWrapper: {
    position: 'relative',
  },
  headerAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerLogoutButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 2. Collector Card
  collectorCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  collectorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectorAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  collectorAvatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065F46',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectorInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  collectorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectorName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  collectorSector: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  onlineStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  onlinePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  onlineStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  // 3. Active Dispatch Banner
  activeDispatchBanner: {
    backgroundColor: '#064E3B',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  dispatchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeDispatchTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#84CC16',
  },
  activeDispatchTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.8,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#047857',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  etaText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
  },
  dispatchContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  dispatchAddressCol: {
    flex: 1,
  },
  dispatchAddress: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dispatchSubtext: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 2,
  },
  launchGpsButton: {
    backgroundColor: '#84CC16',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginLeft: 12,
  },
  launchGpsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#064E3B',
  },

  // 4. Quick Action Tools Row
  quickToolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingVertical: 12,
  },
  quickToolItem: {
    alignItems: 'center',
    gap: 6,
  },
  quickToolCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickToolLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },

  // 5. Filter Tabs
  filterTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 20,
    padding: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#064E3B',
    fontWeight: '800',
  },

  // 6. Request Queue Cards
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  requestIdMuted: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  enRouteBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  enRouteBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  openPoolBadge: {
    backgroundColor: '#E0F2FE',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  openPoolBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  inventoryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 10,
    gap: 10,
  },
  inventoryIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventoryDetails: {
    flex: 1,
  },
  inventoryHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  inventoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  inventorySub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 1,
  },
  inventoryMutedText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  pointsRewardCol: {
    alignItems: 'flex-end',
  },
  rewardPtsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  rewardCashText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 9,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  weighButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064E3B',
    borderRadius: 20,
    paddingVertical: 12,
  },
  weighButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  instantClaimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#84CC16',
    borderRadius: 20,
    paddingVertical: 12,
  },
  instantClaimText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B',
  },

  // 7. Tier Progress Banner
  tierCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 14,
  },
  tierTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  tierInfoCol: {
    flex: 1,
  },
  tierTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
  },
  tierSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  tierPercentText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    marginLeft: 8,
  },
  tierProgressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  tierProgressFill: {
    width: '80%',
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
});
