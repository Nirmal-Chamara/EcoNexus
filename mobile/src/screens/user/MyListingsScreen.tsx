import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Platform,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { pickupService } from '../../services/pickup.service';
import { getMyListings } from '../../services/waste.service';
import type { PickupRequest, PickupStatus } from '../../types/collector';
import type { WasteListing } from '../../types/waste';
import { onboardingTheme } from '../../theme/onboardingTheme';
import { radii, spacing } from '../../theme';

type Scope = 'active' | 'history';

interface UnifiedActivityItem {
  id: string;
  type: 'pickup' | 'listing';
  title: string;
  wasteType: string;
  status: string;
  address?: string;
  weight?: string | number;
  date: string;
  points?: number;
  pickupId?: string;
}

const MATERIAL_EMOJIS: Record<string, string> = {
  plastic: '🧴',
  paper: '📄',
  cardboard: '📦',
  metal: '🥫',
  glass: '🍾',
  'e-waste': '💻',
  electronic: '💻',
  textiles: '👕',
  organic: '🌱',
};

function getEmoji(type: string): string {
  const key = (type || '').toLowerCase();
  for (const [k, v] of Object.entries(MATERIAL_EMOJIS)) {
    if (key.includes(k)) return v;
  }
  return '♻️';
}

function getStatusBadge(status: string): { label: string; bg: string; color: string; border: string } {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'PENDING':
    case 'REQUESTED':
      return { label: 'Awaiting Hauler', bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
    case 'ACCEPTED':
    case 'SCHEDULED':
      return { label: 'Collector Assigned', bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' };
    case 'IN_TRANSIT':
      return { label: 'On The Way 🚛', bg: '#DCFCE7', color: '#059669', border: '#86EFAC' };
    case 'COMPLETED':
    case 'COLLECTED':
      return { label: 'Recycled ✓', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
    case 'CANCELLED':
      return { label: 'Cancelled', bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5' };
    case 'ACTIVE':
    default:
      return { label: 'Active', bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' };
  }
}

export default function MyListingsScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const [scope, setScope] = useState<Scope>('active');
  const [items, setItems] = useState<UnifiedActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newOrderBanner, setNewOrderBanner] = useState<string | null>(null);

  useEffect(() => {
    if (route?.params?.newlyCreatedId) {
      setNewOrderBanner(route.params.newlyCreatedId);
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => setNewOrderBanner(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [route?.params?.newlyCreatedId]);

  const load = useCallback(async () => {
    setError(null);
    try {
      // 1. Fetch real pickup requests from pickupService
      const pickupsPromise = pickupService.getMyPickups().catch(() => [] as PickupRequest[]);
      // 2. Fetch waste listings if available
      const listingsPromise = getMyListings(scope).catch(() => [] as WasteListing[]);

      const [pickups, listings] = await Promise.all([pickupsPromise, listingsPromise]);

      const pickupItems: UnifiedActivityItem[] = (pickups || []).map((p) => {
        const isHistory = p.status === 'COMPLETED' || p.status === 'CANCELLED';
        const weightNum = p.estimated_weight ? Number(p.estimated_weight) : 0;
        const pts = Math.round(weightNum * 30);

        return {
          id: p.id,
          type: 'pickup',
          title: `${p.waste_type} Collection`,
          wasteType: p.waste_type,
          status: p.status,
          address: p.address_text,
          weight: p.estimated_weight ? `${p.estimated_weight} kg` : undefined,
          date: new Date(p.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          points: pts > 0 ? pts : 150,
          pickupId: p.id,
        };
      });

      const listingItems: UnifiedActivityItem[] = (listings || []).map((l) => ({
        id: l.id,
        type: 'listing',
        title: l.title || `${l.category_name} Listing`,
        wasteType: l.category_name,
        status: l.status,
        weight: `${l.quantity} ${l.unit}`,
        date: new Date(l.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        points: Math.round(Number(l.quantity) * 20),
      }));

      // Filter by scope (active vs history)
      const all = [...pickupItems, ...listingItems];
      const filtered = all.filter((item) => {
        const s = item.status.toUpperCase();
        if (scope === 'active') {
          return s !== 'COMPLETED' && s !== 'COLLECTED' && s !== 'CANCELLED';
        } else {
          return s === 'COMPLETED' || s === 'COLLECTED' || s === 'CANCELLED';
        }
      });

      setItems(filtered);
    } catch (e: any) {
      setError(e?.message || 'Unable to load collection activity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scope]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function changeScope(s: Scope) {
    setLoading(true);
    setScope(s);
  }

  return (
    <View style={styles.container}>
      {/* ── 1. Top Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.topBadge}>
          <Ionicons name="receipt-outline" size={13} color="#059669" />
          <Text style={styles.topBadgeText}>COLLECTION ACTIVITY</Text>
        </View>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>
          Track your live pickups, collection history & EcoPoints
        </Text>
      </View>

      {/* ── 1.5. New Order Success Alert ────────────────────────────── */}
      {newOrderBanner && (
        <View style={styles.newOrderBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.newOrderBannerTitle}>Pickup Order Placed Successfully! 🎉</Text>
            <Text style={styles.newOrderBannerSub}>
              Order #{newOrderBanner.slice(0, 8)} is live. Verified eco-haulers in your area are notified.
            </Text>
          </View>
          <TouchableOpacity onPress={() => setNewOrderBanner(null)}>
            <Ionicons name="close" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── 2. Segmented Tabs ─────────────────────────────────────── */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tabButton, scope === 'active' && styles.tabButtonActive]}
          onPress={() => changeScope('active')}
          accessibilityRole="tab"
          accessibilityState={{ selected: scope === 'active' }}
        >
          <Ionicons
            name="timer-outline"
            size={16}
            color={scope === 'active' ? '#065F46' : '#64748B'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, scope === 'active' && styles.tabTextActive]}>
            Active Pickups
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, scope === 'history' && styles.tabButtonActive]}
          onPress={() => changeScope('history')}
          accessibilityRole="tab"
          accessibilityState={{ selected: scope === 'history' }}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={16}
            color={scope === 'history' ? '#065F46' : '#64748B'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, scope === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </Pressable>
      </View>

      {/* ── 3. Content List or States ─────────────────────────────── */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading collection activity...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
          <Text style={styles.errorTitle}>Could not load activity</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={['#059669']}
              tintColor="#059669"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="calendar-outline" size={36} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>
                {scope === 'active' ? 'No Active Pickups' : 'No Pickup History'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {scope === 'active'
                  ? 'Schedule doorstep collection for your sorted recyclable materials and earn EcoPoints.'
                  : 'Your past completed and verified doorstep pickups will appear here.'}
              </Text>

              {scope === 'active' && (
                <TouchableOpacity
                  style={styles.emptyCtaBtn}
                  onPress={() => navigation?.navigate('ListWaste')}
                >
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyCtaText}>Request Waste Pickup</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            const emoji = getEmoji(item.wasteType);

            return (
              <View style={styles.activityCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.emojiCircle}>
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </View>

                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>{item.date}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}
                  >
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {item.address && (
                  <View style={styles.addressRow}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooterRow}>
                  <View style={styles.pillsRow}>
                    {item.weight && (
                      <View style={styles.weightPill}>
                        <Ionicons name="scale-outline" size={13} color="#065F46" />
                        <Text style={styles.weightPillText}>{item.weight}</Text>
                      </View>
                    )}
                    {item.points && (
                      <View style={styles.pointsPill}>
                        <Text style={styles.pointsPillText}>🪙 +{item.points} Pts</Text>
                      </View>
                    )}
                  </View>

                  {item.pickupId && item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
                    <TouchableOpacity
                      style={styles.trackBtn}
                      onPress={() =>
                        navigation?.navigate('TrackTab', { pickupId: item.pickupId })
                      }
                    >
                      <Ionicons name="navigate-circle" size={15} color="#059669" />
                      <Text style={styles.trackBtnText}>Track GPS</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ── 4. Floating Action Button ─────────────────────────────── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation?.navigate('ListWaste')}
        accessibilityRole="button"
        accessibilityLabel="Request Waste Pickup"
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Request Pickup</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },

  /* Header */
  header: {
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
    marginBottom: 8,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },

  /* New Order Success Banner */
  newOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    marginHorizontal: spacing.lg,
    marginBottom: 8,
    padding: 12,
    ...onboardingTheme.glowShadow,
  },
  newOrderBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  newOrderBannerSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },

  /* Segmented Tabs */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 24,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginVertical: 10,
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    fontWeight: '700',
    color: '#065F46',
  },

  /* List */
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
    paddingBottom: 90,
    gap: 12,
  },

  /* Card */
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    ...onboardingTheme.cardShadow,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emojiCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  emojiText: {
    fontSize: 22,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  addressText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  weightPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  pointsPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pointsPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trackBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },

  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 32,
    marginTop: 20,
    ...onboardingTheme.cardShadow,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    ...onboardingTheme.glowShadow,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Center / Loading / Error */
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 18,
    padding: 24,
    marginHorizontal: spacing.lg,
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
    marginTop: 8,
  },
  errorBody: {
    fontSize: 12,
    color: '#7F1D1D',
    textAlign: 'center',
    marginVertical: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    ...onboardingTheme.glowShadow,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
