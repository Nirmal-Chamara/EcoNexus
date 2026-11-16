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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { collectorService } from '../../services/collector.service';
import { PickupRequest } from '../../types/collector';
import { StatusBadge } from '../../components/status/StatusBadge';

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

  // Filter pickups by search term and category
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.address_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.waste_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.user_name && item.user_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      item.waste_type.toUpperCase() === selectedCategory.toUpperCase();

    return matchesSearch && matchesCategory;
  });

  const totalKg = history.reduce((sum, item) => sum + (Number(item.estimated_weight) || 0), 0);
  const totalTrips = history.length;

  const categories = ['ALL', 'PLASTIC', 'PAPER', 'METAL', 'GLASS', 'E-WASTE'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Collection History</Text>
        <Text style={styles.subtitle}>Log of your completed waste collections</Text>
      </View>

      {/* Summary KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{totalTrips}</Text>
          <Text style={styles.kpiLabel}>Completed Trips</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{totalKg.toFixed(1)} kg</Text>
          <Text style={styles.kpiLabel}>Total Recycled</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{(totalKg * 1.5).toFixed(0)} pts</Text>
          <Text style={styles.kpiLabel}>Eco Impact</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by address or citizen name..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filter Pills */}
      <View style={styles.categoryScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryPill,
              selectedCategory === cat && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === cat && styles.categoryPillTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.roleCollector} />
          <Text style={styles.loadingText}>Loading completed collections...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>No Completed Pickups Found</Text>
              <Text style={styles.emptySubtitle}>
                {history.length === 0
                  ? 'Accepted collections that you mark as completed will appear here.'
                  : 'No collections match your filter criteria.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('RequestDetails', { pickupId: item.id })
              }
            >
              <View style={styles.cardHeader}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{item.waste_type}</Text>
                </View>
                <StatusBadge status="COMPLETED" size="small" />
              </View>

              <Text style={styles.cardAddress} numberOfLines={1}>
                📍 {item.address_text}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.metaText}>
                  ⚖️ {item.estimated_weight ? `${item.estimated_weight} kg` : 'N/A'}
                </Text>
                <Text style={styles.metaText}>
                  🕒 {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'Completed'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.roleCollector,
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 13,
  },
  categoryScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  categoryPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.roleCollector,
  },
  categoryPillText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  categoryPillTextActive: {
    color: colors.roleCollector,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#1C1607',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.roleCollector,
  },
  typeText: {
    color: colors.roleCollector,
    fontSize: 12,
    fontWeight: '700',
  },
  cardAddress: {
    color: colors.textPrimary,
    fontSize: 13,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 16,
  },
});

