import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { pickupService } from '../../services/pickup.service';
import { collectorService } from '../../services/collector.service';
import { PickupRequest } from '../../types/collector';
import * as Location from 'expo-location';

export default function RequestsScreen() {
  const [tab, setTab] = useState<'NEARBY' | 'ASSIGNED'>('NEARBY');
  const [nearbyRequests, setNearbyRequests] = useState<PickupRequest[]>([]);
  const [assignedPickups, setAssignedPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchNearby = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 6.9271; // Default Colombo fallback
      let lng = 79.8612;

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }

      const results = await pickupService.getNearbyPickups(lat, lng, 10000);
      setNearbyRequests(results || []);
    } catch {
      // Fallback
    }
  }, []);

  const fetchAssigned = useCallback(async () => {
    try {
      const results = await collectorService.getAssignedPickups();
      setAssignedPickups(results || []);
    } catch {
      // Fallback
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (tab === 'NEARBY') {
      await fetchNearby();
    } else {
      await fetchAssigned();
    }
    setLoading(false);
    setRefreshing(false);
  }, [tab, fetchNearby, fetchAssigned]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAcceptRequest = (request: PickupRequest) => {
    Alert.alert(
      'Accept Pickup',
      `Are you sure you want to collect ${request.waste_type} at ${request.address_text}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              setAcceptingId(request.id);
              await pickupService.acceptPickup(request.id);
              Alert.alert('Success', 'Pickup request claimed! Check your Dashboard or Assigned tab.');
              // Refresh both
              fetchNearby();
              fetchAssigned();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to accept pickup request.');
            } finally {
              setAcceptingId(null);
            }
          },
        },
      ]
    );
  };

  const renderNearbyItem = ({ item }: { item: PickupRequest }) => {
    const distanceKm = item.distance_meters
      ? (item.distance_meters / 1000).toFixed(1) + ' km away'
      : 'Nearby';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.waste_type}</Text>
          </View>
          <Text style={styles.distanceText}>📍 {distanceKm}</Text>
        </View>

        <Text style={styles.cardAddress}>{item.address_text}</Text>

        <View style={styles.metaRow}>
          {item.estimated_weight ? (
            <Text style={styles.metaText}>⚖️ {item.estimated_weight} kg</Text>
          ) : null}
          <Text style={styles.metaText}>
            🕒 {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        {item.notes ? <Text style={styles.notesText}>💬 {item.notes}</Text> : null}

        <TouchableOpacity
          style={styles.acceptButton}
          disabled={acceptingId === item.id}
          onPress={() => handleAcceptRequest(item)}
        >
          {acceptingId === item.id ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.acceptButtonText}>Claim This Collection</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderAssignedItem = ({ item }: { item: PickupRequest }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.waste_type}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.status === 'COMPLETED'
                ? { backgroundColor: 'rgba(34, 197, 94, 0.2)' }
                : { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.status === 'COMPLETED'
                  ? { color: colors.primary }
                  : { color: colors.roleCollector },
              ]}
            >
              {item.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <Text style={styles.cardAddress}>{item.address_text}</Text>

        {item.user_name ? (
          <Text style={styles.customerLine}>
            👤 Customer: {item.user_name} ({item.user_phone || 'N/A'})
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {item.estimated_weight ? (
            <Text style={styles.metaText}>⚖️ {item.estimated_weight} kg</Text>
          ) : null}
          <Text style={styles.metaText}>
            Assigned: {new Date(item.assigned_at || item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Pickup Requests</Text>
      </View>

      {/* Segment Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'NEARBY' && styles.activeTabButton]}
          onPress={() => setTab('NEARBY')}
        >
          <Text style={[styles.tabText, tab === 'NEARBY' && styles.activeTabText]}>
            Nearby ({nearbyRequests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'ASSIGNED' && styles.activeTabButton]}
          onPress={() => setTab('ASSIGNED')}
        >
          <Text style={[styles.tabText, tab === 'ASSIGNED' && styles.activeTabText]}>
            My Pickups ({assignedPickups.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.roleCollector} />
        </View>
      ) : (
        <FlatList
          data={tab === 'NEARBY' ? nearbyRequests : assignedPickups}
          keyExtractor={(item) => item.id}
          renderItem={tab === 'NEARBY' ? renderNearbyItem : renderAssignedItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.roleCollector}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🍃</Text>
              <Text style={styles.emptyTitle}>
                {tab === 'NEARBY'
                  ? 'No Open Requests in Your Area'
                  : 'No Assigned Pickups Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'NEARBY'
                  ? 'Pull down to refresh or make sure your GPS is enabled.'
                  : 'Claim nearby requests from the Nearby tab.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: colors.roleCollector,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.textInverse,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  distanceText: {
    color: colors.roleCollector,
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  customerLine: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  notesText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  acceptButton: {
    backgroundColor: colors.roleCollector,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  acceptButtonText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
