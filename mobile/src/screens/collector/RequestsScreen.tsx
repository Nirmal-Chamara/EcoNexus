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
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { onboardingTheme } from '../../theme/onboardingTheme';
import { radii, spacing } from '../../theme';
import { pickupService } from '../../services/pickup.service';
import { collectorService } from '../../services/collector.service';
import { PickupRequest } from '../../types/collector';
import * as Location from 'expo-location';

const MATERIAL_CONFIG: Record<string, { emoji: string; bg: string; color: string; border: string }> = {
  plastic: { emoji: '🧴', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  paper: { emoji: '📄', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  cardboard: { emoji: '📦', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  metal: { emoji: '🥫', bg: '#F1F5F9', color: '#334155', border: '#CBD5E1' },
  glass: { emoji: '🍾', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  'e-waste': { emoji: '💻', bg: '#F3E8FF', color: '#6B21A8', border: '#D8B4FE' },
  multi: { emoji: '📦', bg: '#ECFDF5', color: '#047857', border: '#6EE7B7' },
};

function getMaterialBadge(type: string) {
  const lower = (type || '').toLowerCase();
  for (const [k, v] of Object.entries(MATERIAL_CONFIG)) {
    if (lower.includes(k)) return v;
  }
  return { emoji: '♻️', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' };
}

export default function RequestsScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'NEARBY' | 'ASSIGNED'>('NEARBY');
  const [nearbyRequests, setNearbyRequests] = useState<PickupRequest[]>([]);
  const [assignedPickups, setAssignedPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const fetchNearby = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 6.9271; // Colombo default
      let lng = 79.8612;

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }

      const results = await pickupService.getNearbyPickups(lat, lng, 15000);
      setNearbyRequests(results || []);
    } catch {
      // Graceful fallback
    }
  }, []);

  const fetchAssigned = useCallback(async () => {
    try {
      const results = await collectorService.getAssignedPickups();
      setAssignedPickups(results || []);
    } catch {
      // Graceful fallback
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
      'Claim Collection Order',
      `Assign ${request.waste_type} pickup at ${request.address_text} to your route?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim & Start Route',
          style: 'default',
          onPress: async () => {
            try {
              setAcceptingId(request.id);
              await pickupService.acceptPickup(request.id);
              Alert.alert('Success 🎉', 'Pickup claimed! Check your "My Pickups" tab to start GPS navigation.');
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
    const badge = getMaterialBadge(item.waste_type);
    const distanceKm = item.distance_meters
      ? `${(item.distance_meters / 1000).toFixed(1)} km away`
      : 'Nearby Sector';
    const weightNum = Number(item.estimated_weight) || 0;
    const estPts = Math.round(weightNum * 25);

    return (
      <View style={styles.card}>
        {/* Top Badges Row */}
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={styles.typeBadgeEmoji}>{badge.emoji}</Text>
            <Text style={[styles.typeBadgeText, { color: badge.color }]}>{item.waste_type}</Text>
          </View>

          <View style={styles.distanceBadge}>
            <Ionicons name="location-outline" size={12} color="#059669" />
            <Text style={styles.distanceText}>{distanceKm}</Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.addressRow}>
          <Ionicons name="home-outline" size={16} color="#059669" style={{ marginTop: 2 }} />
          <Text style={styles.cardAddress}>{item.address_text}</Text>
        </View>

        {/* Meta Stats Chips */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>⚖️ {weightNum > 0 ? `${weightNum.toFixed(1)} kg` : 'Pre-sorted'}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>🪙 ~{estPts > 0 ? estPts : 150} pts</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>🕒 {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
          </View>
        </View>

        {/* Manifest & Instructions */}
        {item.notes ? (
          <View style={styles.notesBox}>
            <Ionicons name="chatbox-ellipses-outline" size={14} color="#64748B" style={{ marginTop: 2 }} />
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        ) : null}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.claimButton, acceptingId === item.id && styles.claimButtonDisabled]}
          disabled={acceptingId === item.id}
          onPress={() => handleAcceptRequest(item)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Claim This Collection"
        >
          {acceptingId === item.id ? (
            <View style={styles.btnContent}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.claimButtonText}>Claiming Order...</Text>
            </View>
          ) : (
            <View style={styles.btnContent}>
              <Ionicons name="checkmark-circle-outline" size={17} color="#FFFFFF" />
              <Text style={styles.claimButtonText}>Claim This Collection</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderAssignedItem = ({ item }: { item: PickupRequest }) => {
    const badge = getMaterialBadge(item.waste_type);
    const isCompleted = item.status === 'COMPLETED';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('RequestDetails', { pickupId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={styles.typeBadgeEmoji}>{badge.emoji}</Text>
            <Text style={[styles.typeBadgeText, { color: badge.color }]}>{item.waste_type}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isCompleted
                ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }
                : { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isCompleted ? { color: '#047857' } : { color: '#92400E' },
              ]}
            >
              {isCompleted ? '✓ Completed' : '⏳ In Progress'}
            </Text>
          </View>
        </View>

        <View style={styles.addressRow}>
          <Ionicons name="navigate-circle-outline" size={16} color="#059669" style={{ marginTop: 2 }} />
          <Text style={styles.cardAddress}>{item.address_text}</Text>
        </View>

        {item.user_name ? (
          <Text style={styles.customerLine}>
            👤 Resident: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{item.user_name}</Text>{' '}
            {item.user_phone ? `(${item.user_phone})` : ''}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {item.estimated_weight ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>⚖️ {Number(item.estimated_weight).toFixed(1)} kg</Text>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <Text style={styles.metaChipText}>
              Assigned: {new Date(item.assigned_at || item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.assignedCardFooter}>
          <Text style={styles.assignedCardFooterText}>
            Tap to open live GPS navigation & smart digital scale →
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── 1. Top Bar ─────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.topBadge}>
          <Ionicons name="radio" size={13} color="#059669" />
          <Text style={styles.topBadgeText}>SECTOR DISPATCH • LIVE BROADCAST</Text>
        </View>
        <Text style={styles.screenTitle}>Pickup Requests</Text>
        <Text style={styles.screenSubtitle}>
          Open recyclable batches awaiting collection in your sector
        </Text>
      </View>

      {/* ── 2. Segmented Tabs ─────────────────────────────────── */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tabButton, tab === 'NEARBY' && styles.activeTabButton]}
          onPress={() => setTab('NEARBY')}
        >
          <Ionicons
            name="compass-outline"
            size={15}
            color={tab === 'NEARBY' ? '#065F46' : '#64748B'}
          />
          <Text style={[styles.tabText, tab === 'NEARBY' && styles.activeTabText]}>
            Nearby ({nearbyRequests.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, tab === 'ASSIGNED' && styles.activeTabButton]}
          onPress={() => setTab('ASSIGNED')}
        >
          <Ionicons
            name="car-outline"
            size={15}
            color={tab === 'ASSIGNED' ? '#065F46' : '#64748B'}
          />
          <Text style={[styles.tabText, tab === 'ASSIGNED' && styles.activeTabText]}>
            My Pickups ({assignedPickups.length})
          </Text>
        </Pressable>
      </View>

      {/* ── 3. Content List ─────────────────────────────────────── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Scanning sector for open requests...</Text>
        </View>
      ) : (
        <FlatList
          data={tab === 'NEARBY' ? nearbyRequests : assignedPickups}
          keyExtractor={(item) => item.id}
          renderItem={tab === 'NEARBY' ? renderNearbyItem : renderAssignedItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#059669"
              colors={['#059669']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name={tab === 'NEARBY' ? 'checkmark-circle-outline' : 'car-outline'}
                  size={36}
                  color="#059669"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {tab === 'NEARBY' ? 'All Clear in Your Sector!' : 'No Pickups Claimed Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'NEARBY'
                  ? 'All recent pickup requests in this zone have been claimed. Pull down to refresh for new incoming batches.'
                  : 'Check the "Nearby" tab to accept and schedule your next collection route.'}
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
    backgroundColor: '#F8FAF9',
  },

  /* Top Bar */
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 8,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  /* Segment Tabs */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    marginHorizontal: spacing.lg,
    marginVertical: 10,
    borderRadius: radii.pill,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radii.pill,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#065F46',
    fontWeight: '700',
  },

  /* List */
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 4,
    paddingBottom: 36,
    gap: 12,
  },

  /* Request Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    ...onboardingTheme.cardShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  typeBadgeEmoji: {
    fontSize: 13,
  },
  typeBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  /* Address */
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardAddress: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
  },

  /* Customer line */
  customerLine: {
    fontSize: 12,
    color: '#475569',
  },

  /* Meta Chips */
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaChip: {
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  /* Notes */
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F8FAF9',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesText: {
    flex: 1,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    fontStyle: 'italic',
  },

  /* Claim Button */
  claimButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 2,
  },
  claimButtonDisabled: {
    backgroundColor: '#047857',
    opacity: 0.8,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* Status Badge */
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Assigned Footer */
  assignedCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 2,
  },
  assignedCardFooterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },

  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },

  /* Loading */
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});
