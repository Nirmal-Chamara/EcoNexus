/**
 * VerificationQueueScreen.tsx
 *
 * Admin screen: paginated list of verification requests (PENDING / APPROVED / REJECTED).
 *
 * Features:
 *  • Status filter tabs: ALL | PENDING | APPROVED | REJECTED
 *  • Pull-to-refresh
 *  • Infinite scroll
 *  • Skeleton shimmer while loading
 *  • Pending count badge on PENDING tab
 *  • Tap to navigate → VerificationDetailScreen
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  adminService,
  VerificationRequest,
  VerificationStatus,
} from '../../services/admin.service';
import { AdminVerificationsStackParamList } from '../../navigation/AdminStackNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { UserRole } from '../../types/user';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<AdminVerificationsStackParamList, 'VerificationQueue'>;

const STATUS_TABS: Array<{ label: string; value: VerificationStatus | '' }> = [
  { label: 'All',      value: ''         },
  { label: 'Pending',  value: 'PENDING'  },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVerificationStatusColor(status: VerificationStatus): string {
  switch (status) {
    case 'PENDING':  return colors.warning;
    case 'APPROVED': return colors.success;
    case 'REJECTED': return colors.error;
    default:         return colors.textMuted;
  }
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'COLLECTOR':        return 'Waste Collector';
    case 'RECYCLING_CENTER': return 'Recycling Center';
    default:                 return role;
  }
}

function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'COLLECTOR':        return colors.roleCollector;
    case 'RECYCLING_CENTER': return colors.roleCenter;
    default:                 return colors.textMuted;
  }
}

function getInitials(name: string): string {
  return name.trim().split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return `${m}m ago`;
  } catch {
    return '';
  }
}

// ─── VerificationCard ─────────────────────────────────────────────────────────

interface VerificationCardProps {
  item: VerificationRequest;
  onPress: () => void;
}

function VerificationCard({ item, onPress }: VerificationCardProps) {
  const statusColor = getVerificationStatusColor(item.status);
  const roleColor   = getRoleColor(item.requested_role);
  const initials    = getInitials(item.user_name);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      testID={`verification-card-${item.id}`}
    >
      {/* Left accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />

      <View style={styles.cardBody}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          {/* Avatar */}
          <View style={[styles.cardAvatar, { backgroundColor: roleColor + '22', borderColor: roleColor }]}>
            <Text style={[styles.cardAvatarText, { color: roleColor }]}>{initials}</Text>
          </View>

          {/* Name + Email */}
          <View style={styles.cardMeta}>
            <Text style={styles.cardName} numberOfLines={1}>{item.user_name}</Text>
            <Text style={styles.cardEmail} numberOfLines={1}>{item.user_email}</Text>
          </View>

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        {/* Role + Org */}
        <View style={styles.cardDetails}>
          <View style={[styles.rolePill, { backgroundColor: roleColor + '22', borderColor: roleColor }]}>
            <Text style={[styles.rolePillText, { color: roleColor }]}>
              {getRoleLabel(item.requested_role)}
            </Text>
          </View>
          {item.organization_name ? (
            <Text style={styles.orgText} numberOfLines={1}>🏢 {item.organization_name}</Text>
          ) : null}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.timeText}>🕐 {timeAgo(item.created_at)}</Text>
          {item.document_url ? (
            <Text style={styles.docTag}>📄 Document attached</Text>
          ) : (
            <Text style={styles.noDocTag}>No document</Text>
          )}
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
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
  const activeColor = value === 'PENDING'  ? colors.warning
                    : value === 'APPROVED' ? colors.success
                    : value === 'REJECTED' ? colors.error
                    : colors.roleAdmin;
  return (
    <TouchableOpacity
      style={[styles.tab, active && { borderBottomWidth: 2, borderBottomColor: activeColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, active && { color: activeColor }]}>{label}</Text>
      {value === 'PENDING' && pendingCount != null && pendingCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── VerificationQueueScreen ──────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function VerificationQueueScreen() {
  const navigation = useNavigation<NavProp>();

  const [items,       setItems]       = useState<VerificationRequest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<VerificationStatus | ''>('PENDING');

  const pageRef       = useRef(1);
  const totalPagesRef = useRef(1);

  // Shimmer
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchItems = useCallback(
    async (page: number, isRefresh = false) => {
      try {
        if (page === 1) isRefresh ? setRefreshing(true) : setLoading(true);
        else setLoadingMore(true);
        setError(null);

        const res = await adminService.getVerifications({
          status: activeTab || undefined,
          page,
          limit: PAGE_SIZE,
        });

        totalPagesRef.current = res.meta.totalPages;
        setItems((prev) => page === 1 ? res.data : [...prev, ...res.data]);
        pageRef.current = page;

        // Fetch pending count for badge when on "All" or "Pending" tab
        if (page === 1 && (activeTab === '' || activeTab === 'PENDING')) {
          const pendingRes = await adminService.getVerifications({ status: 'PENDING', limit: 1 });
          setPendingCount(pendingRes.meta.total);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Failed to load verifications.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    pageRef.current = 1;
    fetchItems(1);
  }, [fetchItems]);

  const handleRefresh   = useCallback(() => { pageRef.current = 1; fetchItems(1, true); }, [fetchItems]);
  const handleLoadMore  = useCallback(() => {
    if (loadingMore || pageRef.current >= totalPagesRef.current) return;
    fetchItems(pageRef.current + 1);
  }, [loadingMore, fetchItems]);

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderItem: ListRenderItem<VerificationRequest> = useCallback(
    ({ item }) => (
      <VerificationCard
        item={item}
        onPress={() => navigation.navigate('VerificationDetail', { verification: item })}
      />
    ),
    [navigation]
  );

  const keyExtractor = (item: VerificationRequest) => item.id;

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1], outputRange: [0.3, 0.7, 0.3],
  });

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[...Array(5)].map((_, i) => (
        <Animated.View key={i} style={[styles.skeletonCard, { opacity: shimmerOpacity }]}>
          <View style={styles.skeletonAccent} />
          <View style={styles.skeletonBody}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonLines}>
              <View style={[styles.skeletonLine, { width: '55%' }]} />
              <View style={[styles.skeletonLine, { width: '38%', marginTop: 6 }]} />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderEmpty = () =>
    !loading ? (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>
          {activeTab === 'PENDING' ? '🎉' : '📭'}
        </Text>
        <Text style={styles.emptyTitle}>
          {activeTab === 'PENDING' ? 'Queue is clear!' : 'No requests found'}
        </Text>
        <Text style={styles.emptyText}>
          {activeTab === 'PENDING'
            ? 'There are no pending verification requests right now.'
            : 'No verification requests match the selected filter.'}
        </Text>
      </View>
    ) : null;

  const renderFooter = () =>
    loadingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.roleAdmin} size="small" />
      </View>
    ) : null;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verifications</Text>
        <Text style={styles.headerSubtitle}>Review role upgrade requests</Text>
      </View>

      {/* ── Status Tabs ─────────────────────────────────────────────────── */}
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

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={() => fetchItems(1)} testID="retry-btn">
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {loading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.roleAdmin}
              colors={[colors.roleAdmin]}
            />
          }
          testID="verification-list"
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 8,
  },
  headerTitle:    { ...typography.h1, color: colors.textPrimary },
  headerSubtitle: { ...typography.label, color: colors.textMuted, marginTop: 2 },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
  },
  tabText: { ...typography.label, color: colors.textMuted, fontWeight: '600' },
  badge: {
    backgroundColor: colors.warning,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { ...typography.caption, color: colors.textInverse, fontWeight: '700', lineHeight: 14 },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.error + '44',
    marginHorizontal: 24,
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText:  { ...typography.label, color: colors.error, flex: 1 },
  retryText:  { ...typography.label, color: colors.roleAdmin, marginLeft: 12 },

  // List
  listContent: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 4 },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardAccent: { width: 4 },
  cardBody:   { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardAvatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarText: { fontSize: 14, fontWeight: '700' },
  cardMeta:    { flex: 1, minWidth: 0 },
  cardName:    { ...typography.bodyMedium, color: colors.textPrimary },
  cardEmail:   { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12, borderWidth: 1,
  },
  statusDot:  { width: 5, height: 5, borderRadius: 3 },
  statusText: { ...typography.caption, fontWeight: '700' },
  cardDetails: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  rolePill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1,
  },
  rolePillText: { ...typography.caption, fontWeight: '600' },
  orgText:     { ...typography.caption, color: colors.textSecondary, flex: 1 },
  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText:    { ...typography.caption, color: colors.textMuted },
  docTag:      { ...typography.caption, color: colors.info },
  noDocTag:    { ...typography.caption, color: colors.textMuted },
  chevron:     { fontSize: 20, color: colors.textMuted, alignSelf: 'center', paddingRight: 12, lineHeight: 24 },

  // Skeleton
  skeletonContainer: { paddingHorizontal: 24, paddingTop: 4 },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
    height: 90,
  },
  skeletonAccent: { width: 4, backgroundColor: colors.surfaceAlt },
  skeletonBody:   { flex: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  skeletonAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt },
  skeletonLines:  { flex: 1 },
  skeletonLine:   { height: 13, borderRadius: 6, backgroundColor: colors.surfaceAlt },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji:     { fontSize: 52, marginBottom: 12 },
  emptyTitle:     { ...typography.h3, color: colors.textPrimary, marginBottom: 8 },
  emptyText:      { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  // Footer
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
});
