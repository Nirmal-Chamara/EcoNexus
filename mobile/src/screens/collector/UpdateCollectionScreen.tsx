import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { pickupService } from '../../services/pickup.service';

const { width } = Dimensions.get('window');

interface Props {
  pickupId?: string;
  onClose?: () => void;
}

export default function UpdateCollectionScreen(props: Props) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const pickupId = props.pickupId || route.params?.pickupId || 'ECO-8492';

  // Mission state
  const [missionTimer, setMissionTimer] = useState('00:14:22');
  const [scaleBleConnected, setScaleBleConnected] = useState(true);
  const [currentWeight, setCurrentWeight] = useState(8.15);
  const [isTared, setIsTared] = useState(false);
  const [pinDigits, setPinDigits] = useState(['4', '8', '2', '1']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoAdded, setPhotoAdded] = useState(true);

  // Material breakdowns
  const [materials, setMaterials] = useState([
    {
      id: 'pet',
      name: 'PET Plastic Bottles',
      sub: 'Cleaned & Baled',
      weight: 5.15,
      icon: '🧴',
      color: '#10B981',
    },
    {
      id: 'cardboard',
      name: 'Corrugated Cardboard',
      sub: 'Flattened bundle',
      weight: 3.0,
      icon: '📦',
      color: '#F59E0B',
    },
  ]);

  // Handle Tare button
  const handleTare = () => {
    if (!isTared) {
      setCurrentWeight(0.0);
      setIsTared(true);
      if (Platform.OS === 'web') {
        window.alert('Scale Tared to 0.00 kg. Place verified load onto scale plate.');
      } else {
        Alert.alert('Scale Tared', 'Zero point established (0.00 kg).');
      }
    } else {
      setCurrentWeight(8.15);
      setIsTared(false);
    }
  };

  // Handle Confirm Weigh & Mark Picked Up
  const handleConfirmWeighed = async () => {
    try {
      setIsSubmitting(true);
      const pinStr = pinDigits.join('');

      let result: any = null;
      if (pickupId && pickupId !== 'ECO-8492') {
        result = await pickupService
          .verifyWeighPickup(pickupId, {
            handshakePin: pinStr,
            actualWeight: currentWeight,
            materials: materials.map((m) => ({ name: m.name, weight: m.weight, sub: m.sub })),
            scalePhotoUrl: 'Scale_Reading_0815.jpg',
          })
          .catch(() => null);
      }

      const payoutTxt = result?.payout_amount
        ? `\n• Payout Credited: +$${Number(result.payout_amount).toFixed(2)}`
        : '\n• Payout Credited: +$8.40 (Direct to Wallet)';

      const msg = `Mission #${pickupId} Verified! 🎉\n• Total Payload: ${currentWeight.toFixed(2)} kg\n• Handshake PIN: ${pinStr} Verified${payoutTxt}\n• Next Stop: GreenTech Regional Hub #04`;

      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Collection Confirmed! 🎉', msg);
      }

      if (props.onClose) {
        props.onClose();
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Dashboard');
      }
    } catch (e: any) {
      Alert.alert('Verification Error', e?.message || 'Failed to verify handshake PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ── Top Header ────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (props.onClose) props.onClose();
            else if (navigation.canGoBack()) navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <View style={styles.missionBadgeRow}>
            <Text style={styles.missionIdText}>Mission #{pickupId}</Text>
            <View style={styles.priorityPill}>
              <Text style={styles.priorityPillText}>Priority Route</Text>
            </View>
          </View>
        </View>

        <View style={styles.timerWrap}>
          <Ionicons name="time-outline" size={14} color="#059669" />
          <Text style={styles.timerText}>{missionTimer}</Text>
          <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="share-social-outline" size={16} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Mission Tracker ───────────────────────────────────── */}
      <View style={styles.trackerCard}>
        <View style={styles.trackerHeaderRow}>
          <Text style={styles.trackerHeaderTitle}>Mission Tracker</Text>
          <View style={styles.stepCounterPill}>
            <Text style={styles.stepCounterText}>Step 3 of 5</Text>
          </View>
        </View>

        <View style={styles.stepperContainer}>
          {/* Step 1: Dispatched */}
          <View style={styles.stepRow}>
            <View style={styles.stepIndicatorCol}>
              <View style={[styles.stepDot, styles.stepDotDone]}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <View style={[styles.stepLine, styles.stepLineDone]} />
            </View>
            <View style={styles.stepContentCol}>
              <View style={styles.stepTitleRow}>
                <Text style={styles.stepTitleDone}>Dispatched / En Route</Text>
                <Text style={styles.stepTimeText}>10:15 AM</Text>
              </View>
              <Text style={styles.stepSubtitle}>Departed Depot Bay A2</Text>
            </View>
          </View>

          {/* Step 2: Arrived */}
          <View style={styles.stepRow}>
            <View style={styles.stepIndicatorCol}>
              <View style={[styles.stepDot, styles.stepDotDone]}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <View style={[styles.stepLine, styles.stepLineDone]} />
            </View>
            <View style={styles.stepContentCol}>
              <View style={styles.stepTitleRow}>
                <Text style={styles.stepTitleDone}>Arrived at Location</Text>
                <Text style={styles.stepTimeText}>10:32 AM</Text>
              </View>
              <Text style={styles.stepSubtitle}>182 Evergreen Terrace</Text>
            </View>
          </View>

          {/* Step 3: Weighing & Verification (ACTIVE) */}
          <View style={styles.stepRow}>
            <View style={styles.stepIndicatorCol}>
              <View style={[styles.stepDot, styles.stepDotActive]}>
                <View style={styles.stepInnerPulse} />
              </View>
              <View style={styles.stepLine} />
            </View>
            <View style={styles.stepContentCol}>
              <View style={styles.stepTitleRow}>
                <Text style={styles.stepTitleActive}>Weighing & Verification</Text>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>ACTIVE</Text>
                </View>
              </View>
              <Text style={styles.stepSubtitleActive}>Ready for sensor scan & sign-off</Text>
            </View>
          </View>

          {/* Step 4: In Transit */}
          <View style={styles.stepRow}>
            <View style={styles.stepIndicatorCol}>
              <View style={styles.stepDot} />
              <View style={styles.stepLine} />
            </View>
            <View style={styles.stepContentCol}>
              <Text style={styles.stepTitlePending}>In Transit to Hub</Text>
              <Text style={styles.stepSubtitle}>Secured load audit trail</Text>
            </View>
          </View>

          {/* Step 5: Delivered */}
          <View style={[styles.stepRow, { marginBottom: 0 }]}>
            <View style={styles.stepIndicatorCol}>
              <View style={styles.stepDot} />
            </View>
            <View style={styles.stepContentCol}>
              <Text style={styles.stepTitlePending}>Delivered at Center</Text>
              <Text style={styles.stepSubtitle}>Batch intake & quality certified</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Scale & Payload Intake ─────────────────────────────── */}
      <View style={styles.scaleCard}>
        <View style={styles.scaleHeaderRow}>
          <View>
            <Text style={styles.scaleTitle}>Scale & Payload Intake</Text>
            <Text style={styles.scaleModelText}>ECOSCALE SMART-LINK v2</Text>
          </View>
          <View style={styles.bleBadge}>
            <View style={styles.blePulseDot} />
            <Text style={styles.bleText}>BLE Connected</Text>
          </View>
        </View>

        {/* Digital LCD Weight Display */}
        <View style={styles.lcdContainer}>
          <View style={styles.lcdScreen}>
            <View style={styles.lcdTopRow}>
              <Text style={styles.lcdModeLabel}>NET WEIGHT</Text>
              <TouchableOpacity style={styles.tareBtn} onPress={handleTare}>
                <Ionicons name="refresh" size={13} color="#059669" />
                <Text style={styles.tareBtnText}>{isTared ? 'Reset Tare' : 'Tare (0.0)'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.lcdDigitsRow}>
              <Text style={styles.lcdWeightNumber}>{currentWeight.toFixed(2)}</Text>
              <Text style={styles.lcdWeightUnit}>kg</Text>
            </View>

            <View style={styles.lcdFooterRow}>
              <Text style={styles.lcdFooterMeta}>Calibrated ±0.02 kg</Text>
              <Text style={styles.lcdFooterMeta}>Signal: Strong (-69 dBm)</Text>
            </View>
          </View>
        </View>

        {/* Verified Material Types Breakdown */}
        <View style={styles.materialsSection}>
          <View style={styles.materialsHeaderRow}>
            <Text style={styles.materialsTitle}>Verified Material Types</Text>
            <Text style={styles.materialsSub}>2 categories detected</Text>
          </View>

          {materials.map((item) => (
            <View key={item.id} style={styles.materialRow}>
              <View style={styles.materialIconCircle}>
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              </View>
              <View style={styles.materialInfoCol}>
                <Text style={styles.materialNameText}>{item.name}</Text>
                <Text style={styles.materialSubText}>{item.sub}</Text>
              </View>
              <View style={styles.materialWeightPill}>
                <Text style={styles.materialWeightText}>{item.weight.toFixed(2)} kg</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Proof of Load Weight (Photo) ───────────────────────── */}
      <View style={styles.proofCard}>
        <View style={styles.proofHeaderRow}>
          <Text style={styles.proofTitle}>Proof of Load Weight</Text>
          <Text style={styles.requiredTag}>Required *</Text>
        </View>

        {/* Photo Thumbnail */}
        <View style={styles.photoContainer}>
          <View style={styles.photoMock}>
            <View style={styles.photoHeaderOverlay}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
              <Text style={styles.photoOverlayText}>Scale_Reading_0815.jpg</Text>
            </View>
            <View style={styles.photoCenterDisplay}>
              <Text style={styles.photoScaleDigits}>08.15 kg</Text>
              <Text style={styles.photoScaleSub}>ECOSCALE DIGITAL READOUT</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.retakeBtn}
          onPress={() => {
            Alert.alert('Camera', 'Scale display photo re-captured.');
            setPhotoAdded(true);
          }}
        >
          <Ionicons name="camera-reverse-outline" size={16} color="#059669" />
          <Text style={styles.retakeBtnText}>Retake or Add Scale Photo</Text>
        </TouchableOpacity>
      </View>

      {/* ── Generator Verification Hand-off ────────────────────── */}
      <View style={styles.handshakeCard}>
        <View style={styles.handshakeHeaderRow}>
          <View>
            <Text style={styles.handshakeTitle}>Generator Verification Hand-off</Text>
            <Text style={styles.generatorName}>Household Citizen: Sarah Chen</Text>
          </View>
          <TouchableOpacity
            style={styles.scanQrBtn}
            onPress={() => Alert.alert('Scan QR', 'Opening camera to scan citizen hand-off QR code...')}
          >
            <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
            <Text style={styles.scanQrBtnText}>Scan QR</Text>
          </TouchableOpacity>
        </View>

        {/* 4-digit PIN Handshake */}
        <View style={styles.pinSection}>
          <Text style={styles.pinLabel}>Generator Handshake PIN</Text>
          <View style={styles.pinBoxesRow}>
            {pinDigits.map((d, index) => (
              <View key={index} style={styles.pinBox}>
                <Text style={styles.pinDigitText}>{d}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Next Destination ───────────────────────────────────── */}
      <View style={styles.destinationCard}>
        <View style={styles.destHeaderRow}>
          <View style={styles.destIconBadge}>
            <Text style={styles.destIconText}>A</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.destLabel}>NEXT DESTINATION</Text>
            <Text style={styles.destHubName}>GreenTech Regional Hub #04</Text>
            <Text style={styles.destEtaText}>7.3 km away • 4 mins ETA</Text>
          </View>
        </View>
        <View style={styles.routeOptimizationPill}>
          <Ionicons name="leaf-outline" size={14} color="#059669" />
          <Text style={styles.routeOptimizationText}>Optimized clean fuel path via 3rd St</Text>
        </View>
      </View>

      {/* ── Actions ────────────────────────────────────────────── */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirmWeighed}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>Confirm Weighed & Mark Picked Up</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.discrepancyBtn}
          onPress={() => Alert.alert('Report Discrepancy', 'Logging weight discrepancy note for supervisor audit...')}
        >
          <Ionicons name="warning-outline" size={16} color="#EF4444" />
          <Text style={styles.discrepancyBtnText}>Report Issue / Weight Discrepancy</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  missionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  missionIdText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  priorityPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  shareBtn: {
    marginLeft: 4,
  },

  /* Tracker Card */
  trackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  trackerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackerHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepCounterPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepCounterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  stepperContainer: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#10B981',
  },
  stepDotActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  stepInnerPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 3,
  },
  stepLineDone: {
    backgroundColor: '#10B981',
  },
  stepContentCol: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitleDone: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepTitleActive: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  stepTitlePending: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stepSubtitleActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },

  /* Scale Card */
  scaleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  scaleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  scaleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scaleModelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  bleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
  },
  blePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  bleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  lcdContainer: {
    marginBottom: 16,
  },
  lcdScreen: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  lcdTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lcdModeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  tareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  tareBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  lcdDigitsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 4,
  },
  lcdWeightNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  lcdWeightUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6EE7B7',
    marginLeft: 6,
  },
  lcdFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 8,
  },
  lcdFooterMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Materials */
  materialsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  materialsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  materialsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  materialsSub: {
    fontSize: 12,
    color: '#64748B',
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  materialIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  materialInfoCol: {
    flex: 1,
  },
  materialNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  materialSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  materialWeightPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  materialWeightText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  /* Proof Card */
  proofCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  proofHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  proofTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  requiredTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  photoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  photoMock: {
    height: 120,
    backgroundColor: '#1E293B',
    justifyContent: 'space-between',
    padding: 10,
  },
  photoHeaderOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  photoOverlayText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  photoCenterDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
  },
  photoScaleDigits: {
    fontSize: 32,
    fontWeight: '900',
    color: '#34D399',
    letterSpacing: 2,
  },
  photoScaleSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  retakeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },

  /* Handshake Card */
  handshakeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  handshakeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  handshakeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  generatorName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scanQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
  },
  scanQrBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pinSection: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  pinBoxesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pinBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDigitText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },

  /* Destination Card */
  destinationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  destHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  destIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  destIconText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  destLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  destHubName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  destEtaText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  routeOptimizationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  routeOptimizationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },

  /* Actions */
  actionsContainer: {
    gap: 12,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064E3B',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  discrepancyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  discrepancyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
});
