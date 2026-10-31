/**
 * UserListScreen.tsx
 *
 * Admin screen: searchable, filterable, paginated list of all platform users.
 *
 * Features:
 *  • Live search (debounced 400 ms) by name or email
 *  • Role filter chips: ALL | USER | COLLECTOR | CENTER | ADMIN
 *  • Status filter chips: ALL | ACTIVE | PENDING | REJECTED | SUSPENDED
 *  • Pull-to-refresh
 *  • Infinite scroll (load next page on reaching end of list)
 *  • Tap to navigate → UserDetailScreen
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  ListRenderItem,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { adminService, AdminUser, GetUsersParams } from '../../services/admin.service';
import { AdminUsersStackParamList } from '../../navigation/AdminStackNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { UserRole, AccountStatus } from '../../types/user';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<AdminUsersStackParamList, 'UserList'>;

const ROLE_FILTERS: Array<{ label: string; value: UserRole | '' }> = [
  { label: 'All',       value: ''                 },
  { label: 'User',      value: 'USER'             },
  { label: 'Collector', value: 'COLLECTOR'        },
  { label: 'Center',    value: 'RECYCLING_CENTER' },
  { label: 'Admin',     value: 'ADMIN'            },
];

const STATUS_FILTERS: Array<{ label: string; value: AccountStatus | '' }> = [
  { label: 'All',      value: ''                     },
  { label: 'Active',   value: 'ACTIVE'               },
  { label: 'Pending',  value: 'PENDING_VERIFICATION' },
  { label: 'Rejected', value: 'REJECTED'             },
  { label: 'Suspended',value: 'SUSPENDED'            },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'USER':             return colors.roleUser;
    case 'COLLECTOR':        return colors.roleCollector;
    case 'RECYCLING_CENTER': return colors.roleCenter;
    case 'ADMIN':            return colors.roleAdmin;
    default:                 return colors.textMuted;
  }
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'USER':             return 'User';
    case 'COLLECTOR':        return 'Collector';
    case 'RECYCLING_CENTER': return 'Center';
    case 'ADMIN':            return 'Admin';
    default:                 return role;
  }
}

function getStatusColor(status: AccountStatus): string {
  switch (status) {
    case 'ACTIVE':               return colors.success;
    case 'PENDING_VERIFICATION': return colors.warning;
    case 'REJECTED':             return colors.error;
    case 'SUSPENDED':            return colors.error;
    default:                     return colors.textMuted;
  }
}

function getStatusLabel(status: AccountStatus): string {
  switch (status) {
    case 'ACTIVE':               return 'Active';
    case 'PENDING_VERIFICATION': return 'Pending';
    case 'REJECTED':             return 'Rejected';
    case 'SUSPENDED':            return 'Suspended';
    default:                     return status;
  }
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── UserCard ─────────────────────────────────────────────────────────────────

interface UserCardProps {
  user: AdminUser;
  onPress: () => void;
}

function UserCard({ user, onPress }: UserCardProps) {
  const roleColor   = getRoleColor(user.role);
  const statusColor = getStatusColor(user.status);
  const initials    = getInitials(user.name);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      testID={`user-card-${user.id}`}
    >
      {/* Avatar */}
      <View style={[styles.cardAvatar, { backgroundColor: roleColor + '22', borderColor: roleColor }]}>
        <Text style={[styles.cardAvatarText, { color: roleColor }]}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{user.name}</Text>
        <Text style={styles.cardEmail} numberOfLines={1}>{user.email}</Text>
        {user.phone ? (
          <Text style={styles.cardPhone} numberOfLines={1}>📱 {user.phone}</Text>
        ) : null}
      </View>

      {/* Badges */}
      <View style={styles.cardBadges}>
        <View style={[styles.badge, { backgroundColor: roleColor + '22', borderColor: roleColor }]}>
          <Text style={[styles.badgeText, { color: roleColor }]}>{getRoleLabel(user.role)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{getStatusLabel(user.status)}</Text>
        </View>
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  active: boolean;
  accentColor?: string;
  onPress: () => void;
}

