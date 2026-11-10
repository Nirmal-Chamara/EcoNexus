import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { onboardingTheme } from '../../theme/onboardingTheme';
import { radii, spacing } from '../../theme';
import { pickupService } from '../../services/pickup.service';
import { useLocation } from '../../hooks/useLocation';

interface CategoryOption {
  label: string;
  emoji: string;
  ptsPerKg: number;
}

interface SelectedItem {
  label: string;
  emoji: string;
  ptsPerKg: number;
  weight: number;
}

const CATEGORIES: CategoryOption[] = [
  { label: 'Plastic', emoji: '🧴', ptsPerKg: 30 },
  { label: 'Paper', emoji: '📄', ptsPerKg: 15 },
  { label: 'Cardboard', emoji: '📦', ptsPerKg: 20 },
  { label: 'Metal', emoji: '🥫', ptsPerKg: 45 },
  { label: 'Glass', emoji: '🍾', ptsPerKg: 25 },
  { label: 'E-Waste', emoji: '💻', ptsPerKg: 60 },
  { label: 'Textiles', emoji: '👕', ptsPerKg: 20 },
];

const QUICK_WEIGHTS = [2, 5, 10, 20];

export default function CreateWasteListingScreen() {
  const navigation = useNavigation<any>();
  const { location, address: detectedAddress, loading: locLoading, getCurrentLocation } = useLocation();

  // Multi-material bundle manifest
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([
    { label: 'Plastic', emoji: '🧴', ptsPerKg: 30, weight: 5 },
  ]);
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState(false);

  // Full-screen success overlay state (outside ScrollView for rock-solid cross-platform rendering)
  const [orderSuccess, setOrderSuccess] = useState<{
    id: string;
    totalWeight: number;
    totalPoints: number;
    items: SelectedItem[];
    address: string;
  } | null>(null);

  useEffect(() => {
    if (detectedAddress && !address) {
      setAddress(detectedAddress);
      setAddressError(false);
    }
  }, [detectedAddress, address]);

  const handleUseCurrentLocation = async () => {
    setAddressError(false);
    const coords = await getCurrentLocation();
    if (!coords) {
      Alert.alert('Location Error', 'Unable to retrieve your current location.');
    }
  };

  const toggleCategory = (cat: CategoryOption) => {
    setSubmitError(null);
    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.label === cat.label);
      if (exists) {
        // Keep at least 1 item
        if (prev.length === 1) return prev;
        return prev.filter((item) => item.label !== cat.label);
      } else {
        return [...prev, { ...cat, weight: 5 }];
      }
    });
  };

  const updateItemWeight = (label: string, newWeight: number) => {
    const clamped = Math.max(0.5, Math.min(500, Math.round(newWeight * 10) / 10));
    setSelectedItems((prev) =>
      prev.map((item) => (item.label === label ? { ...item, weight: clamped } : item))
    );
  };

  const removeItem = (label: string) => {
    if (selectedItems.length <= 1) return;
    setSelectedItems((prev) => prev.filter((item) => item.label !== label));
  };

  // Calculations
  const totalWeight = Math.round(selectedItems.reduce((acc, item) => acc + item.weight, 0) * 10) / 10;
  const totalPoints = Math.round(
    selectedItems.reduce((acc, item) => acc + item.weight * item.ptsPerKg, 0)
  );
  const isBundle = selectedItems.length > 1;

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!address.trim()) {
      setAddressError(true);
      const msg = 'Please enter a collection address (e.g., Street, City).';
      setSubmitError(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Missing Address', msg);
      }
      return;
    }

    if (selectedItems.length === 0 || totalWeight <= 0) {
      const msg = 'Please specify at least one material with a weight greater than 0 kg.';
      setSubmitError(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Invalid Weight', msg);
      }
      return;
    }

    const lat = location?.latitude || 6.9271;
    const lng = location?.longitude || 79.8612;

    const wasteTypeString = isBundle
      ? `Multi-Material (${selectedItems.map((i) => i.label).join(', ')})`
      : selectedItems[0].label;

    const manifestBreakdown = selectedItems
      .map((i) => `${i.label}: ${i.weight}kg (~${Math.round(i.weight * i.ptsPerKg)} pts)`)
      .join(', ');

    const combinedNotes = notes.trim()
      ? `Manifest: [${manifestBreakdown}]. Instructions: ${notes.trim()}`
      : `Manifest: [${manifestBreakdown}]`;

    try {
      setSubmitting(true);
      const created = await pickupService.createPickup({
        latitude: lat,
        longitude: lng,
        address: address.trim(),
        wasteType: wasteTypeString,
        estimatedWeight: totalWeight,
        notes: combinedNotes,
      });

      // Surface the success overlay
      setOrderSuccess({
        id: created.id,
        totalWeight,
        totalPoints,
        items: [...selectedItems],
        address: address.trim(),
      });
    } catch (e: any) {
      const errMsg =
        e?.response?.data?.message ||
        e?.message ||
        'Failed to place pickup request. Please check your connection and try again.';
      setSubmitError(errMsg);
      if (Platform.OS !== 'web') {
        Alert.alert('Submission Error', errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavigateToActivity = () => {
    const newlyCreatedId = orderSuccess?.id;
    setOrderSuccess(null);
    setSelectedItems([{ label: 'Plastic', emoji: '🧴', ptsPerKg: 30, weight: 5 }]);
    setNotes('');
    setSubmitError(null);
    navigation.navigate('Activity', { newlyCreatedId });
  };

  const handleResetForNewOrder = () => {
    setOrderSuccess(null);
    setSelectedItems([{ label: 'Plastic', emoji: '🧴', ptsPerKg: 30, weight: 5 }]);
    setNotes('');
    setSubmitError(null);
  };

  return (
    <View style={styles.rootContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. Top Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.topBadge}>
            <Ionicons name="refresh-circle" size={14} color="#059669" />
            <Text style={styles.topBadgeText}>DOORSTEP COLLECTION</Text>
          </View>
          <Text style={styles.title}>Request Waste Pickup</Text>
          <Text style={styles.subtitle}>
            Select one or multiple recyclable materials for a single doorstep collection
          </Text>
        </View>

        {/* ── 2. Select Waste Materials (Multi-select Grid) ──────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Select Recyclable Materials</Text>
            <View style={styles.selectionModeBadge}>
              <Ionicons
                name={isBundle ? 'layers' : 'cube-outline'}
                size={12}
                color="#059669"
              />
              <Text style={styles.selectionModeText}>
                {isBundle ? `${selectedItems.length} Materials (Bundle)` : 'Single Material'}
              </Text>
            </View>
          </View>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedItems.some((item) => item.label === cat.label);
              return (
                <TouchableOpacity
                  key={cat.label}
                  style={[
                    styles.categoryTile,
                    isSelected && styles.categoryTileSelected,
                  ]}
                  onPress={() => toggleCategory(cat)}
                  activeOpacity={0.85}
                  accessibilityRole="checkbox"
                  accessibilityLabel={cat.label}
                  accessibilityState={{ checked: isSelected }}
                >
                  {isSelected && (
                    <View style={styles.tileCheckmarkBadge}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.label}
                  </Text>
                  <Text style={styles.ptsRateText}>+{cat.ptsPerKg} pts/kg</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 3. Multi-Item Manifest Card ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Collection Manifest & Weights</Text>
            <Text style={styles.sectionHint}>Adjust weight per item</Text>
          </View>

          <View style={styles.manifestCard}>
            {selectedItems.map((item) => (
              <View key={item.label} style={styles.manifestItemRow}>
                <View style={styles.itemHeaderLeft}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <View>
                    <Text style={styles.itemName}>{item.label}</Text>
                    <Text style={styles.itemPts}>
                      +{Math.round(item.weight * item.ptsPerKg)} EcoPoints
                    </Text>
                  </View>
                </View>

                {/* Weight Stepper & Input */}
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => updateItemWeight(item.label, item.weight - 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease weight of ${item.label}`}
                  >
                    <Ionicons name="remove" size={16} color="#065F46" />
                  </TouchableOpacity>

                  <View style={styles.weightDisplay}>
                    <TextInput
                      style={styles.weightTextInput}
                      value={String(item.weight)}
                      keyboardType="numeric"
                      onChangeText={(val) => {
                        const num = parseFloat(val);
                        if (!isNaN(num)) updateItemWeight(item.label, num);
                      }}
                    />
                    <Text style={styles.weightUnitText}>kg</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => updateItemWeight(item.label, item.weight + 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Increase weight of ${item.label}`}
                  >
                    <Ionicons name="add" size={16} color="#065F46" />
                  </TouchableOpacity>

                  {selectedItems.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeItem(item.label)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.label}`}
                    >
                      <Ionicons name="close" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {/* Quick Weight Presets */}
            <View style={styles.quickPresetContainer}>
              <Text style={styles.quickPresetLabel}>Quick presets for total batch:</Text>
              <View style={styles.quickWeightRow}>
                {QUICK_WEIGHTS.map((qw) => (
                  <Pressable
                    key={qw}
                    onPress={() => {
                      const distributed = Math.round((qw / selectedItems.length) * 10) / 10;
                      setSelectedItems((prev) =>
                        prev.map((i) => ({ ...i, weight: Math.max(1, distributed) }))
                      );
                    }}
                    style={styles.quickWeightChip}
                  >
                    <Text style={styles.quickWeightChipText}>Total ~{qw}kg</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── 4. Pickup Address ───────────────────────────────────────── */}
        <View style={styles.formSection}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              Pickup Address <Text style={{ color: '#DC2626' }}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={handleUseCurrentLocation}
              style={styles.gpsAutoBtn}
              accessibilityRole="button"
              accessibilityLabel="Auto-detect GPS Location"
            >
              <Ionicons name="navigate-circle" size={14} color="#059669" />
              <Text style={styles.gpsAutoText}>
                {locLoading ? 'Locating...' : 'Auto-detect GPS'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputBox, addressError && styles.inputBoxError]}>
            <Ionicons
              name="location-outline"
              size={18}
              color={addressError ? '#DC2626' : '#059669'}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInputMultiline}
              placeholder="Enter your street address, town, or landmark"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={(t) => {
                setAddress(t);
                setAddressError(false);
                setSubmitError(null);
              }}
              multiline
              numberOfLines={2}
              accessibilityLabel="Pickup address"
            />
          </View>
          {addressError && (
            <Text style={styles.fieldErrorText}>
              ⚠️ Please type your collection address or tap 'Auto-detect GPS'.
            </Text>
          )}
        </View>

        {/* ── 5. Instructions for Collector (Optional) ────────────────── */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Instructions for Collector (Optional)</Text>
          <View style={[styles.inputBox, styles.inputBoxArea]}>
            <Ionicons
              name="chatbox-ellipses-outline"
              size={18}
              color="#9CA3AF"
              style={[styles.inputIcon, { marginTop: 12 }]}
            />
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="e.g., Gate code 1234, bags placed by the porch"
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              accessibilityLabel="Instructions for collector"
            />
          </View>
        </View>

        {/* ── 6. Live Totals & EcoPoints Card ─────────────────────────── */}
        <View style={styles.rewardPromoCard}>
          <View style={styles.rewardPromoTop}>
            <View style={styles.coinBadge}>
              <Text style={styles.coinGlyph}>🪙</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rewardPromoTitle}>
                {totalPoints} EcoPoints  •  {totalWeight} kg Total
              </Text>
              <Text style={styles.rewardPromoSubtitle}>
                {isBundle
                  ? 'Multi-Stream Eco-Hauler: Collects all pre-sorted items in 1 stop'
                  : 'Direct Hauler Dispatch: Matched with certified material collector'}
              </Text>
            </View>
            <View style={styles.liveTag}>
              <Text style={styles.liveTagText}>1 EcoPt = Rs. 1</Text>
            </View>
          </View>
        </View>

        {/* ── 7. Submission Error Message (if any) ────────────────────── */}
        {submitError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        )}

        {/* ── 8. Primary Action Button ────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          disabled={submitting}
          onPress={handleSubmit}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Submit Pickup Request"
        >
          {submitting ? (
            <View style={styles.submitBtnContent}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.submitBtnText}>Placing Order...</Text>
            </View>
          ) : (
            <View style={styles.submitBtnContent}>
              <Text style={styles.submitBtnText}>
                {isBundle
                  ? `Submit Bundle (${selectedItems.length} Materials • ${totalWeight} kg)`
                  : `Submit Pickup (${totalWeight} kg ${selectedItems[0]?.label || ''})`}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* ── 9. Security & Traceability Footnote ─────────────────────── */}
        <View style={styles.footnoteRow}>
          <Ionicons name="shield-checkmark" size={13} color="#059669" />
          <Text style={styles.footnoteText}>
            Verified BLE Digital Scales  •  Clean Sri Lanka Circular Traceability
          </Text>
        </View>
      </ScrollView>

      {/* ── 10. Rock-Solid Full-Screen Success Overlay (Root Level) ───── */}
      {orderSuccess && (
        <View style={styles.fullScreenSuccessOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconRing}>
              <Ionicons name="checkmark-circle" size={48} color="#059669" />
            </View>

            <Text style={styles.modalTitle}>Pickup Request Placed! 🎉</Text>
            <Text style={styles.modalSubtitle}>
              Your order has been recorded in the circular network. Nearby verified eco-haulers have been notified.
            </Text>

            {/* Order Manifest Summary */}
            <View style={styles.modalSummaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Order ID:</Text>
                <Text style={styles.summaryValue}>#{orderSuccess.id.slice(0, 8)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Weight:</Text>
                <Text style={styles.summaryValue}>{orderSuccess.totalWeight} kg</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Reward:</Text>
                <Text style={[styles.summaryValue, { color: '#059669', fontWeight: '800' }]}>
                  +{orderSuccess.totalPoints} EcoPoints
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Collection Address:</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {orderSuccess.address}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Materials:</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>
                  {orderSuccess.items.map((i) => `${i.emoji} ${i.label} (${i.weight}kg)`).join(', ')}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleNavigateToActivity}
              activeOpacity={0.85}
            >
              <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
              <Text style={styles.modalPrimaryBtnText}>View in Activity & Track</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={handleResetForNewOrder}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSecondaryBtnText}>Schedule Another Pickup</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 40,
    gap: spacing.md,
  },

  /* Header */
  header: {
    marginBottom: spacing.xs,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },

  /* Section */
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  selectionModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  selectionModeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },

  /* Category Tiles Grid */
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryTile: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    ...onboardingTheme.cardShadow,
  },
  categoryTileSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
    ...onboardingTheme.glowShadow,
  },
  tileCheckmarkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: '#065F46',
  },
  ptsRateText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },

  /* Manifest Card */
  manifestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...onboardingTheme.cardShadow,
  },
  manifestItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  itemEmoji: {
    fontSize: 22,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemPts: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 54,
    justifyContent: 'center',
  },
  weightTextInput: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    padding: 0,
    marginRight: 2,
  },
  weightUnitText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    marginLeft: 2,
  },
  quickPresetContainer: {
    paddingTop: 4,
    gap: 6,
  },
  quickPresetLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  quickWeightRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickWeightChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickWeightChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  /* Form Section */
  formSection: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  gpsAutoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  gpsAutoText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    ...onboardingTheme.cardShadow,
  },
  inputBoxError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  fieldErrorText: {
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '600',
    marginTop: 2,
  },
  inputBoxArea: {
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    paddingVertical: 12,
  },
  textInputMultiline: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 10,
    minHeight: 52,
  },
  textArea: {
    minHeight: 68,
    textAlignVertical: 'top',
  },

  /* Reward Promo Card */
  rewardPromoCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 14,
  },
  rewardPromoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coinBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinGlyph: {
    fontSize: 20,
  },
  rewardPromoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  rewardPromoSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 15,
  },
  liveTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Error Banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 10,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
    flex: 1,
  },

  /* Submit Button */
  submitBtn: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#047857',
    opacity: 0.8,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* Footnote */
  footnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  footnoteText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Full Screen Success Overlay */
  fullScreenSuccessOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
    elevation: 10,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...onboardingTheme.glowShadow,
  },
  modalIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  modalSummaryBox: {
    width: '100%',
    backgroundColor: '#F8FAF9',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '65%',
    textAlign: 'right',
  },
  modalPrimaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSecondaryBtn: {
    paddingVertical: 8,
  },
  modalSecondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
});
