/* eslint-disable react-native/no-color-literals, react-native/no-inline-styles */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { onboardingTheme } from '../../theme/onboardingTheme';
import { recyclingService } from '../../services/recycling.service';
import { getCategories as getWasteCategories } from '../../services/waste.service';
import type { IntakeRecord } from '../../types/recyclingCenter';
import type { WasteCategory } from '../../types/waste';

interface InboundBatch {
  id: string;
  manifestCode: string;
  haulerName: string;
  vehiclePlate: string;
  vehicleType: string;
  category: string;
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
  isBackendRecord?: boolean;
}

const DEFAULT_CATEGORIES: WasteCategory[] = [
  { id: 1, name: 'Plastic', description: 'Bottles, containers, polymers', icon: '🧴' },
  { id: 2, name: 'Paper', description: 'Office paper, newspapers', icon: '📄' },
  { id: 3, name: 'Cardboard', description: 'Packaging boxes, corrugated cartons', icon: '📦' },
  { id: 4, name: 'Metal', description: 'Aluminium cans, scrap metals', icon: '🥫' },
  { id: 5, name: 'Glass', description: 'Bottles, jars', icon: '🍾' },
  { id: 6, name: 'E-Waste', description: 'Electronics, batteries', icon: '💻' },
  { id: 7, name: 'Textiles', description: 'Fabrics, clean garments', icon: '👕' },
];

const FILTER_STREAMS = [
  { id: 'ALL', label: 'All Streams', emoji: '♻️' },
  { id: 'PLASTIC', label: 'Plastic', emoji: '🧴' },
  { id: 'PAPER', label: 'Paper', emoji: '📄' },
  { id: 'CARDBOARD', label: 'Cardboard', emoji: '📦' },
  { id: 'METAL', label: 'Metals', emoji: '🥫' },
  { id: 'GLASS', label: 'Glass', emoji: '🍾' },
  { id: 'E_WASTE', label: 'E-Waste', emoji: '💻' },
  { id: 'TEXTILES', label: 'Textiles', emoji: '👕' },
];

