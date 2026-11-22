import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { onboardingTheme } from '../../theme/onboardingTheme';

interface InboundBatch {
  id: string;
  manifestCode: string;
  haulerName: string;
  vehiclePlate: string;
  vehicleType: string;
  category: 'PLASTIC' | 'CARDBOARD' | 'METAL' | 'GLASS' | 'E_WASTE';
  categoryLabel: string;
  emoji: string;
  estimatedWeightKg: number;
  actualWeightKg?: number;
  purityGrade: 'A' | 'B' | 'C';
  arrivedTime: string;
  originSector: string;
  storageBay: string;
  status: 'PENDING_WEIGH' | 'ACCEPTED' | 'REJECTED';
  notes?: string;
}

const INITIAL_BATCHES: InboundBatch[] = [
  {
    id: 'batch-1',
    manifestCode: 'MF-9042',
    haulerName: 'Kamal Perera',
    vehiclePlate: 'WP-9214',
    vehicleType: 'Compactor Truck',
    category: 'PLASTIC',
    categoryLabel: 'Plastic (PET & HDPE)',
    emoji: '🧴',
    estimatedWeightKg: 475,
    actualWeightKg: 480,
    purityGrade: 'A',
    arrivedTime: '10:45 AM Today',
    originSector: 'Ratnapura Commercial Sector',
    storageBay: 'Bay 3 - Polymer Yard',
    status: 'PENDING_WEIGH',
    notes: 'Segregated clear PET beverage bottles, lids removed.',
  },
  {
    id: 'batch-2',
    manifestCode: 'MF-9043',
    haulerName: 'Aruna Silva',
    vehiclePlate: 'SP-3012',
    vehicleType: 'Multi-Compartment Van',
    category: 'CARDBOARD',
    categoryLabel: 'Cardboard & OCC',
    emoji: '📦',
    estimatedWeightKg: 310,
    actualWeightKg: 318,
    purityGrade: 'A',
    arrivedTime: '11:15 AM Today',
    originSector: 'Colombo West Suburban Area',
    storageBay: 'Bay 1 - Fiber Silo',
    status: 'PENDING_WEIGH',
    notes: 'Flattened packaging boxes, dry and clean.',
  },
  {
    id: 'batch-3',
    manifestCode: 'MF-9044',
    haulerName: 'Dinesh Jayasuriya',
    vehiclePlate: 'CP-8119',
    vehicleType: 'Pickup Bed',
    category: 'METAL',
    categoryLabel: 'Aluminium Cans',
    emoji: '🥫',
    estimatedWeightKg: 190,
    actualWeightKg: 195,
    purityGrade: 'B',
    arrivedTime: '11:40 AM Today',
    originSector: 'Kandy Municipal Route',
    storageBay: 'Bay 4 - Metals Yard',
    status: 'PENDING_WEIGH',
    notes: 'Beverage cans with minor moisture residue.',
  },
  {
    id: 'batch-4',
    manifestCode: 'MF-8991',
    haulerName: 'Sunil Weerasinghe',
    vehiclePlate: 'WP-4421',
    vehicleType: 'Compactor Truck',
    category: 'GLASS',
    categoryLabel: 'Glass Bottles',
    emoji: '🍾',
    estimatedWeightKg: 620,
    actualWeightKg: 625,
    purityGrade: 'A',
    arrivedTime: '08:20 AM Today',
    originSector: 'Galle Industrial Hub',
    storageBay: 'Bay 5 - Cullet Bin',
    status: 'ACCEPTED',
    notes: 'Colour-sorted amber and flint glass.',
  },
  {
    id: 'batch-5',
    manifestCode: 'MF-8980',
    haulerName: 'Nimal Fernando',
    vehiclePlate: 'NW-1102',
    vehicleType: 'Three-Wheeler',
    category: 'E_WASTE',
    categoryLabel: 'Electronic Circuit Boards',
    emoji: '💻',
    estimatedWeightKg: 85,
    actualWeightKg: 85,
    purityGrade: 'A',
    arrivedTime: 'Yesterday, 04:10 PM',
    originSector: 'Kurunegala Tech Park',
    storageBay: 'Vault 2 - E-Waste Storage',
    status: 'ACCEPTED',
    notes: 'Motherboards, telecommunication ICs.',
  },
  {
    id: 'batch-6',
    manifestCode: 'MF-8910',
    haulerName: 'Rohan Wickramasinghe',
    vehiclePlate: 'WP-7788',
    vehicleType: 'Truck',
    category: 'PLASTIC',
    categoryLabel: 'Mixed Agricultural Film',
    emoji: '🧴',
    estimatedWeightKg: 350,
    actualWeightKg: 340,
    purityGrade: 'C',
    arrivedTime: 'Yesterday, 02:00 PM',
    originSector: 'Anuradhapura North',
    storageBay: 'Quarantine Bay',
    status: 'REJECTED',
    notes: 'High organic mud contamination (>18%). Rejected for municipal wash.',
  },
];

