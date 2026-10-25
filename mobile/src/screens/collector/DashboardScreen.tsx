import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { collectorService } from '../../services/collector.service';
import { pickupService } from '../../services/pickup.service';
import { CollectorProfile, PickupRequest } from '../../types/collector';
import * as Location from 'expo-location';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CollectorProfile | null>(null);
  const [assignedPickups, setAssignedPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [profileData, pickupsData] = await Promise.all([
        collectorService.getProfile().catch(() => null),
        collectorService.getAssignedPickups().catch(() => []),
      ]);
      setProfile(profileData);
      setAssignedPickups(pickupsData || []);
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

  const handleToggleAvailability = async (value: boolean) => {
    try {
      setProfile((prev) => (prev ? { ...prev, is_available: value } : null));
      await collectorService.updateProfile({ isAvailable: value });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update availability status.');
      // Revert on failure
      setProfile((prev) => (prev ? { ...prev, is_available: !value } : null));
    }
  };

  const handleSyncLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to broadcast your GPS.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await collectorService.updateLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      Alert.alert('Success', 'GPS coordinates synchronized with EcoNexus network.');
      loadData();
    } catch (e: any) {
      Alert.alert('Sync Failed', e.message || 'Unable to get location.');
    }
  };

  const handleAdvancePickup = async (pickupId: string, nextStatus: 'IN_TRANSIT' | 'COMPLETED') => {
    try {
      setIsUpdatingStatus(true);
      await pickupService.updatePickupStatus(pickupId, nextStatus);
      Alert.alert('Success', `Pickup status updated to ${nextStatus.replace('_', ' ')}.`);
      loadData();
    } catch (e: any) {
      Alert.alert('Update Failed', e.message || 'Could not advance pickup status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.roleCollector} />
      </View>
    );
  }

  const activeJob = assignedPickups.find(
    (p) => p.status === 'ACCEPTED' || p.status === 'IN_TRANSIT'
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.roleCollector}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeSubtitle}>Collector Portal</Text>
          <Text style={styles.welcomeTitle}>{user?.name || 'Collector'}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⚡ Collector</Text>
        </View>
      </View>

      {/* Online / Offline Toggle Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusInfo}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: profile?.is_available ? colors.primary : colors.textMuted },
            ]}
          />
          <View>
            <Text style={styles.statusTitle}>
              {profile?.is_available ? 'Ready for Collections' : 'Currently Offline'}
            </Text>
            <Text style={styles.statusDescription}>
              {profile?.is_available
                ? 'You will receive nearby notifications'
                : 'Turn on to accept incoming requests'}
            </Text>
          </View>
        </View>
        <Switch
          value={profile?.is_available ?? false}
          onValueChange={handleToggleAvailability}
          thumbColor={colors.white}
          trackColor={{ false: colors.border, true: colors.roleCollector }}
        />
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricEmoji}>📦</Text>
          <Text style={styles.metricValue}>{profile?.completed_pickups ?? 0}</Text>
          <Text style={styles.metricLabel}>Completed</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricEmoji}>⭐</Text>
          <Text style={styles.metricValue}>
            {profile?.rating ? Number(profile.rating).toFixed(1) : '5.0'}
          </Text>
          <Text style={styles.metricLabel}>Rating</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricEmoji}>🚚</Text>
          <Text style={styles.metricValue}>{profile?.vehicle_type || 'Truck'}</Text>
          <Text style={styles.metricLabel}>Vehicle</Text>
        </View>
      </View>

      {/* Active Assignment Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Assignment</Text>
        <TouchableOpacity onPress={handleSyncLocation} style={styles.syncBtn}>
          <Text style={styles.syncBtnText}>📍 Sync GPS</Text>
        </TouchableOpacity>
      </View>

      {activeJob ? (
        <View style={styles.jobCard}>
          <View style={styles.jobTop}>
            <View style={styles.jobTypeBadge}>
              <Text style={styles.jobTypeText}>{activeJob.waste_type}</Text>
            </View>
            <View
              style={[
                styles.jobStatusBadge,
                activeJob.status === 'IN_TRANSIT' && styles.inTransitBadge,
              ]}
            >
              <Text style={styles.jobStatusText}>{activeJob.status.replace('_', ' ')}</Text>
            </View>
          </View>

          <Text style={styles.jobAddress}>📍 {activeJob.address_text}</Text>
          {activeJob.notes ? (
            <Text style={styles.jobNotes}>💬 "{activeJob.notes}"</Text>
          ) : null}

          {activeJob.user_name ? (
            <View style={styles.customerRow}>
              <Text style={styles.customerLabel}>Customer:</Text>
              <Text style={styles.customerValue}>
                {activeJob.user_name} ({activeJob.user_phone || 'No phone'})
              </Text>
            </View>
          ) : null}

          <View style={styles.jobActions}>
            {activeJob.status === 'ACCEPTED' ? (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.info }]}
                disabled={isUpdatingStatus}
                onPress={() => handleAdvancePickup(activeJob.id, 'IN_TRANSIT')}
              >
                <Text style={styles.actionBtnText}>🚀 Start Trip (In Transit)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                disabled={isUpdatingStatus}
                onPress={() => handleAdvancePickup(activeJob.id, 'COMPLETED')}
              >
                <Text style={styles.actionBtnText}>✅ Complete Collection</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={styles.emptyTitle}>No Active Pickups Right Now</Text>
          <Text style={styles.emptyText}>
            Go to the "Requests" tab to claim nearby waste collections.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeText: {
    color: colors.roleCollector,
    fontSize: 12,
    fontWeight: '700',
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  metricEmoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  syncBtn: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  syncBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  jobCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderFocus,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  jobTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  jobTypeBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jobTypeText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  jobStatusBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inTransitBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  jobStatusText: {
    color: colors.roleCollector,
    fontWeight: '700',
    fontSize: 12,
  },
  jobAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  jobNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  customerLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginRight: 6,
  },
  customerValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  jobActions: {
    marginTop: 4,
  },
  actionBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