function FilterChip({ label, active, accentColor = colors.roleAdmin, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        active && { backgroundColor: accentColor + '22', borderColor: accentColor },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && { color: accentColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── UserListScreen ───────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function UserListScreen() {
  const navigation = useNavigation<NavProp>();

  const [users,       setUsers]       = useState<AdminUser[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | ''>('');

  const pageRef      = useRef(1);
  const totalPagesRef = useRef(1);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounced = useRef('');

  // ── Skeleton shimmer ───────────────────────────────────────────────────────
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true,
      })
    ).start();
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(
    async (page: number, isRefresh = false) => {
      try {
        if (page === 1) isRefresh ? setRefreshing(true) : setLoading(true);
        else setLoadingMore(true);

        setError(null);

        const params: GetUsersParams = {
          search: searchDebounced.current || undefined,
          role:   roleFilter   || undefined,
          status: statusFilter || undefined,
          page,
          limit: PAGE_SIZE,
        };

        const res = await adminService.getUsers(params);
        totalPagesRef.current = res.meta.totalPages;

        setUsers((prev) => page === 1 ? res.data : [...prev, ...res.data]);
        pageRef.current = page;
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Failed to load users. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [roleFilter, statusFilter]
  );

  // Initial load
  useEffect(() => {
    pageRef.current = 1;
    fetchUsers(1);
  }, [fetchUsers]);

  // Search debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchDebounced.current = search;
      pageRef.current = 1;
      fetchUsers(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, fetchUsers]);

  const handleRefresh = useCallback(() => {
    pageRef.current = 1;
    fetchUsers(1, true);
  }, [fetchUsers]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || pageRef.current >= totalPagesRef.current) return;
    fetchUsers(pageRef.current + 1);
  }, [loadingMore, fetchUsers]);

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderUser: ListRenderItem<AdminUser> = useCallback(
    ({ item }) => (
      <UserCard
        user={item}
        onPress={() => navigation.navigate('UserDetail', { user: item })}
      />
    ),
    [navigation]
  );

  const keyExtractor = (item: AdminUser) => item.id;

  const shimmerOpacity = shimmerAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.7, 0.3] });

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[...Array(6)].map((_, i) => (
        <Animated.View key={i} style={[styles.skeletonCard, { opacity: shimmerOpacity }]}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <View style={[styles.skeletonLine, { width: '40%', marginTop: 6 }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderEmpty = () =>
    !loading ? (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={styles.emptyTitle}>No users found</Text>
        <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
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
        <Text style={styles.headerTitle}>Users</Text>
        <Text style={styles.headerSubtitle}>Manage platform members</Text>
      </View>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          testID="user-search-input"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} testID="user-search-clear">
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Role Filter Chips ────────────────────────────────────────────── */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Role</Text>
        <View style={styles.chips}>
          {ROLE_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={roleFilter === f.value}
              accentColor={colors.roleAdmin}
              onPress={() => { setRoleFilter(f.value as UserRole | ''); pageRef.current = 1; }}
            />
          ))}
        </View>
      </View>

      {/* ── Status Filter Chips ──────────────────────────────────────────── */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Status</Text>
        <View style={styles.chips}>
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={statusFilter === f.value}
              accentColor={colors.info}
              onPress={() => { setStatusFilter(f.value as AccountStatus | ''); pageRef.current = 1; }}
            />
          ))}
        </View>
      </View>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={() => fetchUsers(1)} testID="retry-btn">
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {loading ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={users}
          keyExtractor={keyExtractor}
          renderItem={renderUser}
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
          testID="user-list"
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
    paddingBottom: 12,
  },
  headerTitle:    { ...typography.h1, color: colors.textPrimary },
  headerSubtitle: { ...typography.label, color: colors.textMuted, marginTop: 2 },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 14,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: { color: colors.textMuted, fontSize: 16, paddingHorizontal: 4 },

  // Filters
  filterRow: {
    marginHorizontal: 24,
    marginBottom: 10,
  },
  filterLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },

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

  // User Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: { fontSize: 16, fontWeight: '700' },
  cardInfo:       { flex: 1, minWidth: 0 },
  cardName:       { ...typography.bodyMedium, color: colors.textPrimary },
  cardEmail:      { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  cardPhone:      { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  cardBadges:     { alignItems: 'flex-end', gap: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  badgeText: { ...typography.caption, fontWeight: '600' },
  chevron:   { fontSize: 20, color: colors.textMuted, lineHeight: 24 },

  // Skeleton
  skeletonContainer: { paddingHorizontal: 24, paddingTop: 4 },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  skeletonAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
  },
  skeletonLines: { flex: 1 },
  skeletonLine:  { height: 14, borderRadius: 7, backgroundColor: colors.surfaceAlt },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji:     { fontSize: 52, marginBottom: 12 },
  emptyTitle:     { ...typography.h3, color: colors.textPrimary, marginBottom: 8 },
  emptyText:      { ...typography.body, color: colors.textMuted, textAlign: 'center' },

  // Footer Loader
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
});
