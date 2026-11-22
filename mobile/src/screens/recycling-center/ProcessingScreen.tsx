import React, { useState } from 'react';
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
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { onboardingTheme } from '../../theme/onboardingTheme';

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

  // New batch modal
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState('line-3');
  const [newBatchKg, setNewBatchKg] = useState('500');

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
      >
        {/* ── Processing Lines Cards ─────────────────────────────── */}
        <View style={styles.linesSection}>
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

            <Text style={styles.inputLabel}>Batch Infeed Weight (kg)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={newBatchKg}
                onChangeText={setNewBatchKg}
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>

            <TouchableOpacity style={styles.startBatchBtn} onPress={handleStartNewBatch}>
              <Ionicons name="play" size={16} color="#FFFFFF" />
              <Text style={styles.startBatchText}>Launch Processing Run ▶️</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  newBatchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Metrics Summary Card */
  metricsSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...onboardingTheme.cardShadow,
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 17,
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
    height: 28,
    backgroundColor: '#E2E8F0',
  },

  /* Filter Tabs */
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: '#059669',
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
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  scrollArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  /* Lines Section */
  linesSection: {
    gap: 14,
    marginBottom: 24,
  },
  lineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...onboardingTheme.cardShadow,
  },
  lineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineStreamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5,
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
  },
  equipmentType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
    marginBottom: 8,
  },
  batchTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  batchTagLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  batchTagCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },

  /* Progress Bar */
  progressContainer: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
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
    fontWeight: '500',
  },
  progressPctText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* Output Box */
  outputBox: {
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  outputLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
  },
  outputValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  timeRemainingText: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 3,
    fontWeight: '600',
  },

  /* Card Actions */
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  btnPause: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  btnResume: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
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
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnSolidText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  maintenanceNotice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 12,
    gap: 6,
  },
  maintenanceText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },

  /* Offtake Inventory Section */
  inventorySection: {
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
    lineHeight: 16,
  },
  inventoryList: {
    gap: 10,
  },
  inventoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...onboardingTheme.cardShadow,
  },
  invEmojiCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  invTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  invBuyer: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  invWeight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  invValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
    marginTop: 1,
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
    marginBottom: 14,
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
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  lineChoiceGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  lineChoiceBtn: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lineChoiceBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  lineChoiceEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  lineChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  lineChoiceTextActive: {
    color: '#059669',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#059669',
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    paddingVertical: 10,
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  startBatchBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  startBatchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
