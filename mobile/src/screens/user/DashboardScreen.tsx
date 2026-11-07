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
