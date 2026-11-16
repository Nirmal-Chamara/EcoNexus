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
import Ionicons from '@expo/vector-icons/Ionicons';
import { collectorService } from '../../services/collector.service';
import { CollectorProfile } from '../../types/collector';
import { onboardingTheme } from '../../theme/onboardingTheme';
import { radii, spacing } from '../../theme';
import * as Location from 'expo-location';

interface VehicleOption {
  key: string;
  label: string;
  emoji: string;
  desc: string;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  { key: 'TRUCK', label: 'Compactor Truck', emoji: '🚛', desc: 'Heavy bulk recycling' },
  { key: 'VAN', label: 'Multi-Compartment Van', emoji: '🚐', desc: 'Segregated streams EV' },
  { key: 'PICKUP', label: 'Pickup Bed', emoji: '🛻', desc: 'Fast suburban dispatch' },
  { key: 'THREE_WHEELER', label: 'Three-Wheeler', emoji: '🛺', desc: 'Narrow urban streets' },
  { key: 'BICYCLE', label: 'Cargo Bicycle', emoji: '🚲', desc: 'Zero-emission micro' },
];

const RADIUS_OPTIONS = [5, 10, 25, 50];
const CAPACITY_PRESETS = ['250', '500', '1000', '2500'];

export default function ServiceAreaScreen() {
  const [profile, setProfile] = useState<CollectorProfile | null>(null);
  const [vehicleType, setVehicleType] = useState('VAN');
  const [capacity, setCapacity] = useState('500');
  const [radiusKm, setRadiusKm] = useState(10);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await collectorService.getProfile();
        setProfile(data);
        if (data.vehicle_type) setVehicleType(data.vehicle_type);
        if (data.vehicle_capacity) setCapacity(String(data.vehicle_capacity));
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
    handleDetectLocation();
  }, []);

  const handleDetectLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCurrentCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    } catch {
      // Fallback
    } finally {
      setLocLoading(false);
    }
  };

  const handleSave = async () => {
    const numCapacity = parseFloat(capacity);
    if (isNaN(numCapacity) || numCapacity <= 0) {
      Alert.alert('Invalid Capacity', 'Please enter a valid capacity in kilograms.');
      return;
    }

    try {
      setSaving(true);
      const updated = await collectorService.updateProfile({
        vehicleType,
        vehicleCapacity: numCapacity,
      });
      setProfile(updated);
      Alert.alert('Saved 🎉', 'Vehicle details and service parameters updated successfully.');
    } catch (e: any) {
      Alert.alert('Save Failed', e.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading fleet dispatch configuration...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ── 1. Top Bar ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.topBadge}>
          <Ionicons name="map-outline" size={13} color="#059669" />
          <Text style={styles.topBadgeText}>DISPATCH RADAR • SECTOR LOGISTICS</Text>
        </View>
        <Text style={styles.screenTitle}>Service Area & Fleet Setup</Text>
        <Text style={styles.screenSubtitle}>
          Configure your operating zone, vehicle capacity, and live GPS dispatch
        </Text>
      </View>

      {/* ── 2. Live GPS Sector Radar Card ─────────────────────── */}
      <View style={styles.radarCard}>
        <View style={styles.radarTopRow}>
          <View style={styles.radarIconBox}>
            <Ionicons name="navigate-circle" size={24} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.radarTitle}>Active Dispatch Sector</Text>
            <Text style={styles.radarSubtitle}>
              {currentCoords
                ? `GPS: ${currentCoords.lat.toFixed(4)}°N, ${currentCoords.lng.toFixed(4)}°E`
                : 'Broadcasting from Ratnapura / Western Sector'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.gpsSyncBtn}
            onPress={handleDetectLocation}
            disabled={locLoading}
            accessibilityRole="button"
            accessibilityLabel="Refresh GPS"
          >
            {locLoading ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Ionicons name="locate" size={16} color="#059669" />
            )}
          </TouchableOpacity>
        </View>

        {/* Operating Radius Pills */}
        <View style={styles.radiusSection}>
          <Text style={styles.radiusLabel}>Operating Radius:</Text>
          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS.map((r) => {
              const isSelected = radiusKm === r;
              return (
                <Pressable
                  key={r}
                  style={[styles.radiusChip, isSelected && styles.radiusChipActive]}
                  onPress={() => setRadiusKm(r)}
                >
                  <Text style={[styles.radiusChipText, isSelected && styles.radiusChipTextActive]}>
                    {r} km
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* ── 3. Vehicle Type Selection ───────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Select Vehicle Type</Text>
          <Text style={styles.sectionHint}>Used for load allocation</Text>
        </View>

        <View style={styles.vehicleGrid}>
          {VEHICLE_OPTIONS.map((opt) => {
            const isSelected = vehicleType.toUpperCase() === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                onPress={() => setVehicleType(opt.key)}
                activeOpacity={0.85}
              >
                {isSelected && (
                  <View style={styles.vehicleCheckBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
                <Text style={styles.vehicleEmoji}>{opt.emoji}</Text>
                <Text style={[styles.vehicleLabel, isSelected && styles.vehicleLabelSelected]} numberOfLines={1}>
                  {opt.label}
                </Text>
                <Text style={styles.vehicleDesc} numberOfLines={1}>
                  {opt.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── 4. Vehicle Capacity Input ───────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Vehicle Maximum Capacity</Text>
          <Text style={styles.sectionHint}>KG limit per route</Text>
        </View>

        {/* Quick Presets */}
        <View style={styles.capacityPresetRow}>
          {CAPACITY_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              style={[styles.presetChip, capacity === preset && styles.presetChipActive]}
              onPress={() => setCapacity(preset)}
            >
              <Text style={[styles.presetChipText, capacity === preset && styles.presetChipTextActive]}>
                {preset} kg
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.capacityInputBox}>
          <Ionicons name="scale-outline" size={20} color="#059669" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.capacityInput}
            keyboardType="numeric"
            value={capacity}
            onChangeText={setCapacity}
            placeholder="500"
            placeholderTextColor="#94A3B8"
          />
          <View style={styles.kgBadge}>
            <Text style={styles.kgBadgeText}>KG</Text>
          </View>
        </View>
        <Text style={styles.helperText}>
          Pickup requests with estimated weights exceeding this limit will not be prioritized on your dispatch route.
        </Text>
      </View>

      {/* ── 5. Current Fleet Status Card ────────────────────────── */}
      <View style={styles.statusCard}>
        <Text style={styles.statusCardTitle}>Current Fleet Status</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Collector Rating:</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>
              ⭐ {profile?.rating ? Number(profile.rating).toFixed(1) : '5.0'} / 5.0
            </Text>
          </View>
        </View>
        <View style={styles.statusDivider} />

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Completed Pickups:</Text>
          <Text style={styles.statusValue}>{profile?.completed_pickups ?? 0} trips logged</Text>
        </View>
        <View style={styles.statusDivider} />

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Dispatch Telemetry:</Text>
          <View style={styles.liveTag}>
            <View style={styles.liveTagDot} />
            <Text style={styles.liveTagText}>
              {profile?.is_available ? 'Online (Accepting Pickups)' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── 6. Save Button ─────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Save Vehicle Configuration"
      >
        {saving ? (
          <View style={styles.saveBtnContent}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Saving Configuration...</Text>
          </View>
        ) : (
          <View style={styles.saveBtnContent}>
            <Ionicons name="save-outline" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save Vehicle & Service Parameters</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
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
    marginBottom: 6,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 18,
  },

  /* Radar Card */
  radarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...onboardingTheme.cardShadow,
  },
  radarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radarIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  radarSubtitle: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 1,
  },
  gpsSyncBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  radiusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 6,
  },
  radiusChip: {
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  radiusChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  radiusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  radiusChipTextActive: {
    color: '#065F46',
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

  /* Vehicle Grid */
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vehicleCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    ...onboardingTheme.cardShadow,
  },
  vehicleCardSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
    ...onboardingTheme.glowShadow,
  },
  vehicleCheckBadge: {
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
  vehicleEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  vehicleLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  vehicleLabelSelected: {
    color: '#065F46',
  },
  vehicleDesc: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },

  /* Capacity */
  capacityPresetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  presetChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  presetChipTextActive: {
    color: '#065F46',
  },
  capacityInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: 48,
    ...onboardingTheme.cardShadow,
  },
  capacityInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  kgBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kgBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },

  /* Status Overview Card */
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    ...onboardingTheme.cardShadow,
  },
  statusCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  liveTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065F46',
  },

  /* Save Button */
  saveBtn: {
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
    marginTop: 6,
  },
  saveBtnDisabled: {
    backgroundColor: '#047857',
    opacity: 0.8,
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* Center Loading */
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});
