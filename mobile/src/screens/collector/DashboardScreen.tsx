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
