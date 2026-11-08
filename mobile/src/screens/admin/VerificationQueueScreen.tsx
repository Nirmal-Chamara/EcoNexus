/**
 * VerificationQueueScreen.tsx
 *
 * Admin screen: paginated list of verification requests (PENDING / APPROVED / REJECTED).
 * Enhanced with the EcoNexus Admin light theme.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  ListRenderItem,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import EcoNexusLogo from '../../components/common/EcoNexusLogo';
import { adminService } from '../../services/admin.service';
import type { VerificationRequest, VerificationStatus } from '../../services/admin.service';
import type { AdminVerificationsStackParamList } from '../../navigation/AdminStackNavigator';
import type { UserRole } from '../../types/user';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<AdminVerificationsStackParamList, 'VerificationQueue'>;

const STATUS_TABS: Array<{ label: string; value: VerificationStatus | '' }> = [
  { label: 'All Requests', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status: VerificationStatus): { bg: string; text: string; dot: string } {
  switch (status) {
    case 'PENDING':
      return { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' };
    case 'APPROVED':
      return { bg: '#DCFCE7', text: '#15803D', dot: '#10B981' };
    case 'REJECTED':
      return { bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' };
    default:
      return { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };
  }
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'COLLECTOR':
      return 'Hauler / Collector';
    case 'RECYCLING_CENTER':
      return 'Recycling Facility';
    default:
      return role;
  }
}

function getRolePill(role: UserRole): { bg: string; text: string } {
  if (role === 'COLLECTOR') return { bg: '#FEF3C7', text: '#D97706' };
  if (role === 'RECYCLING_CENTER') return { bg: '#F3E8FF', text: '#7E22CE' };
  return { bg: '#E0F2FE', text: '#0284C7' };
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── VerificationCard ─────────────────────────────────────────────────────────

interface VerificationCardProps {
  item: VerificationRequest;
  onPress: () => void;
}

function VerificationCard({ item, onPress }: VerificationCardProps) {
  const statusStyle = getStatusStyle(item.status);
  const roleStyle = getRolePill(item.requested_role);

  const initials = (item.user_name || 'Applicant')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Verification request for ${item.user_name}`}
    >
      <View style={styles.cardBody}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={[styles.cardAvatar, { backgroundColor: roleStyle.bg }]}>
            <Text style={[styles.cardAvatarText, { color: roleStyle.text }]}>{initials}</Text>
          </View>

          <View style={styles.cardMeta}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.user_name}
            </Text>
            <Text style={styles.cardEmail} numberOfLines={1}>
              {item.user_email}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>

        {/* Role + Organization */}
        <View style={styles.cardDetails}>
          <View style={[styles.rolePill, { backgroundColor: roleStyle.bg }]}>
            <Text style={[styles.rolePillText, { color: roleStyle.text }]}>
              {getRoleLabel(item.requested_role)}
            </Text>
          </View>
          {item.organization_name ? (
            <Text style={styles.orgText} numberOfLines={1}>
              {item.organization_name}
            </Text>
          ) : null}
        </View>

        {/* Footer info */}
        <View style={styles.cardFooter}>
          <View style={styles.timeTag}>
            <Ionicons name="time-outline" size={13} color="#64748B" style={{ marginRight: 3 }} />
            <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
          </View>

          {item.document_url ? (
            <View style={styles.docTagWrapper}>
              <Ionicons name="document-attach-outline" size={13} color="#059669" style={{ marginRight: 3 }} />
              <Text style={styles.docTag}>Document Attached</Text>
            </View>
          ) : (
            <Text style={styles.noDocTag}>No document</Text>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#94A3B8" style={{ alignSelf: 'center', marginRight: 12 }} />
    </TouchableOpacity>
  );
}

// ─── StatusTab ────────────────────────────────────────────────────────────────

interface StatusTabProps {
  label: string;
  value: VerificationStatus | '';
  active: boolean;
  pendingCount?: number;
  onPress: () => void;
}