const DEFAULT_MOCK_BATCHES: InboundBatch[] = [
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

export default function IncomingMaterialsScreen() {
  const [batches, setBatches] = useState<InboundBatch[]>(DEFAULT_MOCK_BATCHES);
  const [activeTab, setActiveTab] = useState<'PENDING_WEIGH' | 'ACCEPTED' | 'REJECTED'>(
    'PENDING_WEIGH'
  );
  const [selectedStream, setSelectedStream] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Weigh-in modal state
  const [selectedBatch, setSelectedBatch] = useState<InboundBatch | null>(null);
  const [scaleModalVisible, setScaleModalVisible] = useState(false);
  const [weighInput, setWeighInput] = useState('');
  const [selectedBay, setSelectedBay] = useState('Bay 1 - Polymers');
  const [selectedGrade, setSelectedGrade] = useState<'A' | 'B' | 'C'>('A');

  // New Intake Delivery Modal
  const [newModalVisible, setNewModalVisible] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<WasteCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [newWeightKg, setNewWeightKg] = useState('');
  const [newDeliveryRef, setNewDeliveryRef] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creatingIntake, setCreatingIntake] = useState(false);

  const fetchBackendRecords = useCallback(async () => {
    try {
      const [records, categories] = await Promise.all([
        recyclingService.getIntakeRecords().catch(() => [] as IntakeRecord[]),
        getWasteCategories().catch(() => DEFAULT_CATEGORIES),
      ]);
      const activeCats = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
      setAvailableCategories(activeCats);
      setSelectedCatId((prev) =>
        prev === null && activeCats.length > 0 ? activeCats[0].id : prev
      );

      if (records && records.length > 0) {
        const mappedRecords: InboundBatch[] = records.map((r: IntakeRecord) => {
          const rawCat = (r.category_name || '').toUpperCase().replace(/[\s-]+/g, '_');
          const normalizedCat = rawCat.includes('PLASTIC')
            ? 'PLASTIC'
            : rawCat.includes('PAPER')
              ? 'PAPER'
              : rawCat.includes('CARDBOARD')
                ? 'CARDBOARD'
                : rawCat.includes('METAL')
                  ? 'METAL'
                  : rawCat.includes('GLASS')
                    ? 'GLASS'
                    : rawCat.includes('E_WASTE')
                      ? 'E_WASTE'
                      : rawCat.includes('TEXTILE')
                        ? 'TEXTILES'
                        : 'PLASTIC';

          return {
            id: r.id,
            manifestCode: r.delivery_ref || `INT-${r.id.slice(0, 5).toUpperCase()}`,
            haulerName: 'Municipal Delivery Hauler',
            vehiclePlate: 'WP-DELIVERY',
            vehicleType: 'Intake Cargo',
            category: normalizedCat,
            categoryLabel: r.category_name,
            emoji: r.category_icon || '📦',
            estimatedWeightKg: Number(r.quantity_kg),
            actualWeightKg: Number(r.quantity_kg),
            purityGrade: 'A',
            arrivedTime: new Date(r.received_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            originSector: 'Regional Transfer Station',
            storageBay: 'Intake Hopper Bay',
            status: r.status === 'RECEIVED' ? 'PENDING_WEIGH' : 'ACCEPTED',
            notes: r.notes || undefined,
            isBackendRecord: true,
          };
        });

        setBatches((prev) => {
          const mockOnly = prev.filter((b) => !b.isBackendRecord);
          return [...mappedRecords, ...mockOnly];
        });
      }
    } catch (err) {
      console.warn('Could not load backend intake records:', err);
    }
  }, []);

  useEffect(() => {
    fetchBackendRecords();
  }, [fetchBackendRecords]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBackendRecords().finally(() => {
      setRefreshing(false);
    });
  }, [fetchBackendRecords]);

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

  const handleCertifyWeighIn = async () => {
    if (!selectedBatch) return;
    const finalKg = parseFloat(weighInput) || selectedBatch.estimatedWeightKg;

    // If it's a backend record, update its status in backend API
    if (selectedBatch.isBackendRecord) {
      try {
        await recyclingService.updateIntakeStatus(selectedBatch.id, 'SORTED');
      } catch (err) {
        console.warn('Status update API call completed with local sync:', err);
      }
    }

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

  const handleCreateManualIntake = async () => {
    const qty = parseFloat(newWeightKg);
    if (isNaN(qty) || qty <= 0) {
      const msg = 'Please enter a valid weight in kg.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Invalid Weight', msg);
      return;
    }

    if (!selectedCatId) {
      const msg = 'Please select a waste category.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Missing Category', msg);
      return;
    }

    setCreatingIntake(true);
    try {
      await recyclingService.createIntake({
        category_id: selectedCatId,
        quantity_kg: qty,
        delivery_ref: newDeliveryRef || `DEL-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: newNotes,
      });

      setNewModalVisible(false);
      setNewWeightKg('');
      setNewDeliveryRef('');
      setNewNotes('');
      fetchBackendRecords();

      const msg = `Logged intake delivery of ${qty} kg successfully!`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Delivery Logged ✓', msg);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj.response?.data?.message || errorObj.message || 'Failed to record intake delivery.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Intake Error', msg);
    } finally {
      setCreatingIntake(false);
    }
  };

  const handleRejectContamination = (batch: InboundBatch) => {
    const doReject = () => {
      setBatches((prev) => prev.map((b) => (b.id === batch.id ? { ...b, status: 'REJECTED' } : b)));
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
        <TouchableOpacity style={styles.addDeliveryBtn} onPress={() => setNewModalVisible(true)}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.addDeliveryText}>Log Delivery</Text>
        </TouchableOpacity>
      </View>

      {/* ── Segment Tabs (Pending, Accepted, Rejected) ─────────── */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PENDING_WEIGH' && styles.tabBtnActive]}
          onPress={() => setActiveTab('PENDING_WEIGH')}
        >
          <Text style={[styles.tabText, activeTab === 'PENDING_WEIGH' && styles.tabTextActive]}>
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
              style={[styles.counterText, activeTab === 'ACCEPTED' && styles.counterTextActive]}
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
              style={[styles.counterText, activeTab === 'REJECTED' && styles.counterTextActive]}
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
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Batches List ───────────────────────────────────────── */}
      <ScrollView
        style={styles.listArea}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                        style={[styles.gradeSelectBtn, isGSelected && styles.gradeSelectBtnActive]}
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
                        style={[styles.baySelectBtn, isBaySelected && styles.baySelectBtnActive]}
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
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCertifyWeighIn}>
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                  <Text style={styles.modalConfirmText}>Certify &amp; Print Receipt Ticket</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Log Manual Delivery Modal ─────────────────────────── */}
      <Modal
        visible={newModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalPre}>DIRECT INTAKE DOCK</Text>
                <Text style={styles.modalTitle}>Record Inbound Cargo</Text>
              </View>
              <TouchableOpacity
                onPress={() => setNewModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Select Material Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
              >
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {availableCategories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catPill, selectedCatId === c.id && styles.catPillActive]}
                      onPress={() => setSelectedCatId(c.id)}
                    >
                      <Text
                        style={[
                          styles.catPillText,
                          selectedCatId === c.id && styles.catPillTextActive,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.inputLabel}>Measured Infeed Quantity (kg)</Text>
              <View style={styles.scaleInputRow}>
                <Text style={styles.scaleInputPrefix}>⚖️</Text>
                <TextInput
                  style={styles.scaleInput}
                  keyboardType="numeric"
                  placeholder="e.g. 650"
                  value={newWeightKg}
                  onChangeText={setNewWeightKg}
                />
                <Text style={styles.scaleInputUnit}>kg</Text>
              </View>

              <Text style={styles.inputLabel}>Delivery Manifest Reference</Text>
              <View style={styles.scaleInputRow}>
                <TextInput
                  style={styles.scaleInput}
                  placeholder="e.g. TRK-4819"
                  value={newDeliveryRef}
                  onChangeText={setNewDeliveryRef}
                />
              </View>

              <Text style={styles.inputLabel}>Operator Notes (Optional)</Text>
              <View style={[styles.scaleInputRow, { height: 60 }]}>
                <TextInput
                  style={[styles.scaleInput, { textAlignVertical: 'top' }]}
                  placeholder="e.g. Segregated commercial plastics"
                  value={newNotes}
                  onChangeText={setNewNotes}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, creatingIntake && { opacity: 0.6 }]}
                onPress={handleCreateManualIntake}
                disabled={creatingIntake}
              >
                {creatingIntake ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                    <Text style={styles.modalConfirmText}>Save Intake Record</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  addDeliveryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addDeliveryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    borderRadius: 10,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#ECFDF5',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    fontWeight: '800',
    color: '#065F46',
  },
  counterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  counterActive: {
    backgroundColor: '#059669',
  },
  counterInactive: {
    backgroundColor: '#F1F5F9',
  },
  counterText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  counterTextActive: {
    color: '#FFFFFF',
  },

  /* Search */
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },

  /* Stream Chips */
  streamChipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  streamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  streamChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  chipEmoji: {
    fontSize: 12,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* List */
  listArea: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...onboardingTheme.cardShadow,
  },
  batchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    flex: 1,
  },
  streamPillEmoji: {
    fontSize: 11,
  },
  streamPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
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
    gap: 10,
    marginBottom: 12,
  },
  truckIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    backgroundColor: '#F8FAF9',
    padding: 8,
    borderRadius: 10,
    gap: 12,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  notesBox: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  notesText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
  },
  batchActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
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
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  weighInBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  acceptedBannerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  rejectedBannerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalPre: {
    fontSize: 9,
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
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  modalBriefManifest: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBriefHauler: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  scaleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
  },
  scaleInputPrefix: {
    fontSize: 16,
    marginRight: 6,
  },
  scaleInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  scaleInputUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  gradeSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  gradeSelectBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  gradeSelectBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  gradeSelectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  gradeSelectTextActive: {
    color: '#065F46',
  },
  gradeSelectSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  baysGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  baySelectBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  baySelectBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  baySelectText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  baySelectTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  modalConfirmBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    gap: 6,
    marginTop: 6,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  catPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  catPillTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },
});
