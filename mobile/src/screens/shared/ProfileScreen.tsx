import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../../hooks/useAuth';
import type { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const { user, signOut, refreshUser } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [collectorMode, setCollectorMode] = useState(user?.role === 'COLLECTOR');

  // Preferences toggles
  const [proximityRadar, setProximityRadar] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [streakReminders, setStreakReminders] = useState(false);

  // Category preferences chips
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'plastic',
    'paper',
  ]);

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } catch {
      // Best-effort refresh
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  const handleSignOut = useCallback(() => {
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Are you sure you want to sign out?')
          : true;
      if (confirmed) {
        signOut().catch((err) => {
          console.error('Sign-out error:', err);
          if (typeof window !== 'undefined') window.alert('Sign-out failed. Please try again.');
        });
      }
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          signOut().catch(() => Alert.alert('Sign-out failed', 'Please try again.'));
        },
      },
    ]);
  }, [signOut]);

  const toggleAccountMode = () => {
    const nextMode = !collectorMode;
    setCollectorMode(nextMode);
    Alert.alert(
      nextMode ? 'Switched to Collector Mode' : 'Switched to Generator Mode',
      nextMode
        ? 'You now have access to collection route scheduling and incoming waste requests.'
        : 'You now have access to household doorstep pickup listing.'
    );
  };

  const displayName = user?.name || 'Nirmal Sandeepa';
  const displayEmail = user?.email || 'nirmal.s@econexus.lk';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* ── Top Navigation Header ────────────────────────────────────────── */}
      <View style={styles.topHeaderBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          {collectorMode
            ? 'Collector Profile & Operations'
            : 'Waste Generator Profile & Address Management'}
        </Text>
      </View>

      {/* ── User Profile Card ────────────────────────────────────────────── */}
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <View style={styles.avatarSquare}>
            <Text style={styles.avatarInitials}>{initials}</Text>
            <View style={styles.verifiedDot}>
              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.profileTextCol}>
            <Text style={styles.userName}>{displayName}</Text>
            <View style={styles.memberSinceRow}>
              <Ionicons name="calendar-outline" size={12} color="#6B7280" style={{ marginRight: 4 }} />
              <Text style={styles.memberSinceText}>Member since Jan 2024</Text>
            </View>
            <View style={styles.levelBadge}>
              <Ionicons name="leaf" size={12} color="#065F46" style={{ marginRight: 4 }} />
              <Text style={styles.levelBadgeText}>
                {collectorMode ? 'Level 5: Certified Eco-Hauler' : 'Level 5: Earth Guardian'}
              </Text>
            </View>
          </View>
        </View>

        {/* EcoPoints Mini-Banner inside Profile Card */}
        <View style={styles.ecoPointsBanner}>
          <View style={styles.ecoPointsLeft}>
            <View style={styles.ecoPointsIconCircle}>
              <Ionicons name="flash" size={16} color="#D97706" />
            </View>
            <View style={styles.ecoPointsTextGroup}>
              <Text style={styles.ecoPointsLabel}>ECOPOINTS</Text>
              <Text style={styles.ecoPointsValue}>1,250 PTS</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Redeem EcoPoints"
            style={styles.redeemButton}
            onPress={() => Alert.alert('Redeem', 'Opening EcoPoints redemption marketplace...')}
          >
            <Text style={styles.redeemButtonText}>Redeem &gt;</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Account Switcher Mode Banner ─────────────────────────────────── */}
      <View style={styles.accountSwitcherBanner}>
        <View style={styles.accountSwitcherLeft}>
          <View style={styles.accountSwitcherIconCircle}>
            <Ionicons name="swap-horizontal" size={18} color="#0284C7" />
          </View>
          <Text style={styles.accountSwitcherText}>
            Account Type •{' '}
            <Text style={{ fontWeight: '800', color: '#111827' }}>
              {collectorMode ? 'Waste Collector' : 'Waste Generator'}
            </Text>
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle Collector Mode"
          style={styles.collectorModeButton}
          onPress={toggleAccountMode}
        >
          <Text style={styles.collectorModeButtonText}>
            {collectorMode ? 'Generator Mode ⮂' : 'Collector Mode ⮂'}
          </Text>
        </Pressable>
      </View>

      {/* ── 1. Eco Milestones ────────────────────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="leaf" size={18} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Eco Milestones</Text>
        </View>
        <Text style={styles.sectionSubIndicator}>3 of 8 Unlocked</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.milestonesTrack}
      >
        {/* Milestone 1 */}
        <View style={styles.milestoneCard}>
          <View style={[styles.milestoneIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="repeat-outline" size={20} color="#059669" />
          </View>
          <Text style={styles.milestoneTitle}>Zero Hero</Text>
          <Text style={styles.milestoneDetail}>150 kg Recycled</Text>
        </View>

        {/* Milestone 2 */}
        <View style={styles.milestoneCard}>
          <View style={[styles.milestoneIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="fitness-outline" size={20} color="#047857" />
          </View>
          <Text style={styles.milestoneTitle}>Tree Planter x3</Text>
          <Text style={styles.milestoneDetail}>Community Target</Text>
        </View>

        {/* Milestone 3 */}
        <View style={styles.milestoneCard}>
          <View style={[styles.milestoneIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="star" size={18} color="#D97706" />
          </View>
          <Text style={styles.milestoneTitle}>Quick Responder</Text>
          <Text style={styles.milestoneDetail}>Top 5% speed</Text>
        </View>
      </ScrollView>

      {/* ── 2. Pickup Addresses ──────────────────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="location" size={18} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Pickup Addresses</Text>
        </View>
        <Text style={styles.sectionSubIndicator}>2 Saved</Text>
      </View>

      {/* Address 1: Home (Default) */}
      <View style={styles.addressCard}>
        <View style={styles.addressTopRow}>
          <View style={styles.addressTagRow}>
            <Text style={styles.addressName}>Home</Text>
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>• Default</Text>
            </View>
          </View>
          <View style={styles.addressActionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit Home Address"
              style={styles.iconActionButton}
              onPress={() => Alert.alert('Edit Address', 'Editing Home address details...')}
            >
              <Ionicons name="pencil-outline" size={16} color="#6B7280" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete Home Address"
              style={styles.iconActionButton}
              onPress={() => Alert.alert('Delete Address', 'Are you sure you want to delete this address?')}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.addressFullText}>123 Green View Rd, Ratnapura, Sri Lanka</Text>

        {/* Access instruction callout */}
        <View style={styles.accessCallout}>
          <Ionicons name="key-outline" size={14} color="#0284C7" style={{ marginRight: 6 }} />
          <Text style={styles.accessCalloutText}>
            Access: &quot;Leave by back gate if not answering&quot;
          </Text>
        </View>

        {/* GPS coordinates verification */}
        <View style={styles.gpsVerificationRow}>
          <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginRight: 4 }} />
          <Text style={styles.gpsVerificationText}>
            GPS Coordinates Verified (6.6828° N, 80.4021° E)
          </Text>
          <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" style={{ marginLeft: 4 }} />
        </View>
      </View>

      {/* Address 2: Office / Studio */}
      <View style={styles.addressCard}>
        <View style={styles.addressTopRow}>
          <View style={styles.addressTagRow}>
            <Text style={styles.addressName}>Office / Studio</Text>
            <Pressable
              accessibilityRole="button"
              style={styles.setDefaultButton}
              onPress={() => Alert.alert('Address Updated', 'Office / Studio set as default address.')}
            >
              <Text style={styles.setDefaultButtonText}>Set Default</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit Office Address"
            style={styles.iconActionButton}
            onPress={() => Alert.alert('Edit Address', 'Editing Office / Studio address details...')}
          >
            <Ionicons name="pencil-outline" size={16} color="#6B7280" />
          </Pressable>
        </View>

        <Text style={styles.addressFullText}>45 Galle Road, Colombo 03, Sri Lanka</Text>
        <View style={styles.buildingAccessRow}>
          <Ionicons name="business-outline" size={13} color="#6B7280" style={{ marginRight: 4 }} />
          <Text style={styles.buildingAccessText}>Tower B, Level 4 (service lift access)</Text>
        </View>
      </View>

      {/* + Add New Pickup Address Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add New Pickup Address"
        style={styles.addAddressDottedButton}
        onPress={() => Alert.alert('New Address', 'Opening address picker to add a new pickup location...')}
      >
        <Ionicons name="add-circle-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
        <Text style={styles.addAddressDottedText}>+ Add New Pickup Address</Text>
      </Pressable>

      {/* ── 3. Collection Preferences ────────────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="options-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Collection Preferences</Text>
        </View>
      </View>

      <View style={styles.preferencesCard}>
        {/* Chips for Quick Categories */}
        <Text style={styles.prefSubHeader}>QUICK CATEGORIES FOR PICKUPS</Text>
        <View style={styles.categoryChipsGrid}>
          {[
            { id: 'plastic', label: 'Plastic (Bottles/Rigid)' },
            { id: 'paper', label: 'Paper & Cardboard' },
            { id: 'metal', label: 'Metal Cans' },
            { id: 'glass', label: 'Glass Containers' },
          ].map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                accessibilityRole="button"
                accessibilityLabel={cat.label}
                onPress={() => toggleCategory(cat.id)}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                  ]}
                >
                  {isSelected ? `✓ ${cat.label}` : `+ ${cat.label}`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Hauler Alerts & Streaks Toggles */}
        <Text style={[styles.prefSubHeader, { marginTop: 16 }]}>HAULER ALERTS &amp; STREAKS</Text>

        {/* Toggle 1 */}
        <View style={styles.toggleRow}>
          <View style={[styles.toggleIconCircle, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="navigate-outline" size={18} color="#0284C7" />
          </View>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>Hauler Proximity Radar</Text>
            <Text style={styles.toggleSubtitle}>Push alert when collector is 2 km away</Text>
          </View>
          <Switch
            value={proximityRadar}
            onValueChange={setProximityRadar}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
          />
        </View>

        {/* Toggle 2 */}
        <View style={styles.toggleRow}>
          <View style={[styles.toggleIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#059669" />
          </View>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>SMS Pickup Notifications</Text>
            <Text style={styles.toggleSubtitle}>Pickup dispatch confirmation codes</Text>
          </View>
          <Switch
            value={smsNotifications}
            onValueChange={setSmsNotifications}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
          />
        </View>

        {/* Toggle 3 */}
        <View style={styles.toggleRow}>
          <View style={[styles.toggleIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="flame-outline" size={18} color="#D97706" />
          </View>
          <View style={styles.toggleTextCol}>
            <Text style={styles.toggleTitle}>Weekly Streak Reminders</Text>
            <Text style={styles.toggleSubtitle}>Boost multiplier alerts on drop-offs</Text>
          </View>
          <Switch
            value={streakReminders}
            onValueChange={setStreakReminders}
            trackColor={{ false: '#E5E7EB', true: '#10B981' }}
          />
        </View>

        {/* Linked Voucher Account */}
        <Text style={[styles.prefSubHeader, { marginTop: 16 }]}>LINKED VOUCHER ACCOUNT</Text>
        <View style={styles.voucherBox}>
          <View style={styles.voucherIconCircle}>
            <Ionicons name="pricetag-outline" size={18} color="#059669" />
          </View>
          <View style={styles.voucherTextCol}>
            <Text style={styles.voucherTitle}>Keells Super x GreenRewards</Text>
            <Text style={styles.voucherSubtitle}>Auto-deposit EcoVouchers enabled</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            style={styles.voucherManageButton}
            onPress={() => Alert.alert('Voucher Account', 'Managing linked supermarket loyalty partners...')}
          >
            <Text style={styles.voucherManageText}>Manage</Text>
          </Pressable>
        </View>
      </View>

      {/* ── 4. Account Management ────────────────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="person-circle-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Account Management</Text>
        </View>
      </View>

      <View style={styles.menuContainerCard}>
        {/* Language */}
        <Pressable
          accessibilityRole="button"
          style={styles.menuItemRow}
          onPress={() => Alert.alert('Language', 'Current language: English (US). Sinhala and Tamil available.')}
        >
          <View style={[styles.menuItemIconBg, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="globe-outline" size={18} color="#0284C7" />
          </View>
          <View style={styles.menuItemTextCol}>
            <Text style={styles.menuItemTitle}>Language</Text>
            <Text style={styles.menuItemSubtitle}>English (US selected) • සිංහල • தமிழ்</Text>
          </View>
          <Text style={styles.menuItemValue}>English &gt;</Text>
        </Pressable>

        <View style={styles.menuDivider} />

        {/* Privacy & Security */}
        <Pressable
          accessibilityRole="button"
          style={styles.menuItemRow}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <View style={[styles.menuItemIconBg, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#059669" />
          </View>
          <View style={styles.menuItemTextCol}>
            <Text style={styles.menuItemTitle}>Privacy &amp; Security</Text>
            <Text style={styles.menuItemSubtitle}>Biometrics, password &amp; account rights</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        <View style={styles.menuDivider} />

        {/* Edit Profile */}
        <Pressable
          accessibilityRole="button"
          style={styles.menuItemRow}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={[styles.menuItemIconBg, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="pencil-outline" size={18} color="#D97706" />
          </View>
          <View style={styles.menuItemTextCol}>
            <Text style={styles.menuItemTitle}>Edit Profile</Text>
            <Text style={styles.menuItemSubtitle}>Update contact number and preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        <View style={styles.menuDivider} />

        {/* Help & Support */}
        <Pressable
          accessibilityRole="button"
          style={styles.menuItemRow}
          onPress={() => Alert.alert('Help & Support', 'Connecting to 24/7 Waste Dispatch Desk live chat...')}
        >
          <View style={[styles.menuItemIconBg, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="help-buoy-outline" size={18} color="#9333EA" />
          </View>
          <View style={styles.menuItemTextCol}>
            <Text style={styles.menuItemTitle}>Help &amp; Support</Text>
            <Text style={styles.menuItemSubtitle}>24/7 Waste dispatch desk &amp; live chat</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        <View style={styles.menuDivider} />

        {/* Log Out */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log Out"
          style={styles.menuItemRow}
          onPress={handleSignOut}
        >
          <View style={[styles.menuItemIconBg, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </View>
          <View style={styles.menuItemTextCol}>
            <Text style={[styles.menuItemTitle, { color: '#EF4444' }]}>Log Out</Text>
            <Text style={styles.menuItemSubtitle}>Signed in as {displayEmail}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#EF4444" />
        </Pressable>
      </View>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <View style={styles.footerBlock}>
        <Text style={styles.footerVersion}>EcoNexus Platform v2.4.1 (Clean City Initiative)</Text>
        <Text style={styles.footerSubtext}>Crafted for zero-waste &amp; transparent recycling 🌱</Text>
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

  // Top Header Bar
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSquare: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4338CA',
  },
  verifiedDot: {
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
  profileTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  memberSinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  memberSinceText: {
    fontSize: 12,
    color: '#6B7280',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },

  // EcoPoints Banner inside Profile Card
  ecoPointsBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  ecoPointsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ecoPointsIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ecoPointsTextGroup: {},
  ecoPointsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  ecoPointsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  redeemButton: {
    backgroundColor: '#047857',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Account Switcher Banner
  accountSwitcherBanner: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountSwitcherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  accountSwitcherIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountSwitcherText: {
    fontSize: 12,
    color: '#4B5563',
  },
  collectorModeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  collectorModeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSubIndicator: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Milestones Track
  milestonesTrack: {
    gap: 12,
    paddingVertical: 2,
  },
  milestoneCard: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
  },
  milestoneIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  milestoneDetail: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },

  // Address Cards
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  addressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  setDefaultButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  setDefaultButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  addressActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconActionButton: {
    padding: 4,
  },
  addressFullText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  accessCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  accessCalloutText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '500',
  },
  gpsVerificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  gpsVerificationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  buildingAccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  buildingAccessText: {
    fontSize: 11,
    color: '#6B7280',
  },
  addAddressDottedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
  },
  addAddressDottedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },

  // Collection Preferences Card
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    padding: 16,
  },
  prefSubHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  categoryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryChipSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#A7F3D0',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryChipTextSelected: {
    color: '#065F46',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleTextCol: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  toggleSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  voucherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 10,
    marginTop: 4,
  },
  voucherIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  voucherTextCol: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  voucherSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  voucherManageButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voucherManageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  // Account Management Menu Card
  menuContainerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemTextCol: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  menuItemValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  // Footer
  footerBlock: {
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 16,
    gap: 4,
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#6B7280',
  },
});
