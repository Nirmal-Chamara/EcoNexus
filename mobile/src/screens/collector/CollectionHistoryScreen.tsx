import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { collectorService } from '../../services/collector.service';
import { PickupRequest } from '../../types/collector';
import { onboardingTheme } from '../../theme/onboardingTheme';
import { radii, spacing } from '../../theme';

const CATEGORIES = ['ALL', 'PLASTIC', 'PAPER', 'METAL', 'GLASS', 'E-WASTE'];

const MATERIAL_EMOJIS: Record<string, string> = {
  plastic: '🧴',
  paper: '📄',
  metal: '🥫',
  glass: '🍾',
  'e-waste': '💻',
  multi: '📦',
};

function getEmoji(type: string) {
  const lower = (type || '').toLowerCase();
  for (const [k, v] of Object.entries(MATERIAL_EMOJIS)) {
    if (lower.includes(k)) return v;
  }
  return '♻️';
}

export default function CollectionHistoryScreen() {
  const navigation = useNavigation<any>();
  const [history, setHistory] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const loadHistory = useCallback(async () => {
    try {
      const data = await collectorService.getAssignedPickups();
      // Only keep completed pickups for history
      const completed = (data || []).filter((p) => p.status === 'COMPLETED');
      setHistory(completed);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.address_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.waste_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.user_name && item.user_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      item.waste_type.toUpperCase().includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const totalKg = history.reduce((sum, item) => sum + (Number(item.estimated_weight) || 0), 0);
  const totalTrips = history.length;
  const totalEcoPoints = Math.round(totalKg * 30);

  const renderHistoryItem = ({ item }: { item: PickupRequest }) => {
    const emoji = getEmoji(item.waste_type);
    const weightNum = Number(item.estimated_weight) || 0;
    const estPts = Math.round(weightNum * 30);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeEmoji}>{emoji}</Text>
            <Text style={styles.typeBadgeText}>{item.waste_type}</Text>
          </View>
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={13} color="#059669" />
            <Text style={styles.completedBadgeText}>Recycled ✓</Text>
          </View>
        </View>

        <Text style={styles.cardAddress}>{item.address_text}</Text>

        {item.user_name ? (
          <Text style={styles.customerLine}>
            👤 Resident: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{item.user_name}</Text>
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.metaText}>
            ⚖️ <Text style={{ fontWeight: '700', color: '#0F172A' }}>{weightNum.toFixed(1)} kg</Text>
          </Text>
          <Text style={styles.metaText}>
            🪙 +{estPts > 0 ? estPts : 150} pts
          </Text>
          <Text style={styles.metaText}>
            🕒 {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── 1. Top Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.topBadge}>
          <Ionicons name="receipt-outline" size={13} color="#059669" />
          <Text style={styles.topBadgeText}>RECYCLING LEDGER • VERIFIED TRACEABILITY</Text>
        </View>
        <Text style={styles.title}>Collection History</Text>
        <Text style={styles.subtitle}>Audit log of your completed doorstep waste collections</Text>
      </View>

      {/* ── 2. Summary KPI Metric Tiles ───────────────────────────── */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <Text style={styles.kpiEmoji}>🚚</Text>
          <Text style={[styles.kpiValue, { color: '#166534' }]}>{totalTrips}</Text>
          <Text style={styles.kpiLabel}>Completed Trips</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <Text style={styles.kpiEmoji}>⚖️</Text>
          <Text style={[styles.kpiValue, { color: '#1E40AF' }]}>{totalKg.toFixed(1)} kg</Text>
          <Text style={styles.kpiLabel}>Total Recycled</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
          <Text style={styles.kpiEmoji}>🪙</Text>
          <Text style={[styles.kpiValue, { color: '#92400E' }]}>{totalEcoPoints} pts</Text>
          <Text style={styles.kpiLabel}>EcoPoints Paid</Text>
        </View>
      </View>

      {/* ── 3. Search Bar ─────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by address, resident, or material..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── 4. Category Filter Pills ──────────────────────────────── */}
      <View style={styles.categoryScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 5. List Content ───────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading collection history...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
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
                <Ionicons name="newspaper-outline" size={32} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery || selectedCategory !== 'ALL'
                  ? 'No Matching Collections Found'
                  : 'No Completed Collections Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedCategory !== 'ALL'
                  ? 'Try adjusting your search query or switching to ALL materials.'
                  : 'Completed pickups will appear here with weighing verification and circular tracking metrics.'}
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
    marginBottom: 6,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
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
    marginTop: 2,
  },

  /* KPI Tiles */
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  kpiEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Search */
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: 44,
    ...onboardingTheme.cardShadow,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },

  /* Category Filter Scroll */
  categoryScrollContainer: {
    marginVertical: 6,
  },
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  categoryPillText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryPillTextActive: {
    color: '#065F46',
  },

  /* List */
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 6,
    paddingBottom: 36,
    gap: 10,
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
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
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeBadgeEmoji: {
    fontSize: 13,
  },
  typeBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  completedBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#047857',
  },
  cardAddress: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  customerLine: {
    fontSize: 11.5,
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11.5,
    color: '#64748B',
  },

  /* Loading & Empty */
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    gap: 10,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 320,
  },
});
