import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { collectorService } from '../../services/collector.service';

const { width } = Dimensions.get('window');

type TimeframeType = 'WEEK' | 'MONTH' | 'ALL';
type FilterType = 'ALL' | 'COMPLETED' | 'SETTLED' | 'ADJUSTED';

interface CollectionSlip {
  id: string;
  batchCode: string;
  status: string;
  statusBadge: string;
  timestamp: string;
  generatorName: string;
  generatorSub: string;
  weight: number;
  payout: number;
  materials: string;
  badgeType: 'verified' | 'bounty' | 'adjusted';
}

export default function CollectionHistoryScreen() {
  const [timeframe, setTimeframe] = useState<TimeframeType>('MONTH');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const slips: CollectionSlip[] = [
    {
      id: '1',
      batchCode: '#ECO-8490',
      status: 'Verified & Settled',
      statusBadge: 'Direct to Wallet',
      timestamp: 'Yesterday at 4:15 PM',
      generatorName: 'Sarah C.',
      generatorSub: 'Colombo 07 Residential',
      materials: 'PET Plastic & Metal Cans',
      weight: 12.5,
      payout: 8.4,
      badgeType: 'verified',
    },
    {
      id: '2',
      batchCode: '#ECO-8488',
      status: 'Verified & Delivered',
      statusBadge: 'Direct to Wallet',
      timestamp: 'Yesterday at 11:30 AM',
      generatorName: 'Dilshan R.',
      generatorSub: 'Columbia Recyclers Depot',
      materials: 'Heavy Cardboard Bales',
      weight: 25.0,
      payout: 14.2,
      badgeType: 'verified',
    },
    {
      id: '3',
      batchCode: '#ECO-8481',
      status: 'High-Tier Bounty',
      statusBadge: 'High-Tier',
      timestamp: 'May 22, 2:45 PM',
      generatorName: 'Amaya Perera',
      generatorSub: 'Rajagiriya Hazard Vault',
      materials: 'E-Waste & Small Appliances',
      weight: 4.2,
      payout: 6.8,
      badgeType: 'bounty',
    },
    {
      id: '4',
      batchCode: '#ECO-8475',
      status: '2.1 kg Adjusted',
      statusBadge: 'Adjusted',
      timestamp: 'May 21, 10:15 AM',
      generatorName: 'K. Fernando',
      generatorSub: 'Apex Glass Sorting Plant',
      materials: 'Sorted Bottles & Culinary Glass',
      weight: 8.1,
      payout: 4.5,
      badgeType: 'adjusted',
    },
  ];

  const filteredSlips = slips.filter((s) => {
    const matchesSearch =
      s.batchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.generatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.materials.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'COMPLETED') return true;
    if (activeFilter === 'SETTLED') return s.status.includes('Settled') || s.status.includes('Delivered');
    if (activeFilter === 'ADJUSTED') return s.status.includes('Adjusted');
    return true;
  });

  const handleExportStatement = () => {
    const msg =
      'Tax & Earnings Statement Generated!\n• Period: YTD 2026\n• Total Revenue: $348.80\n• Certified Weights: 642.5 kg\n• Format: PDF & CSV downloaded with digital tare timestamps.';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Statement Exported 📄', msg);
    }
  };

  const handleViewSlip = (slip: CollectionSlip) => {
    const msg = `Collection Slip ${slip.batchCode}\n• Generator: ${slip.generatorName} (${slip.generatorSub})\n• Materials: ${slip.materials}\n• Weight: ${slip.weight.toFixed(1)} kg\n• Payout: +$${slip.payout.toFixed(2)}\n• Timestamp: ${slip.timestamp}\n• Depot Station: GreenTech Central Depot #04`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Certified Slip & Receipt 🧾', msg);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ── Top Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTag}>EARNINGS & VERIFICATION</Text>
          <Text style={styles.screenSubtitle}>Track your certified batches and impact payouts</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>⭐ +1,850 Pts</Text>
        </View>
      </View>

      {/* ── Timeframe Selector ─────────────────────────────────── */}
      <View style={styles.timeframeRow}>
        <TouchableOpacity
          style={[styles.timeframeBtn, timeframe === 'WEEK' && styles.timeframeBtnActive]}
          onPress={() => setTimeframe('WEEK')}
        >
          <Text style={[styles.timeframeText, timeframe === 'WEEK' && styles.timeframeTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.timeframeBtn, timeframe === 'MONTH' && styles.timeframeBtnActive]}
          onPress={() => setTimeframe('MONTH')}
        >
          <Text style={[styles.timeframeText, timeframe === 'MONTH' && styles.timeframeTextActive]}>
            This Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.timeframeBtn, timeframe === 'ALL' && styles.timeframeBtnActive]}
          onPress={() => setTimeframe('ALL')}
        >
          <Text style={[styles.timeframeText, timeframe === 'ALL' && styles.timeframeTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Big Net Hauler Revenue Card (Forest Green) ────────── */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueTopRow}>
          <Text style={styles.revenueLabel}>NET HAULER REVENUE</Text>
          <View style={styles.trendBadge}>
            <Ionicons name="trending-up" size={12} color="#FFFFFF" />
            <Text style={styles.trendText}>+18.4%</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.currencySymbol}>$</Text>
          <Text style={styles.revenueAmount}>348.80</Text>
          <Text style={styles.ytdTag}>YTD</Text>
        </View>

        <View style={styles.payoutStatusRow}>
          <Text style={styles.payoutSubtext}>
            Verified material payout delivered to hauler wallet
          </Text>
          <View style={styles.instantPayoutBadge}>
            <Text style={styles.instantPayoutText}>Instant Payout Enabled</Text>
          </View>
        </View>
      </View>

      {/* ── Quick Stats Grid ───────────────────────────────────── */}
      <View style={styles.statsGrid}>
        <View style={styles.statCol}>
          <View style={styles.statIconRow}>
            <Ionicons name="checkmark-done-circle" size={18} color="#059669" />
            <Text style={styles.statSub}>100% On-time</Text>
          </View>
          <Text style={styles.statValue}>38</Text>
          <Text style={styles.statLabel}>Completed Runs</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <View style={styles.statIconRow}>
            <Ionicons name="cube" size={18} color="#059669" />
            <Text style={styles.statSub}>Avg 16.9 kg</Text>
          </View>
          <Text style={styles.statValue}>642.5</Text>
          <Text style={styles.statLabel}>kg Recovered</Text>
        </View>
      </View>

      {/* ── Eco Impact Pill ────────────────────────────────────── */}
      <View style={styles.impactPill}>
        <View style={styles.impactIconBadge}>
          <Text style={{ fontSize: 16 }}>🌿</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.impactTitle}>164 kg CO2 Diverted</Text>
          <Text style={styles.impactSubtitle}>
            Equivalent to 9 mature trees preserved
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#059669" />
      </View>

      {/* ── Depot Certification Center ─────────────────────────── */}
      <View style={styles.depotRow}>
        <View style={styles.depotBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#059669" />
          <Text style={styles.depotBadgeText}>DEPOT CERTIFICATION CENTER</Text>
        </View>
        <Text style={styles.depotStationText}>GreenTech Central Depot #04</Text>
      </View>

      {/* ── Search Bar & Filter Chips ──────────────────────────── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search batch # (e.g. ECO-8490) or generator"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View style={styles.chipsRow}>
          {[
            { key: 'ALL', label: 'All (38)' },
            { key: 'COMPLETED', label: 'Completed (35)' },
            { key: 'SETTLED', label: 'Settled (31)' },
            { key: 'ADJUSTED', label: 'Adjusted (2)' },
          ].map((c) => {
            const isSelected = activeFilter === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setActiveFilter(c.key as FilterType)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Verified Collection Slips Header ───────────────────── */}
      <View style={styles.slipsSectionHeader}>
        <Text style={styles.slipsSectionTitle}>Verified Collection Slips</Text>
        <Text style={styles.slipsSectionMeta}>Latest settled</Text>
      </View>

      {/* ── Collection Slips List ──────────────────────────────── */}
      {filteredSlips.map((slip) => (
        <View key={slip.id} style={styles.slipCard}>
          <View style={styles.slipTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.slipCode}>{slip.batchCode}</Text>
              <View
                style={[
                  styles.slipStatusBadge,
                  slip.badgeType === 'bounty' && styles.bountyBadge,
                  slip.badgeType === 'adjusted' && styles.adjustedBadge,
                ]}
              >
                <Text
                  style={[
                    styles.slipStatusText,
                    slip.badgeType === 'bounty' && styles.bountyText,
                    slip.badgeType === 'adjusted' && styles.adjustedText,
                  ]}
                >
                  {slip.status}
                </Text>
              </View>
            </View>

            <View style={styles.payoutCol}>
              <Text style={styles.payoutAmount}>+${slip.payout.toFixed(2)}</Text>
              <Text style={styles.payoutWalletNote}>{slip.statusBadge}</Text>
            </View>
          </View>

          <Text style={styles.slipTimestamp}>{slip.timestamp}</Text>

          <View style={styles.slipDetailsRow}>
            <View style={styles.generatorAvatarBox}>
              <Text style={{ fontSize: 18 }}>📦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.generatorNameText}>Generator: {slip.generatorName}</Text>
              <Text style={styles.materialsText}>{slip.materials}</Text>
              <Text style={styles.generatorLocationText}>{slip.generatorSub}</Text>
            </View>
            <View style={styles.weightBox}>
              <Text style={styles.weightNumber}>{slip.weight.toFixed(1)}</Text>
              <Text style={styles.weightUnit}>kg</Text>
            </View>
          </View>

          <View style={styles.slipFooterRow}>
            <TouchableOpacity
              style={styles.viewSlipBtn}
              onPress={() => handleViewSlip(slip)}
            >
              <Ionicons name="document-text-outline" size={13} color="#059669" />
              <Text style={styles.viewSlipText}>View Slip & Receipt</Text>
            </TouchableOpacity>

            <View style={styles.certPill}>
              <Ionicons name="ribbon-outline" size={12} color="#15803D" />
              <Text style={styles.certPillText}>Certificate</Text>
            </View>
          </View>
        </View>
      ))}

      {/* ── Master Hauler Perk Card ────────────────────────────── */}
      <View style={styles.perkCard}>
        <View style={styles.perkIconBadge}>
          <Text style={{ fontSize: 20 }}>🎖️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.perkTitle}>Level 4 Master Hauler</Text>
          <Text style={styles.perkDesc}>
            Collect 107.5 kg more this month to unlock the 5% Depot Premium Bonus.
          </Text>
        </View>
      </View>

      {/* ── Export CTA Button ──────────────────────────────────── */}
      <TouchableOpacity
        style={styles.exportBtn}
        onPress={handleExportStatement}
      >
        <Ionicons name="download-outline" size={18} color="#FFFFFF" />
        <Text style={styles.exportBtnText}>
          Export Tax & Earnings Statement (PDF / CSV)
        </Text>
      </TouchableOpacity>
      <Text style={styles.exportMeta}>
        Includes digital tare weights & facility timestamps for audit
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
  },
  screenTag: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  screenSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pointsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },

  /* Timeframe */
  timeframeRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  timeframeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  timeframeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  timeframeTextActive: {
    fontWeight: '800',
    color: '#0F172A',
  },

  /* Big Revenue Card */
  revenueCard: {
    backgroundColor: '#064E3B',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  revenueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 10,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    color: '#34D399',
  },
  revenueAmount: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 2,
    letterSpacing: 1,
  },
  ytdTag: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A7F3D0',
    marginLeft: 8,
  },
  payoutStatusRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 12,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutSubtext: {
    fontSize: 11,
    color: '#D1FAE5',
    flex: 1,
    paddingRight: 8,
  },
  instantPayoutBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  instantPayoutText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Stats Grid */
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },

  /* Impact Pill */
  impactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
    gap: 10,
  },
  impactIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  impactSubtitle: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 1,
  },

  /* Depot Row */
  depotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 14,
  },
  depotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  depotBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  depotStationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  /* Search & Filter */
  searchSection: {
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#064E3B',
    borderColor: '#064E3B',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Slips Header */
  slipsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slipsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  slipsSectionMeta: {
    fontSize: 11,
    color: '#64748B',
  },

  /* Slip Card */
  slipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  slipTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  slipCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  slipStatusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bountyBadge: {
    backgroundColor: '#FEF3C7',
  },
  adjustedBadge: {
    backgroundColor: '#E0F2FE',
  },
  slipStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  bountyText: {
    color: '#B45309',
  },
  adjustedText: {
    color: '#0369A1',
  },
  payoutCol: {
    alignItems: 'flex-end',
  },
  payoutAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  payoutWalletNote: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  slipTimestamp: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  slipDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  generatorAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  generatorNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  materialsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 1,
  },
  generatorLocationText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  weightBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  weightNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  weightUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  slipFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewSlipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewSlipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  certPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  certPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },

  /* Perk Card */
  perkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
    gap: 12,
  },
  perkIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  perkDesc: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },

  /* Export CTA */
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064E3B',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  exportBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  exportMeta: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
});
