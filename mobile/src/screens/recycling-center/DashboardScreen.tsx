import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../hooks/useAuth';
import { onboardingTheme } from '../../theme/onboardingTheme';

const { width } = Dimensions.get('window');

interface SiloInfo {
  name: string;
  category: string;
  currentKg: number;
  maxKg: number;
  color: string;
  emoji: string;
}

const SILOS: SiloInfo[] = [
  { name: 'Silo A (Polymers)', category: 'Plastic', currentKg: 4200, maxKg: 5000, color: '#10B981', emoji: '🧴' },
  { name: 'Silo B (OCC Fiber)', category: 'Cardboard', currentKg: 3850, maxKg: 5000, color: '#F59E0B', emoji: '📦' },
  { name: 'Silo C (Metals)', category: 'Aluminium', currentKg: 3790, maxKg: 5000, color: '#8B5CF6', emoji: '🥫' },
];

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [scaleConnected, setScaleConnected] = useState(true);

  const facilityName =
    user?.name || 'Recycling center account';
  const totalCapacityKg = 15000;
  const currentIntakeKg = 11840;
  const capacityPercent = Math.round((currentIntakeKg / totalCapacityKg) * 100);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const handleActionNotice = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Top Facility Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <View style={styles.facilityBadgeRow}>
            <View style={styles.statusDot} />
            <Text style={styles.facilityCode}>LICENSED MRF-084 • OPERATIONAL</Text>
          </View>
          <Text style={styles.facilityTitle} numberOfLines={1}>
            {facilityName}
          </Text>
          <Text style={styles.shiftText}>Shift A (06:00 - 14:00) • Colombo South Sector</Text>
        </View>

        <TouchableOpacity
          style={styles.scaleStatusBtn}
          onPress={() =>
            handleActionNotice(
              'Weighbridge Status',
              scaleConnected
                ? 'Digital Weighbridge Scale #01 is calibrated and connected via Bluetooth IoT Gateway.'
                : 'Connecting to Bluetooth Scale Gateway...'
            )
          }
        >
          <Text style={styles.scaleIcon}>⚖️</Text>
          <View
            style={[
              styles.scaleIndicatorDot,
              { backgroundColor: scaleConnected ? '#10B981' : '#F59E0B' },
            ]}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── Facility Capacity Utilization Hero Card ────────────── */}
        <View style={styles.heroCapacityCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>STORAGE CAPACITY UTILIZATION</Text>
              <Text style={styles.heroMetricValue}>
                {(currentIntakeKg / 1000).toFixed(1)}{' '}
                <Text style={styles.heroMetricUnit}>/ {(totalCapacityKg / 1000).toFixed(1)} MT</Text>
              </Text>
            </View>
            <View
              style={[
                styles.capacityBadge,
                { backgroundColor: capacityPercent > 80 ? '#FEF3C7' : '#ECFDF5' },
              ]}
            >
              <Text
                style={[
                  styles.capacityBadgeText,
                  { color: capacityPercent > 80 ? '#B45309' : '#065F46' },
                ]}
              >
                {capacityPercent}% Full
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${capacityPercent}%`,
                  backgroundColor: capacityPercent > 80 ? '#F59E0B' : '#059669',
                },
              ]}
            />
          </View>

          <View style={styles.silosGrid}>
            {SILOS.map((silo, idx) => {
              const pct = Math.round((silo.currentKg / silo.maxKg) * 100);
              return (
                <View key={idx} style={styles.siloCard}>
                  <View style={styles.siloHeader}>
                    <Text style={styles.siloEmoji}>{silo.emoji}</Text>
                    <Text style={styles.siloPct}>{pct}%</Text>
                  </View>
                  <Text style={styles.siloName} numberOfLines={1}>
                    {silo.category}
                  </Text>
                  <Text style={styles.siloWeight}>
                    {(silo.currentKg / 1000).toFixed(1)} MT
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Key Operational KPIs ────────────────────────────────── */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiTile}>
            <View style={styles.kpiIconBox}>
              <Ionicons name="arrow-down-circle" size={18} color="#059669" />
            </View>
            <Text style={styles.kpiValue}>3,420 kg</Text>
            <Text style={styles.kpiLabel}>Today's Intake</Text>
            <Text style={[styles.kpiDelta, { color: '#059669' }]}>+12.4% vs avg</Text>
          </View>

          <View style={styles.kpiTile}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="sync-circle" size={18} color="#2563EB" />
            </View>
            <Text style={styles.kpiValue}>2,850 kg</Text>
            <Text style={styles.kpiLabel}>Throughput</Text>
            <Text style={[styles.kpiDelta, { color: '#2563EB' }]}>83.3% processed</Text>
          </View>

          <View style={styles.kpiTile}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="checkmark-done-circle" size={18} color="#D97706" />
            </View>
            <Text style={styles.kpiValue}>96.8%</Text>
            <Text style={styles.kpiLabel}>Purity Grade</Text>
            <Text style={[styles.kpiDelta, { color: '#D97706' }]}>Grade A standard</Text>
          </View>

          <View style={styles.kpiTile}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="cube" size={18} color="#7E22CE" />
            </View>
            <Text style={styles.kpiValue}>18 Bales</Text>
            <Text style={styles.kpiLabel}>Output Stock</Text>
            <Text style={[styles.kpiDelta, { color: '#7E22CE' }]}>Ready for offtake</Text>
          </View>
        </View>

        {/* ── Live Inbound Deliveries Awaiting Intake ─────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Inbound Deliveries in Queue</Text>
          <TouchableOpacity onPress={() => navigation.navigate('IncomingMaterials')}>
            <Text style={styles.sectionLink}>View All (3) →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inboundCard}>
          <View style={styles.inboundTopRow}>
            <View style={styles.streamBadge}>
              <Text style={styles.streamEmoji}>🧴</Text>
              <Text style={styles.streamName}>Plastic PET</Text>
            </View>
            <View style={styles.awaitingBadge}>
              <Text style={styles.awaitingText}>Awaiting Weigh-In</Text>
            </View>
          </View>

          <View style={styles.inboundDetailsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inboundHauler}>Truck WP-9214 • Kamal Perera</Text>
              <Text style={styles.inboundMeta}>Batch #MF-9042 • Ratnapura Commercial Zone</Text>
            </View>
            <Text style={styles.inboundWeight}>480.0 kg</Text>
          </View>

          <View style={styles.inboundActions}>
            <TouchableOpacity
              style={styles.verifyIntakeBtn}
              onPress={() => navigation.navigate('IncomingMaterials')}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.verifyIntakeText}>Verify &amp; Accept Batch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Active Processing Lines Snapshot ───────────────────── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Active Processing Lines</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Processing')}>
            <Text style={styles.sectionLink}>Manage Lines →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.linesList}>
          {/* Line 1 */}
          <View style={styles.lineCard}>
            <View style={styles.lineIndicatorCol}>
              <View style={[styles.lineDot, { backgroundColor: '#10B981' }]} />
              <View style={styles.lineConnector} />
            </View>
            <View style={styles.lineInfoCol}>
              <View style={styles.lineHeaderRow}>
                <Text style={styles.lineName}>Line 1: High-Density Polymer Granulator</Text>
                <View style={styles.runningPill}>
                  <Text style={styles.runningText}>RUNNING</Text>
                </View>
              </View>
              <Text style={styles.lineDesc}>Processing 600 kg PET bottles into clean export flakes</Text>
              <View style={styles.lineProgressRow}>
                <View style={styles.lineProgressBar}>
                  <View style={[styles.lineProgressFill, { width: '75%' }]} />
                </View>
                <Text style={styles.lineProgressText}>75% (450 kg)</Text>
              </View>
            </View>
          </View>

          {/* Line 2 */}
          <View style={styles.lineCard}>
            <View style={styles.lineIndicatorCol}>
              <View style={[styles.lineDot, { backgroundColor: '#10B981' }]} />
            </View>
            <View style={styles.lineInfoCol}>
              <View style={styles.lineHeaderRow}>
                <Text style={styles.lineName}>Line 2: OCC Hydraulic Baling Press</Text>
                <View style={styles.runningPill}>
                  <Text style={styles.runningText}>RUNNING</Text>
                </View>
              </View>
              <Text style={styles.lineDesc}>Compressing corrugated cardboard into 1.2 MT mill-size bales</Text>
              <View style={styles.lineProgressRow}>
                <View style={styles.lineProgressBar}>
                  <View style={[styles.lineProgressFill, { width: '40%' }]} />
                </View>
                <Text style={styles.lineProgressText}>40% (800 kg)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Quick Facility Actions ─────────────────────────────── */}
        <View style={styles.quickBar}>
          <TouchableOpacity
            style={styles.quickItem}
            onPress={() =>
              handleActionNotice(
                'Digital Scale Calibrated',
                'Zero-point tare reset confirmed. Ready for next incoming truck.'
              )
            }
          >
            <Ionicons name="speedometer-outline" size={20} color="#059669" />
            <Text style={styles.quickLabel}>Zero Tare</Text>
          </TouchableOpacity>

          <View style={styles.quickDivider} />

          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => navigation.navigate('IncomingMaterials')}
          >
            <Ionicons name="scan-outline" size={20} color="#0284C7" />
            <Text style={styles.quickLabel}>Scan Manifest</Text>
          </TouchableOpacity>

          <View style={styles.quickDivider} />

          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => navigation.navigate('Processing')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#7E22CE" />
            <Text style={styles.quickLabel}>New Batch</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  facilityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  facilityCode: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
  },
  facilityTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  shiftText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  scaleStatusBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scaleIcon: {
    fontSize: 20,
  },
  scaleIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 6,
    right: 6,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  scrollArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  /* Hero Capacity Card */
  heroCapacityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...onboardingTheme.cardShadow,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  heroMetricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  heroMetricUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  capacityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  capacityBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  silosGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  siloCard: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  siloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  siloEmoji: {
    fontSize: 14,
  },
  siloPct: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  siloName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  siloWeight: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },

  /* 4 KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiTile: {
    width: (width - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...onboardingTheme.cardShadow,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  kpiDelta: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  /* Inbound Card */
  inboundCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...onboardingTheme.cardShadow,
  },
  inboundTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  streamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  streamEmoji: {
    fontSize: 12,
  },
  streamName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  awaitingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  awaitingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  inboundDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inboundHauler: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  inboundMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  inboundWeight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  inboundActions: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  verifyIntakeBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  verifyIntakeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Processing Lines */
  linesList: {
    gap: 10,
  },
  lineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    ...onboardingTheme.cardShadow,
  },
  lineIndicatorCol: {
    alignItems: 'center',
    width: 20,
    paddingTop: 4,
    marginRight: 10,
  },
  lineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  lineInfoCol: {
    flex: 1,
  },
  lineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  lineName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    paddingRight: 6,
  },
  runningPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  runningText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  lineDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  lineProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lineProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  lineProgressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  lineProgressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Quick Bar */
  quickBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...onboardingTheme.cardShadow,
  },
  quickItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
});
