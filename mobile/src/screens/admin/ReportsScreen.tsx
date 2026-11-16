import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import EcoNexusLogo from '../../components/common/EcoNexusLogo';

const { width } = Dimensions.get('window');

type PeriodTab = 'month' | 'week' | 'quarter';

export default function ReportsScreen() {
  const navigation = useNavigation();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodTab>('month');
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleExport = (reportName: string, format: string) => {
    setDownloadingReport(reportName);
    setTimeout(() => {
      setDownloadingReport(null);
      const msg = `Export complete! "${reportName}" (${format}) has been downloaded.`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Report Exported', msg);
      }
    }, 800);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
      }
    >
      {/* ── 1. Top Header ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <EcoNexusLogo size="sm" containerStyle={styles.logoContainer} />
          <View>
            <Text style={styles.brandTitle}>ECONEXUS</Text>
            <Text style={styles.brandSubtitle}>Reports & Intelligence</Text>
          </View>
        </View>

        <View style={styles.adminBadge}>
          <View style={styles.adminBadgeDot} />
          <Text style={styles.adminBadgeText}>ADMIN PORTAL</Text>
        </View>
      </View>

      {/* ── 2. Timeframe Selector ─────────────────────────────────────── */}
      <View style={styles.periodTabs}>
        <TouchableOpacity
          style={[styles.periodTab, selectedPeriod === 'month' && styles.periodTabActive]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text
            style={[
              styles.periodTabText,
              selectedPeriod === 'month' && styles.periodTabTextActive,
            ]}
          >
            This Month (Aug 2026)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodTab, selectedPeriod === 'week' && styles.periodTabActive]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text
            style={[
              styles.periodTabText,
              selectedPeriod === 'week' && styles.periodTabTextActive,
            ]}
          >
            Last 7 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.periodTab, selectedPeriod === 'quarter' && styles.periodTabActive]}
          onPress={() => setSelectedPeriod('quarter')}
        >
          <Text
            style={[
              styles.periodTabText,
              selectedPeriod === 'quarter' && styles.periodTabTextActive,
            ]}
          >
            Quarter to Date
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 3. Total Diverted Headline Card ───────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardMetaLabel}>TOTAL SOLID WASTE DIVERTED</Text>
          <View style={styles.growthBadge}>
            <Ionicons name="trending-up" size={13} color="#15803D" style={{ marginRight: 2 }} />
            <Text style={styles.growthBadgeText}>+12.4% MoM</Text>
          </View>
        </View>

        <Text style={styles.heroMetricValue}>184.2 TONS</Text>
        <Text style={styles.heroMetricSub}>Target: 200.0 Tons • 92.1% Achieved</Text>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: '92.1%' }]} />
        </View>
      </View>

      {/* ── 4. Secondary Metrics (Trips & EcoPoints) ───────────────────── */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>TOTAL FLEET TRIPS</Text>
          <Text style={styles.metricCardValue}>497.3</Text>
          <View style={styles.metricPill}>
            <Text style={styles.metricPillText}>+14.2% vs Last Mo</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>ECOPOINTS ISSUED</Text>
          <Text style={styles.metricCardValue}>1.24M</Text>
          <View style={styles.metricPill}>
            <Text style={styles.metricPillText}>$28,450.00 Redeemed</Text>
          </View>
        </View>
      </View>

      {/* ── 5. Intake Trends Visual ───────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Intake Trends</Text>
            <Text style={styles.cardSubtitle}>Daily incoming waste (Aug 1 - Aug 28)</Text>
          </View>
          <View style={styles.peakBadge}>
            <Ionicons name="flash" size={12} color="#D97706" style={{ marginRight: 3 }} />
            <Text style={styles.peakBadgeText}>Peak: 28.7 T (Aug 18)</Text>
          </View>
        </View>

        {/* Visual Bar Graph */}
        <View style={styles.chartContainer}>
          {[
            { day: 'Mon', height: 45, ton: '18.2' },
            { day: 'Tue', height: 60, ton: '22.4' },
            { day: 'Wed', height: 75, ton: '25.8' },
            { day: 'Thu', height: 95, ton: '28.7', peak: true },
            { day: 'Fri', height: 70, ton: '24.1' },
            { day: 'Sat', height: 50, ton: '19.5' },
            { day: 'Sun', height: 35, ton: '14.0' },
          ].map((bar, idx) => (
            <View key={idx} style={styles.chartColumn}>
              <Text style={styles.chartBarValue}>{bar.ton}T</Text>
              <View
                style={[
                  styles.chartBar,
                  { height: bar.height },
                  bar.peak && styles.chartBarPeak,
                ]}
              />
              <Text style={styles.chartBarDay}>{bar.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── 6. Material Composition ───────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Material Composition</Text>
            <Text style={styles.cardSubtitle}>Distribution by verified stream weight</Text>
          </View>
        </View>

        <View style={styles.compositionList}>
          {[
            { name: 'Plastic Containers (PET & HDPE)', pct: 34, tons: 62.6, color: '#10B981' },
            { name: 'Paper & Corrugated Cardboard', pct: 28, tons: 51.5, color: '#F59E0B' },
            { name: 'Mixed Glass & Cullet', pct: 18, tons: 33.1, color: '#3B82F6' },
            { name: 'E-Waste & Circuitry', pct: 12, tons: 22.1, color: '#8B5CF6' },
            { name: 'Organic & Compostable', pct: 8, tons: 14.7, color: '#EC4899' },
          ].map((item, idx) => (
            <View key={idx} style={styles.compRow}>
              <View style={styles.compLeft}>
                <View style={[styles.compDot, { backgroundColor: item.color }]} />
                <Text style={styles.compName}>{item.name}</Text>
              </View>
              <View style={styles.compRight}>
                <Text style={styles.compTons}>{item.tons} T</Text>
                <View style={[styles.compPctBadge, { backgroundColor: item.color + '1F' }]}>
                  <Text style={[styles.compPctText, { color: item.color }]}>{item.pct}%</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── 7. Regional Logistics Volume ──────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Regional Logistics Volume</Text>
            <Text style={styles.cardSubtitle}>Tonnage diverted per municipal cluster</Text>
          </View>
        </View>

        <View style={styles.regionalList}>
          {[
            { region: 'Colombo Metro Sector', tons: '82.4 T', pct: 45, color: '#059669' },
            { region: 'Gampaha Industrial Hub', tons: '53.4 T', pct: 29, color: '#0284C7' },
            { region: 'Ratnapura Agricultural Basin', tons: '48.3 T', pct: 26, color: '#D97706' },
          ].map((reg, idx) => (
            <View key={idx} style={styles.regionItem}>
              <View style={styles.regionHeader}>
                <Text style={styles.regionName}>{reg.region}</Text>
                <Text style={styles.regionTons}>{reg.tons}</Text>
              </View>
              <View style={styles.regionTrack}>
                <View
                  style={[
                    styles.regionFill,
                    { width: `${reg.pct}%`, backgroundColor: reg.color },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── 8. Municipal Weekly Digest Toggle ─────────────────────────── */}
      <View style={styles.digestCard}>
        <View style={styles.digestInfo}>
          <View style={styles.digestTitleRow}>
            <Ionicons name="mail-unread-outline" size={18} color="#059669" />
            <Text style={styles.digestTitle}>Municipal Weekly Digest</Text>
          </View>
          <Text style={styles.digestSubtitle}>
            Send automated executive sustainability report to CEA and ministry partners every Monday at 06:00 AM.
          </Text>
        </View>
        <Switch
          value={digestEnabled}
          onValueChange={setDigestEnabled}
          trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
          thumbColor={digestEnabled ? '#059669' : '#F3F4F6'}
        />
      </View>

      {/* ── 9. Export Standard Reports ─────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Export Standard Reports</Text>
            <Text style={styles.cardSubtitle}>Certified operational & ESG audit downloads</Text>
          </View>
        </View>

        <View style={styles.reportsList}>
          {[
            {
              title: 'Monthly Municipal Sustainability Audit',
              format: 'PDF / CSV',
              icon: 'document-text-outline',
            },
            {
              title: 'Hauler & Center Payout Reconciliation',
              format: 'XLSX / CSV',
              icon: 'cash-outline',
            },
            {
              title: 'Contamination & Variance Incident Log',
              format: 'CSV',
              icon: 'warning-outline',
            },
            {
              title: 'Raw Collection Dispatch Telemetry',
              format: 'JSON / CSV',
              icon: 'pulse-outline',
            },
          ].map((rep, idx) => {
            const isDownloading = downloadingReport === rep.title;
            return (
              <View key={idx} style={styles.reportRow}>
                <View style={styles.reportIconWrapper}>
                  <Ionicons name={rep.icon as any} size={18} color="#059669" />
                </View>
                <View style={styles.reportDetails}>
                  <Text style={styles.reportTitle}>{rep.title}</Text>
                  <Text style={styles.reportFormat}>{rep.format}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.exportBtn, isDownloading && styles.exportBtnDisabled]}
                  onPress={() => handleExport(rep.title, rep.format)}
                  disabled={isDownloading}
                >
                  <Ionicons name="download-outline" size={14} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.exportBtnText}>{isDownloading ? 'Exporting...' : 'Export'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.footerCaption}>
        EcoNexus Intelligence Engine v2.4.1 • Data synced with Sri Lanka Central Environmental Authority
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // 1. Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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

  // 2. Period Tabs
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  periodTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  periodTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  periodTabTextActive: {
    color: '#064E3B',
    fontWeight: '700',
  },

  // 3. Shared Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardMetaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  growthBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  heroMetricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  heroMetricSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },

  // 4. Secondary Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  metricCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricCardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  metricPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metricPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },

  // 5. Intake Trends
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  peakBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarValue: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  chartBar: {
    width: 22,
    borderRadius: 5,
    backgroundColor: '#A7F3D0',
  },
  chartBarPeak: {
    backgroundColor: '#059669',
  },
  chartBarDay: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },

  // 6. Composition
  compositionList: {
    gap: 10,
    marginTop: 4,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  compDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  compName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
  },
  compRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compTons: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  compPctBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  compPctText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // 7. Regional
  regionalList: {
    gap: 12,
    marginTop: 4,
  },
  regionItem: {},
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  regionName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  regionTons: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  regionTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  regionFill: {
    height: '100%',
    borderRadius: 3,
  },

  // 8. Digest Card
  digestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  digestInfo: {
    flex: 1,
    marginRight: 12,
  },
  digestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  digestTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  digestSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },

  // 9. Reports List
  reportsList: {
    gap: 10,
    marginTop: 4,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 12,
  },
  reportIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reportDetails: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  reportFormat: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  footerCaption: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
});
