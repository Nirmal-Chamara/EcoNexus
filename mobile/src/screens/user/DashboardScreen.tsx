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

export default function DashboardScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const displayName = user?.name ? user.name.split(' ')[0] : 'Nirmal';

  const [sprintJoined, setSprintJoined] = useState(false);
  const [activeStep, setActiveStep] = useState(2); // 0: Req, 1: Accept, 2: Sched, 3: Collect, 4: Delivered

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Are you sure you want to sign out of EcoNexus?')
          : true;
      if (confirmed) {
        signOut().catch(() => {});
      }
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out of EcoNexus?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut().catch(() => {}) },
    ]);
  };

  const handleStartListing = () => {
    navigation?.navigate('ListWaste');
  };

  const handleViewMap = () => {
    navigation?.navigate('Explore');
  };

  const handleCallDriver = () => {
    Alert.alert('Call Hauler', 'Calling Aruna Silva (+94 77 123 4567)...');
  };

  const handleMessageDriver = () => {
    Alert.alert('Chat Hauler', 'Opening chat with Aruna Silva...');
  };

  const handleJoinSprint = () => {
    setSprintJoined(true);
    Alert.alert('Community Sprint', 'You joined the "Divert 5 kg of Waste Paper" sprint! +150 pts reward pending.');
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleGroup}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.headerLogoImage}
            resizeMode="contain"
            accessibilityLabel="EcoNexus Logo"
          />
          <Text style={styles.headerTitle}>Home Dashboard</Text>
        </View>
        <View style={styles.headerRightActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={styles.headerIconButton}
            onPress={() => Alert.alert('Notifications', 'You have no new unread notifications.')}
          >
            <Ionicons name="notifications-outline" size={22} color="#1F2937" />
            <View style={styles.notificationDot} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile"
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
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      {/* 2. Greeting & Eco-Hero Level */}
      <View style={styles.greetingSection}>
        <View style={styles.greetingTextGroup}>
          <Text style={styles.greetingHeading}>Good morning, {displayName} 👋</Text>
          <Text style={styles.greetingSubtext}>Small actions today, greener tomorrow.</Text>
        </View>
        <View style={styles.ecoHeroBadge}>
          <Ionicons name="leaf" size={13} color="#065F46" style={{ marginRight: 4 }} />
          <Text style={styles.ecoHeroText}>Lvl 5 Eco-Hero</Text>
        </View>
      </View>

      {/* 3. Top Action Cards Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionCardsTrack}
      >
        {/* Card 1: List Your Waste (Dark Green Card) */}
        <View style={styles.listWasteCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.circlePlusIcon}>
              <Ionicons name="add" size={22} color="#064E3B" />
            </View>
            <View style={styles.fastPickupBadge}>
              <Text style={styles.fastPickupText}>FAST PICKUP</Text>
            </View>
          </View>
          <Text style={styles.listWasteTitle}>List Your Waste</Text>
          <Text style={styles.listWasteSubtitle}>Start a collection in 30 seconds</Text>
          <Pressable
            onPress={handleStartListing}
            accessibilityRole="button"
            accessibilityLabel="Start Listing"
            style={styles.startListingButton}
          >
            <Text style={styles.startListingText}>Start Listing →</Text>
          </Pressable>
        </View>

        {/* Card 2: Find Collection */}
        <View style={styles.findCollectionCard}>
          <View style={styles.compassCircle}>
            <Ionicons name="compass-outline" size={22} color="#0284C7" />
          </View>
          <Text style={styles.findCollectionTitle}>Find Collection...</Text>
          <Text style={styles.findCollectionSubtitle}>3 haulers active nearby</Text>
          <Pressable
            onPress={handleViewMap}
            accessibilityRole="button"
            accessibilityLabel="View on Map"
            style={styles.viewMapButton}
          >
            <Text style={styles.viewMapText}>View on Map &gt;</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* 4. Your Impact Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="leaf" size={17} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Your Impact</Text>
        </View>
        <Text style={styles.sectionDate}>May 2024</Text>
      </View>

      <View style={styles.impactRow}>
        {/* Impact Card 1 */}
        <View style={styles.impactCard}>
          <View style={[styles.impactIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="repeat-outline" size={16} color="#059669" />
          </View>
          <Text style={styles.impactNumber}>42.5</Text>
          <Text style={styles.impactLabel}>kg Recycled</Text>
          <View style={styles.impactBadgeGreen}>
            <Text style={styles.impactBadgeGreenText}>+14%</Text>
          </View>
        </View>

        {/* Impact Card 2 */}
        <View style={styles.impactCard}>
          <View style={[styles.impactIconCircle, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="cloud-outline" size={16} color="#0284C7" />
          </View>
          <Text style={styles.impactNumber}>12.4</Text>
          <Text style={styles.impactLabel}>kg CO2 Saved</Text>
          <Text style={styles.impactSubDetail}>~2.8 trees</Text>
        </View>

        {/* Impact Card 3 */}
        <View style={styles.impactCard}>
          <View style={[styles.impactIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="star" size={15} color="#D97706" />
          </View>
          <Text style={styles.impactNumber}>1,250</Text>
          <Text style={styles.impactLabel}>EcoPoints</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Redeem EcoPoints"
            style={styles.redeemPill}
            onPress={() => Alert.alert('EcoPoints', 'Opening EcoPoints redemption store...')}
          >
            <Text style={styles.redeemPillText}>Redeem</Text>
          </Pressable>
        </View>
      </View>

      {/* 5. Streak Active Banner */}
      <View style={styles.streakCard}>
        <View style={styles.streakIconWrapper}>
          <Ionicons name="flame" size={24} color="#D97706" />
        </View>
        <View style={styles.streakContent}>
          <Text style={styles.streakBadge}>⚡ STREAK ACTIVE!</Text>
          <Text style={styles.streakTitle}>3 consecutive weekly drop-offs</Text>
          <Text style={styles.streakSubtext}>Collect 1 more batch for 2x Multiplier</Text>
        </View>
      </View>

      {/* 6. Active Pickup Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.activePickupDot} />
          <Text style={styles.sectionTitle}>Active Pickup</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation?.navigate('Activity')}
        >
          <Text style={styles.trackRouteLink}>Track Full Route</Text>
        </Pressable>
      </View>

      <View style={styles.pickupCard}>
        {/* Item Summary */}
        <View style={styles.pickupItemRow}>
          <View style={styles.itemSquareIcon}>
            <Ionicons name="trash-bin-outline" size={22} color="#059669" />
          </View>
          <View style={styles.pickupItemDetails}>
            <View style={styles.itemHeadingRow}>
              <Text style={styles.itemTitle}>Plastic Bottles</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>5 kg • PET</Text>
              </View>
              <View style={styles.statusBadgeAssigned}>
                <Text style={styles.statusBadgeAssignedText}>• Assigned</Text>
              </View>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="#6B7280" />
              <Text style={styles.locationText}>123 Green View Rd, Ratnapura</Text>
            </View>
          </View>
        </View>

        {/* Driver Card */}
        <View style={styles.driverBox}>
          <View style={styles.driverLeft}>
            <View style={styles.driverAvatarCircle}>
              <Text style={styles.driverAvatarInitials}>AS</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>Aruna Silva</Text>
              <Text style={styles.driverRating}>★ 4.9 rating • EcoNexus Hauler</Text>
            </View>
          </View>
          <View style={styles.driverActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call Hauler"
              style={styles.driverActionButton}
              onPress={handleCallDriver}
            >
              <Ionicons name="call-outline" size={17} color="#059669" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Message Hauler"
              style={styles.driverActionButton}
              onPress={handleMessageDriver}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={17} color="#059669" />
            </Pressable>
          </View>
        </View>

        {/* Stepper Progress */}
        <View style={styles.stepperContainer}>
          {[
            { key: 'Req', date: '20 May', label: 'Req' },
            { key: 'Accept', date: '21 May', label: 'Accept' },
            { key: 'Sched', date: 'Today', label: 'Sched' },
            { key: 'Collect', date: 'Pending', label: 'Collect' },
            { key: 'Delivered', date: 'Final', label: 'Delivered' },
          ].map((step, idx) => {
            const isCompleted = idx < activeStep;
            const isCurrent = idx === activeStep;
            return (
              <View key={step.key} style={styles.stepItem}>
                <View style={styles.stepNodeRow}>
                  {idx > 0 && (
                    <View
                      style={[
                        styles.stepLine,
                        idx <= activeStep ? styles.stepLineActive : styles.stepLineInactive,
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted && styles.stepCircleCompleted,
                      isCurrent && styles.stepCircleCurrent,
                      !isCompleted && !isCurrent && styles.stepCirclePending,
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : isCurrent ? (
                      <View style={styles.stepPulseDot} />
                    ) : null}
                  </View>
                  {idx < 4 && (
                    <View
                      style={[
                        styles.stepLine,
                        idx < activeStep ? styles.stepLineActive : styles.stepLineInactive,
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isCompleted || isCurrent) && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
                <Text
                  style={[
                    styles.stepDate,
                    isCurrent && styles.stepDateCurrent,
                  ]}
                >
                  {step.date}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 7. Discover & Learn Section */}
      <Text style={styles.sectionTitleBlock}>Discover &amp; Learn</Text>
      <View style={styles.discoverGrid}>
        {/* Item 1 */}
        <Pressable
          accessibilityRole="button"
          style={styles.discoverCard}
          onPress={() => Alert.alert('Recycling Guide', 'Opening smart sorting and recycling rules...')}
        >
          <View style={[styles.discoverIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="book-outline" size={20} color="#059669" />
          </View>
          <Text style={styles.discoverTitle}>Recycling Guide</Text>
          <Text style={styles.discoverSubtext}>What can be sorted</Text>
        </Pressable>

        {/* Item 2 */}
        <Pressable
          accessibilityRole="button"
          style={styles.discoverCard}
          onPress={() => Alert.alert('Voucher Perks', 'Opening 12 partner deals & discounts...')}
        >
          <View style={[styles.discoverIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="pricetag-outline" size={20} color="#D97706" />
          </View>
          <Text style={styles.discoverTitle}>Voucher Perks</Text>
          <Text style={styles.discoverSubtext}>12 partner deals</Text>
        </Pressable>

        {/* Item 3 */}
        <Pressable
          accessibilityRole="button"
          style={styles.discoverCard}
          onPress={() => Alert.alert('Donate / Reuse', 'Browse and list items for community donation...')}
        >
          <View style={[styles.discoverIconCircle, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="cube-outline" size={20} color="#0284C7" />
          </View>
          <Text style={styles.discoverTitle}>Donate / Reuse</Text>
          <Text style={styles.discoverSubtext}>Community exchange</Text>
        </Pressable>

        {/* Item 4 */}
        <Pressable
          accessibilityRole="button"
          style={styles.discoverCard}
          onPress={() => navigation?.navigate('Activity')}
        >
          <View style={[styles.discoverIconCircle, { backgroundColor: '#CCFBF1' }]}>
            <Ionicons name="receipt-outline" size={20} color="#0D9488" />
          </View>
          <Text style={styles.discoverTitle}>Past Activity</Text>
          <Text style={styles.discoverSubtext}>View receipts &amp; hist...</Text>
        </Pressable>
      </View>

      {/* 8. Community Sprint Banner */}
      <View style={styles.sprintCard}>
        <View style={styles.sprintTopRow}>
          <View style={styles.sprintBadgeGroup}>
            <Ionicons name="trophy-outline" size={15} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.sprintTagText}>COMMUNITY SPRINT</Text>
          </View>
          <View style={styles.sprintRewardBadge}>
            <Text style={styles.sprintRewardText}>+150 pts reward</Text>
          </View>
        </View>

        <Text style={styles.sprintTitle}>Divert 5 kg of Waste Paper</Text>
        <Text style={styles.sprintSubtitle}>
          Participate with 1,420 Colombo &amp; Ratnapura citizens
        </Text>

        <View style={styles.sprintProgressRow}>
          <Text style={styles.sprintProgressText}>Progress: 3.0 kg / 5.0 kg</Text>
          <Text style={styles.sprintPercentText}>60%</Text>
        </View>
        <View style={styles.sprintProgressBarTrack}>
          <View style={styles.sprintProgressBarFill} />
        </View>

        <View style={styles.sprintFooterRow}>
          <View style={styles.sprintTimeGroup}>
            <Ionicons name="time-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
            <Text style={styles.sprintTimeText}>2 days remaining</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Join Sprint"
            onPress={handleJoinSprint}
          >
            <Text style={styles.joinSprintLink}>
              {sprintJoined ? '✓ Joined' : 'Join Sprint →'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 9. Smart Sorting AI Enabled Card */}
      <View style={styles.smartSortingCard}>
        <View style={styles.smartSortingLeft}>
          <View style={styles.smartSortingIconBg}>
            <Ionicons name="scan-outline" size={24} color="#059669" />
          </View>
          <View style={styles.smartSortingTextCol}>
            <Text style={styles.smartSortingTitle}>Smart Sorting Enabled</Text>
            <Text style={styles.smartSortingDesc}>
              Snap a photo to verify recyclable materials automatically with AI.
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open AI camera scanner"
          style={styles.cameraIconCircle}
          onPress={() => Alert.alert('AI Smart Scanner', 'Opening camera scanner to identify waste material...')}
        >
          <Ionicons name="camera-outline" size={20} color="#059669" />
        </Pressable>
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { pickupService } from '../../services/pickup.service';
import { PickupRequest } from '../../types/collector';
import { StatusBadge } from '../../components/status/StatusBadge';

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [activePickup, setActivePickup] = useState<PickupRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const myPickups = await pickupService.getMyPickups().catch(() => []);
      if (myPickups && myPickups.length > 0) {
        const ongoing = myPickups.find(
          (p) => p.status === 'IN_TRANSIT' || p.status === 'ACCEPTED' || p.status === 'PENDING'
        );
        setActivePickup(ongoing || myPickups[0]);
      } else {
        setActivePickup(null);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Citizen'}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Household</Text>
        </View>
      </View>

      {/* Live Pickup Alert Card (if there's an ongoing pickup) */}
      {activePickup && (
        <TouchableOpacity
          style={styles.activePickupCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('TrackTab', { pickupId: activePickup.id })}
        >
          <View style={styles.activePickupHeader}>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.activePickupSubtitle}>Active Collection</Text>
            </View>
            <StatusBadge status={activePickup.status} size="small" />
          </View>

          <Text style={styles.activePickupTitle}>
            {activePickup.waste_type} Waste Pickup
          </Text>
          <Text style={styles.activePickupAddress} numberOfLines={1}>
            📍 {activePickup.address_text}
          </Text>

          <View style={styles.trackActionRow}>
            <Text style={styles.trackActionText}>Tap to view live tracking & map →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Action Cards */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('WasteTab')}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: '#071C0D' }]}>
            <Text style={styles.actionIcon}>♻️</Text>
          </View>
          <Text style={styles.actionTitle}>Waste Listings</Text>
          <Text style={styles.actionDesc}>List recyclable items or donate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('TrackTab')}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: '#1C1607' }]}>
            <Text style={styles.actionIcon}>📍</Text>
          </View>
          <Text style={styles.actionTitle}>Live Tracking</Text>
          <Text style={styles.actionDesc}>Real-time driver GPS & status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Rewards')}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: '#181226' }]}>
            <Text style={styles.actionIcon}>⭐</Text>
          </View>
          <Text style={styles.actionTitle}>Eco Rewards</Text>
          <Text style={styles.actionDesc}>View points & vouchers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('ProfileTab')}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: '#0A1E2C' }]}>
            <Text style={styles.actionIcon}>👤</Text>
          </View>
          <Text style={styles.actionTitle}>My Profile</Text>
          <Text style={styles.actionDesc}>Account & notifications</Text>
        </TouchableOpacity>
      </View>

      {/* Environmental Impact Teaser */}
      <View style={styles.impactCard}>
        <View style={styles.impactHeader}>
          <Text style={styles.impactTitle}>Your Green Contribution</Text>
          <Text style={styles.impactLeaf}>🌿</Text>
        </View>
        <Text style={styles.impactSub}>
          Every verified collection saves carbon emissions and contributes to municipal recycling goals.
        </Text>
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
    gap: 16,
  },

  // 1. Header Bar
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  headerTitleGroup: {
    justifyContent: 'center',
  },
  headerLogoImage: {
    width: 90,
    height: 32,
    marginBottom: 2,
    alignSelf: 'flex-start',
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
    backgroundColor: '#10B981',
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

  // 2. Greeting Section
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  greetingTextGroup: {
    flex: 1,
  },
  greetingHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  greetingSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  ecoHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  ecoHeroText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },

  // 3. Top Action Cards Carousel
  actionCardsTrack: {
    paddingVertical: 4,
    gap: 14,
  },
  listWasteCard: {
    width: 260,
    backgroundColor: '#064E3B',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circlePlusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fastPickupBadge: {
    backgroundColor: '#047857',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  fastPickupText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.5,
  },
  listWasteTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
  },
  listWasteSubtitle: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 2,
  },
  startListingButton: {
    backgroundColor: '#84CC16',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startListingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B',
  },

  findCollectionCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'space-between',
  },
  compassCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  findCollectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 10,
  },
  findCollectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  viewMapButton: {
    marginTop: 14,
  },
  viewMapText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },

  // 4. Your Impact Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  sectionDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  impactRow: {
    flexDirection: 'row',
    gap: 10,
  },
  impactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 12,
  },
  impactIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactNumber: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  impactLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  impactBadgeGreen: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  impactBadgeGreenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  impactSubDetail: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginTop: 10,
  },
  redeemPill: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  redeemPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },

  // 5. Streak Banner
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  streakIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakContent: {
    flex: 1,
  },
  streakBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  streakTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  streakSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },

  // 6. Active Pickup Section
  activePickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  trackRouteLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  pickupCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  pickupItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemSquareIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupItemDetails: {
    flex: 1,
  },
  itemHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  typeBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  statusBadgeAssigned: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeAssignedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#6B7280',
  },

  driverBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 10,
  },
  driverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driverAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
  },
  driverInfo: {},
  driverName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  driverRating: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  driverActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },
  stepLineInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
  },
  stepCircleCurrent: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  stepPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  stepCirclePending: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  stepLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#111827',
    fontWeight: '700',
  },
  stepDate: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },
  stepDateCurrent: {
    color: '#059669',
    fontWeight: '700',
  },

  // 7. Discover & Learn
  sectionTitleBlock: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  discoverCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 14,
  },
  discoverIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  discoverTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  discoverSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // 8. Community Sprint Banner
  sprintCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 20,
    padding: 16,
  },
  sprintTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sprintBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sprintTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  sprintRewardBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sprintRewardText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  sprintTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 6,
  },
  sprintSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  sprintProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sprintProgressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  sprintPercentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  sprintProgressBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 4,
    overflow: 'hidden',
  },
  sprintProgressBarFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  sprintFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  sprintTimeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sprintTimeText: {
    fontSize: 11,
    color: '#6B7280',
  },
  joinSprintLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  // 9. Smart Sorting AI Enabled Card
  smartSortingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 14,
  },
  smartSortingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smartSortingIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartSortingTextCol: {
    flex: 1,
  },
  smartSortingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  smartSortingDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 15,
  },
  cameraIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  activePickupCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20,
  },
  activePickupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  activePickupSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activePickupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  activePickupAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  trackActionRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  trackActionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  impactCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  impactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  impactLeaf: {
    fontSize: 18,
  },
  impactSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
