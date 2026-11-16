/**
 * UserListScreen.tsx
 *
 * Admin screen: searchable, filterable, paginated list of all platform users.
 * Matches the Figma Admin User Directory design system.
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import EcoNexusLogo from '../../components/common/EcoNexusLogo';
import { adminService } from '../../services/admin.service';
import type { AdminUser, GetUsersParams } from '../../services/admin.service';
import type { AdminUsersStackParamList } from '../../navigation/AdminStackNavigator';
import type { AccountStatus, UserRole } from '../../types/user';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<AdminUsersStackParamList, 'UserList'>;

const ROLE_FILTERS: Array<{ label: string; value: UserRole | '' }> = [
  { label: 'All Users', value: '' },
  { label: 'Generators', value: 'USER' },
  { label: 'Collectors', value: 'COLLECTOR' },
  { label: 'Centers', value: 'RECYCLING_CENTER' },
  { label: 'Admins', value: 'ADMIN' },
];

const STATUS_FILTERS: Array<{ label: string; value: AccountStatus | '' }> = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Pending', value: 'PENDING_VERIFICATION' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Rejected', value: 'REJECTED' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleColor(role: UserRole): { bg: string; text: string } {
  switch (role) {
    case 'USER':
      return { bg: '#E0F2FE', text: '#0284C7' };
    case 'COLLECTOR':
      return { bg: '#FEF3C7', text: '#D97706' };
    case 'RECYCLING_CENTER':
      return { bg: '#F3E8FF', text: '#7E22CE' };
    case 'ADMIN':
      return { bg: '#DCFCE7', text: '#047857' };
    default:
      return { bg: '#F1F5F9', text: '#64748B' };
  }
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'USER':
      return 'Generator';
    case 'COLLECTOR':
      return 'Collector';
    case 'RECYCLING_CENTER':
      return 'Recycling Center';
    case 'ADMIN':
      return 'Admin';
    default:
      return role;
  }
}

function getStatusBadge(status: AccountStatus): { bg: string; text: string; label: string } {
  switch (status) {
    case 'ACTIVE':
      return { bg: '#DCFCE7', text: '#15803D', label: 'Active' };
    case 'PENDING_VERIFICATION':
      return { bg: '#FEF3C7', text: '#B45309', label: 'Pending' };
    case 'SUSPENDED':
      return { bg: '#FEE2E2', text: '#B91C1C', label: 'Suspended' };
    case 'REJECTED':
      return { bg: '#FEE2E2', text: '#B91C1C', label: 'Rejected' };
    default:
      return { bg: '#F1F5F9', text: '#64748B', label: status };
  }
}

// ─── UserCard ─────────────────────────────────────────────────────────────────

interface UserCardProps {
  user: AdminUser;
  onPress: () => void;
}

function UserCard({ user, onPress }: UserCardProps) {
  const roleStyle = getRoleColor(user.role);
  const statusStyle = getStatusBadge(user.status);

  const initials = (user.name || 'User')
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
      accessibilityLabel={`View details for ${user.name}`}
    >
      {/* Avatar */}
      <View style={[styles.cardAvatar, { backgroundColor: roleStyle.bg }]}>
        <Text style={[styles.cardAvatarText, { color: roleStyle.text }]}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {user.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <Text style={styles.cardEmail} numberOfLines={1}>
          {user.email}
        </Text>

        <View style={styles.cardMetaRow}>
          <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
            <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>
              {getRoleLabel(user.role)}
            </Text>
          </View>
          {user.phone ? (
            <Text style={styles.cardPhone} numberOfLines={1}>
              {user.phone}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </TouchableOpacity>
  );
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── UserListScreen ───────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function UserListScreen() {
  const navigation = useNavigation<NavProp>();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | ''>('');

  const pageRef = useRef(1);
  const totalPagesRef = useRef(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounced = useRef('');
  const hasFocusedRef = useRef(false);

  // ── Skeleton shimmer ───────────────────────────────────────────────────────
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

  // ── Fetch users ────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(
    async (page = 1, append = false) => {
      try {
        if (!append) setLoading(true);
        setError(null);

        const params: GetUsersParams = {
          page,
          limit: PAGE_SIZE,
          ...(searchDebounced.current ? { search: searchDebounced.current } : {}),
          ...(roleFilter ? { role: roleFilter } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        };

        const response = await adminService.getUsers(params);
        pageRef.current = Number(response.meta.page);
        totalPagesRef.current = Number(response.meta.totalPages);
        setTotalCount(Number(response.meta.total));

        if (append) {
          setUsers((prev) => [...prev, ...response.data]);
        } else {
          setUsers(response.data);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Failed to load users';
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [roleFilter, statusFilter]
  );

  // Re-fetch on focus
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) {
        fetchUsers(1, false);
      } else {
        hasFocusedRef.current = true;
      }
    }, [fetchUsers])
  );

  // Initial load & filter change
  useEffect(() => {
    pageRef.current = 1;
    fetchUsers(1, false);
  }, [fetchUsers]);

  // Search input handler with 400ms debounce
  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchDebounced.current = text.trim();
      pageRef.current = 1;
      fetchUsers(1, false);
    }, 400);
  };

  const handleClearSearch = () => {
    setSearch('');
    searchDebounced.current = '';
    pageRef.current = 1;
    fetchUsers(1, false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    pageRef.current = 1;
    fetchUsers(1, false);
  };

  const handleLoadMore = () => {
    if (loadingMore || loading || refreshing) return;
    if (pageRef.current >= totalPagesRef.current) return;
    setLoadingMore(true);
    fetchUsers(pageRef.current + 1, true);
  };

  const handleSelectUser = (user: AdminUser) => {
    navigation.navigate('UserDetail', { user });
  };

  const renderItem: ListRenderItem<AdminUser> = ({ item }) => (
    <UserCard user={item} onPress={() => handleSelectUser(item)} />
  );

  return (
    <View style={styles.screen}>
      {/* ── 1. Top Header ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <EcoNexusLogo size="sm" containerStyle={styles.logoContainer} />
          <View>
            <Text style={styles.brandTitle}>ECONEXUS</Text>
            <Text style={styles.brandSubtitle}>Platform User Directory</Text>
          </View>
        </View>

        <View style={styles.adminBadge}>
          <View style={styles.adminBadgeDot} />
          <Text style={styles.adminBadgeText}>ADMIN PORTAL</Text>
        </View>
      </View>

      {/* ── 2. KPI Summary Cards ─────────────────────────────────────── */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TOTAL RECIPIENTS</Text>
          <Text style={styles.kpiValue}>{totalCount > 0 ? totalCount.toLocaleString() : '14,820'}</Text>
          <View style={styles.kpiPillGreen}>
            <Text style={styles.kpiPillGreenText}>+8.4% MoM</Text>
          </View>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>ACTIVE FLEET</Text>
          <Text style={styles.kpiValue}>98.2%</Text>
          <View style={styles.kpiPillGreen}>
            <Text style={styles.kpiPillGreenText}>Verified Status</Text>
          </View>
        </View>
      </View>

      {/* ── 3. Search Bar ────────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or telephone..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── 4. Filter Chips ──────────────────────────────────────────── */}
      <View style={styles.filtersSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ROLE_FILTERS}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              active={roleFilter === item.value}
              onPress={() => setRoleFilter(item.value)}
            />
          )}
          contentContainerStyle={styles.filterChipsList}
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              active={statusFilter === item.value}
              onPress={() => setStatusFilter(item.value)}
            />
          )}
          contentContainerStyle={styles.filterChipsListSecondary}
        />
      </View>

      {/* ── 5. Error Banner ──────────────────────────────────────────── */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchUsers(1, false)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── 6. User List ─────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading directory records...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your search criteria or resetting role and status filters.
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
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

  // KPI Row
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  kpiPillGreen: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kpiPillGreenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },

  // Filters
  filtersSection: {
    marginBottom: 10,
  },
  filterChipsList: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterChipsListSecondary: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#A7F3D0',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#047857',
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
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardEmail: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardPhone: {
    fontSize: 11,
    color: '#64748B',
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
