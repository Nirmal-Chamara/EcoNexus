import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');

type FilterType = 'PENDING' | 'ACTIVE' | 'FLAGGED';

export default function CollectorManagementScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('PENDING');

  const handleApprove = (name: string, vehicle: string) => {
    const msg = `Hauler Approved!\n• Name: ${name}\n• Vehicle: ${vehicle}\n• Status: Issued Hauler ID & GPS Dispatch Activated.`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Hauler Activated 🎉', msg);
    }
  };

  const handleReject = (name: string) => {
    const msg = `Application for ${name} has been rejected and applicant notified via SMS/email.`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Application Rejected', msg);
    }
  };

  const handleDownloadAudit = () => {
    const msg =
      'Fleet Compliance Audit Report (PDF) generated!\n• Active Haulers: 64\n• Compliance: 99.1%\n• Digital calibration certificates bundled.';
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Audit Downloaded 📄', msg);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.commandTag}>LOGISTICS COMMAND</Text>
          <Text style={styles.headerTitle}>Collector & Hauler Fleet</Text>
        </View>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={13} color="#059669" />
          <Text style={styles.adminBadgeText}>ADMIN PORTAL</Text>
        </View>
      </View>

      {/* ── Fleet Top Metrics ─────────────────────────────────── */}
      <View style={styles.metricsCard}>
        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>ACTIVE FLEET</Text>
          <View style={styles.metricValRow}>
            <Text style={styles.metricMainNumber}>64</Text>
            <Text style={styles.metricTotalNumber}>/ 72 Total</Text>
          </View>
          <Text style={styles.metricSub}>48 On Duty Now</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricCol}>
          <Text style={styles.metricLabel}>COMPLIANCE RATE</Text>
          <View style={styles.metricValRow}>
            <Text style={[styles.metricMainNumber, { color: '#059669' }]}>99.1%</Text>
          </View>
          <View style={styles.trendRow}>
            <Ionicons name="trending-up" size={12} color="#059669" />
            <Text style={styles.trendText}>+0.4% this week</Text>
          </View>
        </View>
      </View>

      {/* ── Filter Chips ─────────────────────────────────────── */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'PENDING' && styles.filterChipActive]}
          onPress={() => setActiveFilter('PENDING')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'PENDING' && styles.filterChipTextActive]}>
            Pending Approval (4)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'ACTIVE' && styles.filterChipActive]}
          onPress={() => setActiveFilter('ACTIVE')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'ACTIVE' && styles.filterChipTextActive]}>
            Active Haulers (64)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'FLAGGED' && styles.filterChipActive]}
          onPress={() => setActiveFilter('FLAGGED')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'FLAGGED' && styles.filterChipTextActive]}>
            Flagged (2)
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Urgent Approval Queue ─────────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.sectionTitle}>Urgent Approval Queue</Text>
          <View style={styles.urgentDot} />
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Queue', 'Opening full application pipeline...')}>
          <Text style={styles.reviewAllText}>Review All</Text>
        </TouchableOpacity>
      </View>

      {/* Application 1: Sunil Dharmasena */}
      <View style={styles.applicationCard}>
        <View style={styles.appTopRow}>
          <View style={styles.appAvatarCircle}>
            <Text style={{ fontSize: 20 }}>👨‍✈️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.applicantName}>Sunil Dharmasena</Text>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>Urgent</Text>
              </View>
            </View>
            <Text style={styles.applicantMeta}>Applied 2h ago • Colombo South 6</Text>
          </View>
        </View>

        {/* Vehicle Specs */}
        <View style={styles.vehicleInfoBox}>
          <Ionicons name="car" size={16} color="#059669" />
          <Text style={styles.vehicleInfoText}>
            Tata Ace Light Truck • WP-CAD-4912
          </Text>
          <Text style={styles.payloadTag}>850 kg Payload Capacity</Text>
        </View>

        {/* Verified Documents */}
        <View style={styles.docsSection}>
          <Text style={styles.docsLabel}>VERIFIED DOCUMENTS (3/3)</Text>
          <View style={styles.docsPillsRow}>
            <View style={styles.docPill}>
              <Ionicons name="checkmark-circle" size={13} color="#059669" />
              <Text style={styles.docPillText}>Driver License</Text>
            </View>
            <View style={styles.docPill}>
              <Ionicons name="checkmark-circle" size={13} color="#059669" />
              <Text style={styles.docPillText}>Police Clearance</Text>
            </View>
            <View style={styles.docPill}>
              <Ionicons name="checkmark-circle" size={13} color="#059669" />
              <Text style={styles.docPillText}>Revenue & Emission</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.primaryApproveBtn}
          onPress={() => handleApprove('Sunil Dharmasena', 'Tata Ace WP-CAD-4912')}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
          <Text style={styles.primaryApproveBtnText}>Approve & Issue Hauler ID</Text>
        </TouchableOpacity>

        <View style={styles.subActionsRow}>
          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={() => Alert.alert('Documents', 'Opening encrypted PDF document viewer...')}
          >
            <Ionicons name="document-text-outline" size={14} color="#334155" />
            <Text style={styles.inspectBtnText}>Inspect Docs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => handleReject('Sunil Dharmasena')}
          >
            <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Application 2: Kavindu Bandara */}
      <View style={styles.applicationCard}>
        <View style={styles.appTopRow}>
          <View style={styles.appAvatarCircle}>
            <Text style={{ fontSize: 20 }}>🛵</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.applicantName}>Kavindu Bandara</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>New</Text>
              </View>
            </View>
            <Text style={styles.applicantMeta}>Applied 5h ago • Colombo North</Text>
          </View>
        </View>

        <View style={styles.vehicleInfoBox}>
          <Ionicons name="bicycle" size={16} color="#059669" />
          <Text style={styles.vehicleInfoText}>Electric EcoTrike • WP-TRI-1100</Text>
          <Text style={styles.payloadTag}>250 kg Payload Capacity (Zero-Emission)</Text>
        </View>

        <View style={styles.docsSection}>
          <Text style={styles.docsLabel}>DOCUMENT STATUS (1 PENDING)</Text>
          <View style={styles.docsPillsRow}>
            <View style={styles.docPill}>
              <Ionicons name="checkmark-circle" size={13} color="#059669" />
              <Text style={styles.docPillText}>National ID Verified</Text>
            </View>
            <View style={[styles.docPill, styles.pendingDocPill]}>
              <Ionicons name="alert-circle" size={13} color="#F59E0B" />
              <Text style={[styles.docPillText, { color: '#B45309' }]}>Safety Course Certificate</Text>
            </View>
          </View>
          <Text style={styles.pendingDocNote}>
            ⚠️ Requires mandatory completion of the 15-minute Hazardous Waste Protocol Quiz prior to route activation.
          </Text>
        </View>

        <View style={styles.subActionsRow}>
          <TouchableOpacity
            style={[styles.inspectBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
            onPress={() => handleApprove('Kavindu Bandara (Cond.)', 'Electric EcoTrike')}
          >
            <Ionicons name="checkmark" size={14} color="#059669" />
            <Text style={[styles.inspectBtnText, { color: '#059669' }]}>Approve Cond.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={() => Alert.alert('Uploads', 'Reviewing pending hazardous certificate upload...')}
          >
            <Ionicons name="cloud-upload-outline" size={14} color="#334155" />
            <Text style={styles.inspectBtnText}>Review Uploads</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Fleet Health & Performance ───────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Fleet Health & Performance</Text>
        <TouchableOpacity onPress={() => Alert.alert('Live Map', 'Switching to live PostGIS driver tracking map...')}>
          <Text style={styles.reviewAllText}>Live Map</Text>
        </TouchableOpacity>
      </View>

      {/* Hauler 1: Kamal Perera */}
      <View style={styles.haulerCard}>
        <View style={styles.haulerTopRow}>
          <View style={styles.haulerAvatarCircle}>
            <Text style={{ fontSize: 18 }}>👨‍✈️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.haulerName}>Kamal Perera</Text>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
            </View>
            <Text style={styles.haulerSub}>Hauler AWP-9214 • Top Tier</Text>
          </View>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>4.9</Text>
          </View>
        </View>

        <View style={styles.haulerMetricsRow}>
          <View style={styles.haulerMetricItem}>
            <Text style={styles.haulerMetricLabel}>Contamination</Text>
            <Text style={styles.haulerMetricVal}>0.1% Pristine</Text>
          </View>
          <View style={styles.haulerMetricItem}>
            <Text style={styles.haulerMetricLabel}>Scale Calib.</Text>
            <Text style={styles.haulerMetricVal}>Valid July '26</Text>
          </View>
        </View>

        <View style={styles.subActionsRow}>
          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={() => Alert.alert('Route', 'Live GPS route loaded for Kamal Perera.')}
          >
            <Ionicons name="navigate-outline" size={14} color="#059669" />
            <Text style={[styles.inspectBtnText, { color: '#059669' }]}>View Live Route</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inspectBtn, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
            onPress={() => Alert.alert('Bonus', 'Tier 2 bonus awarded to Kamal Perera.')}
          >
            <Ionicons name="trophy-outline" size={14} color="#B45309" />
            <Text style={[styles.inspectBtnText, { color: '#B45309' }]}>Tier Bonus</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hauler 2: Marcus K. */}
      <View style={styles.haulerCard}>
        <View style={styles.haulerTopRow}>
          <View style={styles.haulerAvatarCircle}>
            <Text style={{ fontSize: 18 }}>🚛</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.haulerName}>Marcus K.</Text>
              <View style={styles.probationBadge}>
                <Text style={styles.probationText}>PROBATION</Text>
              </View>
            </View>
            <Text style={styles.haulerSub}>Hauler BWP-8804 • 3 Sensors</Text>
          </View>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>4.1</Text>
          </View>
        </View>

        <Text style={styles.probationNote}>
          ⚠️ 1 weight discrepancy resolved yesterday
        </Text>

        <View style={styles.subActionsRow}>
          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={() => Alert.alert('Audit', 'Opening load discrepancy history for Marcus K.')}
          >
            <Ionicons name="clipboard-outline" size={14} color="#334155" />
            <Text style={styles.inspectBtnText}>Audit Trips</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={() => Alert.alert('Probation', 'Probation window extended by 14 days.')}
          >
            <Ionicons name="calendar-outline" size={14} color="#334155" />
            <Text style={styles.inspectBtnText}>Extend Period</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bottom Action Buttons ─────────────────────────────── */}
      <View style={styles.bottomButtonsSection}>
        <TouchableOpacity
          style={styles.addHaulerBtn}
          onPress={() => Alert.alert('Add Hauler', 'Opening manual hauler registration form...')}
        >
          <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
          <Text style={styles.addHaulerBtnText}>Add New Hauler Manually</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.downloadAuditBtn}
          onPress={handleDownloadAudit}
        >
          <Ionicons name="download-outline" size={18} color="#059669" />
          <Text style={styles.downloadAuditBtnText}>
            Download Fleet Compliance Audit (PDF)
          </Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
  },
  commandTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },

  /* Metrics Card */
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  metricCol: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  metricMainNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricTotalNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  metricSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  /* Filter Chips */
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
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

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  urgentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  reviewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  /* Application Card */
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  appTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  appAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicantName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
  },
  newBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  applicantMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  vehicleInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    gap: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  vehicleInfoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  payloadTag: {
    fontSize: 10,
    color: '#64748B',
  },
  docsSection: {
    marginBottom: 12,
  },
  docsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  docsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  docPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  pendingDocPill: {
    backgroundColor: '#FEF3C7',
  },
  docPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  pendingDocNote: {
    fontSize: 10,
    color: '#B45309',
    marginTop: 6,
    lineHeight: 14,
  },
  primaryApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginBottom: 8,
  },
  primaryApproveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inspectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  inspectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 4,
  },
  rejectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },

  /* Hauler Health Card */
  haulerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  haulerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  haulerAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  haulerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  haulerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  haulerMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  haulerMetricItem: {
    flex: 1,
  },
  haulerMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  haulerMetricVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    marginTop: 1,
  },
  probationBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  probationText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  probationNote: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginBottom: 8,
  },

  /* Bottom Buttons */
  bottomButtonsSection: {
    marginTop: 12,
    gap: 10,
  },
  addHaulerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064E3B',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addHaulerBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  downloadAuditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#059669',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  downloadAuditBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
});
