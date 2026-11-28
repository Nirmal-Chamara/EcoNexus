/* eslint-disable react-native/no-color-literals, react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { onboardingTheme } from '../../theme/onboardingTheme';
import { recyclingService } from '../../services/recycling.service';
import type { IntakeRecord } from '../../types/recyclingCenter';

interface ProcessingLine {
  id: string;
  name: string;
  equipmentType: string;
  stream: string;
  emoji: string;
  batchCode?: string;
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE';
  progressPercent: number;
  currentKg: number;
  targetKg: number;
  outputProduct: string;
  timeRemaining?: string;
}

const INITIAL_LINES: ProcessingLine[] = [
  {
    id: 'line-1',
    name: 'Line 1: High-Density Polymer Granulator',
    equipmentType: 'Shredder & Wet-Wash Pelletizer',
    stream: 'Plastic (Clear PET & HDPE)',
    emoji: '🧴',
    batchCode: 'BATCH-7701',
    status: 'RUNNING',
    progressPercent: 75,
    currentKg: 450,
    targetKg: 600,
    outputProduct: '0.5mm R-PET Flakes (Purity 99.1%)',
    timeRemaining: '35 mins remaining',
  },
  {
    id: 'line-2',
    name: 'Line 2: OCC Hydraulic Baling Press',
    equipmentType: '60-Ton Automatic Tie Baler',
    stream: 'Cardboard & Corrugated Boxes',
    emoji: '📦',
    batchCode: 'BATCH-7702',
    status: 'RUNNING',
    progressPercent: 40,
    currentKg: 800,
    targetKg: 2000,
    outputProduct: '1.2 MT Mill-Size Cardboard Bales',
    timeRemaining: '1h 15m remaining',
  },
  {
    id: 'line-3',
    name: 'Line 3: Non-Ferrous Eddy-Current Densifier',
    equipmentType: 'Magnetic Induction Separator',
    stream: 'Aluminium UBC Cans',
    emoji: '🥫',
    batchCode: 'BATCH-7703',
    status: 'IDLE',
    progressPercent: 0,
    currentKg: 0,
    targetKg: 500,
    outputProduct: 'High-Density Aluminium Briquettes',
    timeRemaining: 'Hopper loaded with 520 kg',
  },
  {
    id: 'line-4',
    name: 'Line 4: Optical Glass Cullet Crusher',
    equipmentType: 'Optical Color Sorter & Hammer Mill',
    stream: 'Flint & Amber Glass',
    emoji: '🍾',
    status: 'MAINTENANCE',
    progressPercent: 0,
    currentKg: 0,
    targetKg: 1000,
    outputProduct: '0-4mm Color-Sorted Glass Cullet',
    timeRemaining: 'Belt tension calibration scheduled',
  },
];

interface OutputCommodity {
  name: string;
  weightTons: number;
  unitPriceUsd: number;
  emoji: string;
  buyer: string;
}

const OUTPUT_STOCK: OutputCommodity[] = [
  { name: 'Export Grade R-PET Flakes', weightTons: 12.4, unitPriceUsd: 1150, emoji: '🧴', buyer: 'Ceylon Plastics Ltd' },
  { name: 'OCC Cardboard Mill Bales', weightTons: 8.2, unitPriceUsd: 180, emoji: '📦', buyer: 'National Paper Mills' },
  { name: 'UBC Aluminium Briquettes', weightTons: 3.9, unitPriceUsd: 1920, emoji: '🥫', buyer: 'Lanka Smelters Inc' },
];

export default function ProcessingScreen() {
  const [lines, setLines] = useState<ProcessingLine[]>(INITIAL_LINES);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'RUNNING' | 'IDLE' | 'MAINTENANCE'>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [stagedIntakes, setStagedIntakes] = useState<IntakeRecord[]>([]);

  // New batch modal
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState('line-3');
  const [newBatchKg, setNewBatchKg] = useState('500');

  const fetchStagedMaterials = useCallback(async () => {
    try {
      const records = await recyclingService.getIntakeRecords();
      // Filter intakes that are either RECEIVED or SORTED awaiting completion
      const activeQueue = (records || []).filter(
        (r) => r && (r.status === 'RECEIVED' || r.status === 'SORTED')
      );
      setStagedIntakes(activeQueue);
    } catch (err) {
      console.warn('Could not load staged intakes:', err);
    }
  }, []);

  useEffect(() => {
    fetchStagedMaterials();
  }, [fetchStagedMaterials]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStagedMaterials().finally(() => setRefreshing(false));
  }, [fetchStagedMaterials]);

  const filteredLines = lines.filter((line) => {
    if (activeFilter === 'ALL') return true;
    return line.status === activeFilter;
  });

  const runningCount = lines.filter((l) => l.status === 'RUNNING').length;

  const handleToggleLine = (lineId: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id === lineId) {
          if (l.status === 'RUNNING') {
            return { ...l, status: 'IDLE', timeRemaining: 'Line Paused by Operator' };
          } else if (l.status === 'IDLE') {
            return {
              ...l,
              status: 'RUNNING',
              progressPercent: l.progressPercent > 0 ? l.progressPercent : 10,
              timeRemaining: '45 mins remaining',
            };
          }
        }
        return l;
      })
    );
  };

  const handleCompleteBatch = (line: ProcessingLine) => {
    const doComplete = () => {
      setLines((prev) =>
        prev.map((l) =>
          l.id === line.id
            ? {
                ...l,
                status: 'IDLE',
                progressPercent: 100,
                timeRemaining: 'Batch Completed • Ready for Ejection',
              }
            : l
        )
      );

      // Also advance any matching staged sorted intake in background
      if (stagedIntakes.length > 0) {
        const sortedItem = stagedIntakes.find((s) => s.status === 'SORTED');
        if (sortedItem) {
          recyclingService.updateIntakeStatus(sortedItem.id, 'PROCESSED').catch(() => {});
          fetchStagedMaterials();
        }
      }

      const msg = `Batch ${line.batchCode || ''} on ${line.name} has been processed successfully. Added to output commodity inventory.`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Batch Completed ✓', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Complete and eject finished output for ${line.name}?`)) {
        doComplete();
      }
    } else {
      Alert.alert(
        'Finish Batch',
        `Complete and transfer processed output from ${line.name} to warehouse inventory?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete Batch', style: 'default', onPress: doComplete },
        ]
      );
    }
  };

  const handleAdvanceIntakeStage = async (item: IntakeRecord) => {
    const nextStatus = item.status === 'RECEIVED' ? 'SORTED' : 'PROCESSED';
    try {
      await recyclingService.updateIntakeStatus(item.id, nextStatus);
      fetchStagedMaterials();
      const msg = `Record #${item.id.slice(0, 6)} advanced to status ${nextStatus}.`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Status Updated ✓', msg);
    } catch (err: unknown) {
      const respMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const msg = respMsg || 'Failed to update processing status.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Update Failed', msg);
    }
  };

  const handleStartNewBatch = () => {
    const kg = parseFloat(newBatchKg) || 500;
    const batchCode = `BATCH-${Math.floor(1000 + Math.random() * 9000)}`;

    setLines((prev) =>
      prev.map((l) =>
        l.id === selectedLineId
          ? {
              ...l,
              status: 'RUNNING',
              batchCode,
              progressPercent: 5,
              currentKg: Math.round(kg * 0.05),
              targetKg: kg,
              timeRemaining: '1h 10m remaining',
            }
          : l
      )
    );

    setBatchModalVisible(false);
    const msg = `Started ${batchCode} on selected line with ${kg} kg raw material infeed.`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Processing Initiated ▶️', msg);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Screen Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>FACILITY REFINING &amp; SORTING</Text>
          <Text style={styles.headerTitle}>Processing Lines</Text>
        </View>
        <TouchableOpacity
          style={styles.newBatchBtn}
          onPress={() => setBatchModalVisible(true)}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.newBatchBtnText}>New Batch</Text>
        </TouchableOpacity>
      </View>

      {/* ── Summary Operational Metrics ────────────────────────── */}
      <View style={styles.metricsSummaryCard}>
        <View style={styles.metricCol}>
          <Text style={styles.summaryValue}>24.5 MT</Text>
          <Text style={styles.summaryLabel}>Total Output Ready</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.metricCol}>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>
            {runningCount} / 4
          </Text>
          <Text style={styles.summaryLabel}>Active Equipment</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.metricCol}>
          <Text style={[styles.summaryValue, { color: '#0284C7' }]}>94.2%</Text>
          <Text style={styles.summaryLabel}>Yield Recovery</Text>
        </View>
      </View>

      {/* ── Filter Tabs ────────────────────────────────────────── */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
          onPress={() => setActiveFilter('ALL')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'ALL' && styles.filterChipTextActive]}>
            All Lines ({lines.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'RUNNING' && styles.filterChipActive]}
          onPress={() => setActiveFilter('RUNNING')}
        >
          <View style={[styles.filterDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.filterChipText, activeFilter === 'RUNNING' && styles.filterChipTextActive]}>
            Running ({runningCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'IDLE' && styles.filterChipActive]}
          onPress={() => setActiveFilter('IDLE')}
        >
          <View style={[styles.filterDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.filterChipText, activeFilter === 'IDLE' && styles.filterChipTextActive]}>
            Idle
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'MAINTENANCE' && styles.filterChipActive]}
          onPress={() => setActiveFilter('MAINTENANCE')}
        >
          <View style={[styles.filterDot, { backgroundColor: '#94A3B8' }]} />
          <Text style={[styles.filterChipText, activeFilter === 'MAINTENANCE' && styles.filterChipTextActive]}>
            Maintenance
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── Staged Raw Materials from Inbound Log ───────────── */}
        {stagedIntakes.length > 0 && (
          <View style={styles.stagedSection}>
            <View style={styles.stagedHeaderRow}>
              <Text style={styles.sectionHeading}>Staged Batches in Hopper</Text>
              <Text style={styles.stagedCountBadge}>{stagedIntakes.length} awaiting</Text>
            </View>

            {stagedIntakes.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.stagedCard}>
                <View style={styles.stagedInfoCol}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16 }}>{item.category_icon || '📦'}</Text>
                    <Text style={styles.stagedCatName}>{item.category_name}</Text>
                    <View style={styles.stageStatusPill}>
                      <Text style={styles.stageStatusText}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.stagedSub}>
                    {item.delivery_ref || 'Infeed'} • {Number(item.quantity_kg).toFixed(1)} kg
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.advanceStageBtn}
                  onPress={() => handleAdvanceIntakeStage(item)}
                >
                  <Ionicons name="arrow-forward-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.advanceStageText}>
                    {item.status === 'RECEIVED' ? 'Mark Sorted' : 'Process'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── Processing Lines Cards ─────────────────────────────── */}
        <View style={styles.linesSection}>
          <Text style={styles.sectionHeading}>Equipment Operations</Text>
          {filteredLines.map((line) => {
            const isRunning = line.status === 'RUNNING';
            const isIdle = line.status === 'IDLE';

            return (
              <View key={line.id} style={styles.lineCard}>
                {/* Top Info */}
                <View style={styles.lineTopRow}>
                  <View style={styles.lineStreamBadge}>
                    <Text style={styles.streamEmoji}>{line.emoji}</Text>
                    <Text style={styles.streamName}>{line.stream}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isRunning
                          ? '#ECFDF5'
                          : isIdle
                          ? '#FEF3C7'
                          : '#F1F5F9',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: isRunning
                            ? '#10B981'
                            : isIdle
                            ? '#F59E0B'
                            : '#94A3B8',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color: isRunning
                            ? '#065F46'
                            : isIdle
                            ? '#B45309'
                            : '#64748B',
                        },
                      ]}
                    >
                      {line.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.lineTitle}>{line.name}</Text>
                <Text style={styles.equipmentType}>{line.equipmentType}</Text>

                {line.batchCode && (
                  <View style={styles.batchTagRow}>
                    <Text style={styles.batchTagLabel}>Active Run:</Text>
                    <Text style={styles.batchTagCode}>#{line.batchCode}</Text>
                  </View>
                )}

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${line.progressPercent}%`,
                          backgroundColor: isRunning ? '#059669' : '#D97706',
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.progressMetaRow}>
                    <Text style={styles.progressKgText}>
                      {line.currentKg} / {line.targetKg} kg processed
                    </Text>
                    <Text style={styles.progressPctText}>{line.progressPercent}%</Text>
                  </View>
                </View>

                {/* Output Spec Box */}
                <View style={styles.outputBox}>
                  <Text style={styles.outputLabel}>OUTPUT COMMODITY</Text>
                  <Text style={styles.outputValue}>{line.outputProduct}</Text>
                  {line.timeRemaining && (
                    <Text style={styles.timeRemainingText}>⏱ {line.timeRemaining}</Text>
                  )}
                </View>

                {/* Control Actions */}
                <View style={styles.cardActionsRow}>
                  {line.status !== 'MAINTENANCE' ? (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.actionBtnOutline,
                          isRunning ? styles.btnPause : styles.btnResume,
                        ]}
                        onPress={() => handleToggleLine(line.id)}
                      >
                        <Ionicons
                          name={isRunning ? 'pause' : 'play'}
                          size={14}
                          color={isRunning ? '#B45309' : '#059669'}
                        />
                        <Text
                          style={[
                            styles.actionBtnOutlineText,
                            { color: isRunning ? '#B45309' : '#059669' },
                          ]}
                        >
                          {isRunning ? 'Pause Line' : 'Start Processing'}
                        </Text>
                      </TouchableOpacity>

                      {isRunning && (
                        <TouchableOpacity
                          style={styles.actionBtnSolid}
                          onPress={() => handleCompleteBatch(line)}
                        >
                          <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnSolidText}>Complete Batch</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <View style={styles.maintenanceNotice}>
                      <Ionicons name="construct-outline" size={16} color="#64748B" />
                      <Text style={styles.maintenanceText}>
                        Scheduled inspection in progress. Contact plant technician.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Finished Commodity Inventory (Ready for Offtake) ───── */}
        <View style={styles.inventorySection}>
          <Text style={styles.sectionHeading}>Ready-for-Offtake Inventory</Text>
          <Text style={styles.sectionSub}>
            Sorted, baled, and pelletized secondary raw materials ready for industrial dispatch.
          </Text>

          <View style={styles.inventoryList}>
            {OUTPUT_STOCK.map((item, idx) => (
              <View key={idx} style={styles.inventoryCard}>
                <View style={styles.invEmojiCircle}>
                  <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invTitle}>{item.name}</Text>
                  <Text style={styles.invBuyer}>Buyer: {item.buyer}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.invWeight}>{item.weightTons} MT</Text>
                  <Text style={styles.invValue}>
                    ${(item.weightTons * item.unitPriceUsd).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── New Batch Setup Modal ──────────────────────────────── */}
      <Modal
        visible={batchModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBatchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalPre}>BATCH PRODUCTION CONTROL</Text>
                <Text style={styles.modalTitle}>Initiate Processing Run</Text>
              </View>
              <TouchableOpacity onPress={() => setBatchModalVisible(false)}>
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select Equipment Line</Text>
            <View style={styles.lineChoiceGrid}>
              {lines
                .filter((l) => l.status !== 'MAINTENANCE')
                .map((l) => {
                  const isChoice = selectedLineId === l.id;
                  return (
                    <TouchableOpacity
                      key={l.id}
                      style={[styles.lineChoiceBtn, isChoice && styles.lineChoiceBtnActive]}
                      onPress={() => setSelectedLineId(l.id)}
                    >
                      <Text style={styles.lineChoiceEmoji}>{l.emoji}</Text>
                      <Text
                        style={[
                          styles.lineChoiceText,
                          isChoice && styles.lineChoiceTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {l.name.split(':')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>

            <Text style={styles.inputLabel}>Target Infeed Quantity (kg)</Text>
            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={newBatchKg}
                onChangeText={setNewBatchKg}
              />
              <Text style={styles.modalInputUnit}>kg</Text>
            </View>

            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleStartNewBatch}>
              <Ionicons name="play" size={16} color="#FFFFFF" />
              <Text style={styles.modalSubmitText}>Launch Processing Run</Text>
            </TouchableOpacity>
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
  newBatchBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  newBatchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Metrics Summary */
  metricsSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    ...onboardingTheme.cardShadow,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  /* Filter Tabs */
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },

  scrollArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },

  /* Staged Section */
  stagedSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    ...onboardingTheme.cardShadow,
  },
  stagedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stagedCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stagedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F8FAF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stagedInfoCol: {
    flex: 1,
    gap: 2,
  },
  stagedCatName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  stageStatusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  stageStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  stagedSub: {
    fontSize: 11,
    color: '#64748B',
  },
  advanceStageBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  advanceStageText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Lines Section */
  linesSection: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  lineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...onboardingTheme.cardShadow,
  },
  lineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  lineStreamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  streamEmoji: {
    fontSize: 12,
  },
  streamName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  lineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  equipmentType: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  batchTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  batchTagLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  batchTagCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressKgText: {
    fontSize: 11,
    color: '#64748B',
  },
  progressPctText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  outputBox: {
    backgroundColor: '#F8FAF9',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  outputLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  outputValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  timeRemainingText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  btnPause: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  btnResume: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnSolid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnSolidText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  maintenanceNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  maintenanceText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },

  /* Inventory Section */
  inventorySection: {
    gap: 8,
  },
  inventoryList: {
    gap: 8,
  },
  inventoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    ...onboardingTheme.cardShadow,
  },
  invEmojiCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  invBuyer: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  invWeight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  invValue: {
    fontSize: 10,
    color: '#64748B',
  },

  /* Modal */
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  lineChoiceGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  lineChoiceBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  lineChoiceBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  lineChoiceEmoji: {
    fontSize: 18,
  },
  lineChoiceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  lineChoiceTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 18,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalInputUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSubmitBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    gap: 6,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});