function StatusTab({ label, value, active, pendingCount, onPress }: StatusTabProps) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
      {value === 'PENDING' && typeof pendingCount === 'number' && pendingCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── VerificationQueueScreen ──────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function VerificationQueueScreen() {
  const navigation = useNavigation<NavProp>();

  const [activeTab, setActiveTab] = useState<VerificationStatus | ''>('PENDING');
  const [items, setItems] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number | undefined>(undefined);

  const pageRef = useRef(1);
  const totalPagesRef = useRef(1);
  const hasFocusedRef = useRef(false);

  // ── Skeleton Shimmer Animation ─────────────────────────────────────────────
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  // ── Fetch Pending Count (badge) ───────────────────────────────────────────
  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await adminService.getVerifications({ status: 'PENDING', page: 1, limit: 1 });
      setPendingCount(res.meta.total);
    } catch {
      // Non-fatal — badge remains undefined
    }
  }, []);

  // ── Fetch Page ─────────────────────────────────────────────────────────────
  const fetchItems = useCallback(
    async (page = 1, append = false) => {
      try {
        if (!append) setLoading(true);
        setError(null);

        const response = await adminService.getVerifications({
          status: activeTab,
          page,
          limit: PAGE_SIZE,
        });

        pageRef.current = Number(response.meta.page);
        totalPagesRef.current = Number(response.meta.totalPages);

        if (append) {
          setItems((prev) => [...prev, ...response.data]);
        } else {
          setItems(response.data);
        }

        if (activeTab === 'PENDING') {
          setPendingCount(response.meta.total);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Failed to load verifications';
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeTab]
  );

  // Focus effect: re-fetch on screen focus
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) {
        fetchItems(1, false);
        fetchPendingCount();
      } else {
        hasFocusedRef.current = true;
      }
    }, [fetchItems, fetchPendingCount])
  );

  // Tab switch effect
  useEffect(() => {
    pageRef.current = 1;
    fetchItems(1, false);
    fetchPendingCount();
  }, [fetchItems, fetchPendingCount]);

  const handleRefresh = () => {
    setRefreshing(true);
    pageRef.current = 1;
    fetchItems(1, false);
    fetchPendingCount();
  };

  const handleLoadMore = () => {
    if (loadingMore || loading || refreshing) return;
    if (pageRef.current >= totalPagesRef.current) return;
    setLoadingMore(true);
    fetchItems(pageRef.current + 1, true);
  };

  const handleSelect = (verification: VerificationRequest) => {
    navigation.navigate('VerificationDetail', { verification });
  };

  const renderItem: ListRenderItem<VerificationRequest> = ({ item }) => (
    <VerificationCard item={item} onPress={() => handleSelect(item)} />
  );

  return (
    <View style={styles.screen}>
      {/* ── 1. Top Header ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <EcoNexusLogo size="sm" containerStyle={styles.logoContainer} />
          <View>
            <Text style={styles.brandTitle}>ECONEXUS</Text>
            <Text style={styles.brandSubtitle}>Verifications & Alerts Queue</Text>
          </View>
        </View>

        <View style={styles.adminBadge}>
          <View style={styles.adminBadgeDot} />
          <Text style={styles.adminBadgeText}>ADMIN PORTAL</Text>
        </View>
      </View>

      {/* ── 2. Status Tabs ─────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {STATUS_TABS.map((t) => (
          <StatusTab
            key={t.value}
            label={t.label}
            value={t.value}
            active={activeTab === t.value}
            pendingCount={pendingCount}
            onPress={() => setActiveTab(t.value as VerificationStatus | '')}
          />
        ))}
      </View>

      {/* ── 3. Error Banner ──────────────────────────────────────────── */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchItems(1)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── 4. Main List ─────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading queue records...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={activeTab === 'PENDING' ? 'checkmark-circle-outline' : 'folder-open-outline'}
            size={52}
            color="#059669"
          />
          <Text style={styles.emptyTitle}>
            {activeTab === 'PENDING' ? 'Verification Queue is Clear!' : 'No Requests Found'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'PENDING'
              ? 'All applicant requests have been reviewed and processed.'
              : 'No verification records match the selected status filter.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#059669" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#059669"
              colors={['#059669']}
            />
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAF9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
    letterSpacing: 0.5,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  tabText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#064E3B',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 10,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 4,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rolePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orgText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    color: '#64748B',
  },
  docTagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docTag: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  noDocTag: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Loading & Empty
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