const FILTER_STREAMS = [
  { id: 'ALL', label: 'All Streams', emoji: '♻️' },
  { id: 'PLASTIC', label: 'Plastic', emoji: '🧴' },
  { id: 'CARDBOARD', label: 'Cardboard', emoji: '📦' },
  { id: 'METAL', label: 'Metals', emoji: '🥫' },
  { id: 'GLASS', label: 'Glass', emoji: '🍾' },
  { id: 'E_WASTE', label: 'E-Waste', emoji: '💻' },
];

export default function IncomingMaterialsScreen() {
  const [batches, setBatches] = useState<InboundBatch[]>(INITIAL_BATCHES);
  const [activeTab, setActiveTab] = useState<'PENDING_WEIGH' | 'ACCEPTED' | 'REJECTED'>('PENDING_WEIGH');
  const [selectedStream, setSelectedStream] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Weigh-in modal state
  const [selectedBatch, setSelectedBatch] = useState<InboundBatch | null>(null);
  const [scaleModalVisible, setScaleModalVisible] = useState(false);
  const [weighInput, setWeighInput] = useState('');
  const [selectedBay, setSelectedBay] = useState('Bay 1 - Polymers');
  const [selectedGrade, setSelectedGrade] = useState<'A' | 'B' | 'C'>('A');

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const matchesTab = b.status === activeTab;
      const matchesStream = selectedStream === 'ALL' || b.category === selectedStream;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        b.manifestCode.toLowerCase().includes(query) ||
        b.haulerName.toLowerCase().includes(query) ||
        b.vehiclePlate.toLowerCase().includes(query) ||
        b.originSector.toLowerCase().includes(query);

      return matchesTab && matchesStream && matchesQuery;
    });
  }, [batches, activeTab, selectedStream, searchQuery]);

  const pendingCount = batches.filter((b) => b.status === 'PENDING_WEIGH').length;
  const acceptedCount = batches.filter((b) => b.status === 'ACCEPTED').length;
  const rejectedCount = batches.filter((b) => b.status === 'REJECTED').length;

  const handleOpenWeighModal = (batch: InboundBatch) => {
    setSelectedBatch(batch);
    setWeighInput(String(batch.actualWeightKg || batch.estimatedWeightKg));
    setSelectedBay(batch.storageBay);
    setSelectedGrade(batch.purityGrade);
    setScaleModalVisible(true);
  };

  const handleCertifyWeighIn = () => {
    if (!selectedBatch) return;
    const finalKg = parseFloat(weighInput) || selectedBatch.estimatedWeightKg;

    setBatches((prev) =>
      prev.map((b) =>
        b.id === selectedBatch.id
          ? {
              ...b,
              actualWeightKg: finalKg,
              purityGrade: selectedGrade,
              storageBay: selectedBay,
              status: 'ACCEPTED',
            }
          : b
      )
    );

    setScaleModalVisible(false);
    setSelectedBatch(null);

    const message = `Certified ${finalKg} kg of ${selectedBatch.categoryLabel} from ${selectedBatch.haulerName}. Stored in ${selectedBay}.`;
    if (Platform.OS === 'web') {
      window.alert(`Scale Ticket Certified ✓\n\n${message}`);
    } else {
      Alert.alert('Scale Ticket Certified ✓', message);
    }
  };

  const handleRejectContamination = (batch: InboundBatch) => {
    const doReject = () => {
      setBatches((prev) =>
        prev.map((b) => (b.id === batch.id ? { ...b, status: 'REJECTED' } : b))
      );
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Flag batch #${batch.manifestCode} as non-compliant/contaminated?`)) {
        doReject();
      }
    } else {
      Alert.alert(
        'Flag Contamination',
        `Are you sure you want to reject manifest #${batch.manifestCode} due to contamination?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reject Batch', style: 'destructive', onPress: doReject },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Screen Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>FACILITY RECEPTION &amp; INTAKE</Text>
          <Text style={styles.headerTitle}>Inbound Materials</Text>
        </View>
        <View style={styles.liveWeighbridgePill}>
          <Ionicons name="hardware-chip-outline" size={14} color="#059669" />
          <Text style={styles.liveWeighbridgeText}>IoT Scale Live</Text>
        </View>
      </View>

      {/* ── Segment Tabs (Pending, Accepted, Rejected) ─────────── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PENDING_WEIGH' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PENDING_WEIGH')}
        >
          <Text
            style={[styles.tabText, activeTab === 'PENDING_WEIGH' && styles.tabTextActive]}
          >
            Awaiting Weigh-In
          </Text>
          <View
            style={[
              styles.counterBadge,
              activeTab === 'PENDING_WEIGH' ? styles.counterActive : styles.counterInactive,
            ]}
          >
            <Text
              style={[
                styles.counterText,
                activeTab === 'PENDING_WEIGH' && styles.counterTextActive,
              ]}
            >
              {pendingCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ACCEPTED' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ACCEPTED')}
        >
          <Text style={[styles.tabText, activeTab === 'ACCEPTED' && styles.tabTextActive]}>
            Stocked &amp; Accepted
          </Text>
          <View
            style={[
              styles.counterBadge,
              activeTab === 'ACCEPTED' ? styles.counterActive : styles.counterInactive,
            ]}
          >
            <Text
              style={[
                styles.counterText,
                activeTab === 'ACCEPTED' && styles.counterTextActive,
              ]}
            >
              {acceptedCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'REJECTED' && styles.tabBtnActive]}
          onPress={() => setActiveTab('REJECTED')}
        >
          <Text style={[styles.tabText, activeTab === 'REJECTED' && styles.tabTextActive]}>
            Rejected
          </Text>
          <View
            style={[
              styles.counterBadge,
              activeTab === 'REJECTED' ? styles.counterActive : styles.counterInactive,
            ]}
          >
            <Text
              style={[
                styles.counterText,
                activeTab === 'REJECTED' && styles.counterTextActive,
              ]}
            >
              {rejectedCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ─────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search manifest #, hauler, plate..."
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

      {/* ── Stream Filter Chips ────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.streamChipsContainer}
      >
        {FILTER_STREAMS.map((s) => {
          const isSelected = selectedStream === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.streamChip, isSelected && styles.streamChipActive]}
              onPress={() => setSelectedStream(s.id)}
            >
              <Text style={styles.chipEmoji}>{s.emoji}</Text>
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Batches List ───────────────────────────────────────── */}
      <ScrollView
        style={styles.listArea}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredBatches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No Inbound Deliveries Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try matching another manifest code or hauler name.'
                : 'All incoming loads in this category have been processed.'}
            </Text>
          </View>
        ) : (
          filteredBatches.map((batch) => (
            <View key={batch.id} style={styles.batchCard}>
              <View style={styles.batchTopRow}>
                <View style={styles.manifestBadge}>
                  <Text style={styles.manifestText}>#{batch.manifestCode}</Text>
                </View>
                <View style={styles.streamPill}>
                  <Text style={styles.streamPillEmoji}>{batch.emoji}</Text>
                  <Text style={styles.streamPillText}>{batch.categoryLabel}</Text>
                </View>
                <View
                  style={[
                    styles.gradeBadge,
                    {
                      backgroundColor:
                        batch.purityGrade === 'A'
                          ? '#ECFDF5'
                          : batch.purityGrade === 'B'
                          ? '#FEF3C7'
                          : '#FEE2E2',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.gradeText,
                      {
                        color:
                          batch.purityGrade === 'A'
                            ? '#065F46'
                            : batch.purityGrade === 'B'
                            ? '#B45309'
                            : '#B91C1C',
                      },
                    ]}
                  >
                    Grade {batch.purityGrade}
                  </Text>
                </View>
              </View>

              <View style={styles.haulerRow}>
                <View style={styles.truckIconCircle}>
                  <Text style={{ fontSize: 16 }}>🚛</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.haulerName}>{batch.haulerName}</Text>
                  <Text style={styles.haulerSub}>
                    {batch.vehicleType} • {batch.vehiclePlate}
                  </Text>
                </View>
                <View style={styles.weightCol}>
                  <Text style={styles.weightNumber}>
                    {batch.actualWeightKg || batch.estimatedWeightKg} kg
                  </Text>
                  <Text style={styles.weightLabel}>
                    {batch.actualWeightKg ? 'Certified Tare' : 'Estimated'}
                  </Text>
                </View>
              </View>

              <View style={styles.metaBox}>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={13} color="#64748B" />
                  <Text style={styles.metaText}>{batch.arrivedTime}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color="#64748B" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {batch.originSector}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="business-outline" size={13} color="#64748B" />
                  <Text style={styles.metaText}>{batch.storageBay}</Text>
                </View>
              </View>

              {batch.notes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>💬 {batch.notes}</Text>
                </View>
              )}

              {/* Actions based on tab */}
              {batch.status === 'PENDING_WEIGH' && (
                <View style={styles.batchActionsRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleRejectContamination(batch)}
                  >
                    <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.weighInBtn}
                    onPress={() => handleOpenWeighModal(batch)}
                  >
                    <Ionicons name="scale-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.weighInBtnText}>Confirm Weigh-In ✓</Text>
                  </TouchableOpacity>
                </View>
              )}

              {batch.status === 'ACCEPTED' && (
                <View style={styles.acceptedBanner}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.acceptedBannerText}>
                    Intake Recorded • Assigned to {batch.storageBay}
                  </Text>
                </View>
              )}

              {batch.status === 'REJECTED' && (
                <View style={styles.rejectedBanner}>
                  <Ionicons name="close-circle" size={16} color="#DC2626" />
                  <Text style={styles.rejectedBannerText}>
                    Rejected due to contamination threshold exceedance.
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Weigh-In Certification Modal ──────────────────────── */}
      <Modal
        visible={scaleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScaleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalPre}>DIGITAL SCALE TARE</Text>
                <Text style={styles.modalTitle}>Certify Weigh-In</Text>
              </View>
              <TouchableOpacity
                onPress={() => setScaleModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {selectedBatch && (
              <>
                <View style={styles.modalBatchBrief}>
                  <Text style={styles.modalBriefManifest}>
                    Manifest #{selectedBatch.manifestCode} • {selectedBatch.categoryLabel}
                  </Text>
                  <Text style={styles.modalBriefHauler}>
                    {selectedBatch.haulerName} ({selectedBatch.vehiclePlate})
                  </Text>
                </View>

                {/* Scale Weight Input */}
                <Text style={styles.inputLabel}>Verified Scale Net Weight (kg)</Text>
                <View style={styles.scaleInputRow}>
                  <Text style={styles.scaleInputPrefix}>⚖️</Text>
                  <TextInput
                    style={styles.scaleInput}
                    keyboardType="numeric"
                    value={weighInput}
                    onChangeText={setWeighInput}
                  />
                  <Text style={styles.scaleInputUnit}>kg</Text>
                </View>

                {/* Purity Grade Selector */}
                <Text style={styles.inputLabel}>Quality Inspection Grade</Text>
                <View style={styles.gradeSelectRow}>
                  {(['A', 'B', 'C'] as const).map((grade) => {
                    const isGSelected = selectedGrade === grade;
                    return (
                      <TouchableOpacity
                        key={grade}
                        style={[
                          styles.gradeSelectBtn,
                          isGSelected && styles.gradeSelectBtnActive,
                        ]}
                        onPress={() => setSelectedGrade(grade)}
                      >
                        <Text
                          style={[
                            styles.gradeSelectText,
                            isGSelected && styles.gradeSelectTextActive,
                          ]}
                        >
                          Grade {grade}
                        </Text>
                        <Text style={styles.gradeSelectSub}>
                          {grade === 'A' ? '95%+ Clean' : grade === 'B' ? 'Standard' : 'Low Purity'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Storage Bay Selection */}
                <Text style={styles.inputLabel}>Designate Storage Bay</Text>
                <View style={styles.baysGrid}>
                  {['Bay 1 - Fiber', 'Bay 2 - Metals', 'Bay 3 - Polymers'].map((bay) => {
                    const isBaySelected = selectedBay === bay;
                    return (
                      <TouchableOpacity
                        key={bay}
                        style={[
                          styles.baySelectBtn,
                          isBaySelected && styles.baySelectBtnActive,
                        ]}
                        onPress={() => setSelectedBay(bay)}
                      >
                        <Text
                          style={[
                            styles.baySelectText,
                            isBaySelected && styles.baySelectTextActive,
                          ]}
                        >
                          {bay}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Submit Action */}
                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleCertifyWeighIn}
                >
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                  <Text style={styles.modalConfirmText}>Certify &amp; Print Receipt Ticket</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveWeighbridgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  liveWeighbridgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },

  /* Segment Tabs */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#065F46',
    fontWeight: '800',
  },
  counterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  counterActive: {
    backgroundColor: '#059669',
  },
  counterInactive: {
    backgroundColor: '#E2E8F0',
  },
  counterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  counterTextActive: {
    color: '#FFFFFF',
  },

  /* Search */
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },

  /* Stream Chips */
  streamChipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  streamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  streamChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* List Area */
  listArea: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 40,
    gap: 12,
  },

  /* Batch Card */
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...onboardingTheme.cardShadow,
  },
  batchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  manifestBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  manifestText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  streamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  streamPillEmoji: {
    fontSize: 12,
  },
  streamPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  haulerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  truckIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  haulerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  haulerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  weightCol: {
    alignItems: 'flex-end',
  },
  weightNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  weightLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },

  metaBox: {
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 4,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  notesBox: {
    backgroundColor: '#FEFCE8',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 11,
    color: '#A16207',
  },

  batchActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  weighInBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  weighInBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  acceptedBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  rejectedBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },

  /* Empty state */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: '80%',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    ...onboardingTheme.cardShadow,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalPre: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBatchBrief: {
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalBriefManifest: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBriefHauler: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 6,
  },
  scaleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#059669',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  scaleInputPrefix: {
    fontSize: 18,
    marginRight: 8,
  },
  scaleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 10,
  },
  scaleInputUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  gradeSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  gradeSelectBtn: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gradeSelectBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  gradeSelectText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  gradeSelectTextActive: {
    color: '#059669',
  },
  gradeSelectSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  baysGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  baySelectBtn: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  baySelectBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  baySelectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  baySelectTextActive: {
    color: '#059669',
  },
  modalConfirmBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
