/* eslint-disable react-native/no-color-literals, react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { recyclingService } from '../../services/recycling.service';
import type { RecyclingCenterProfile } from '../../types/recyclingCenter';
import { onboardingTheme } from '../../theme/onboardingTheme';

const CAPACITY_PRESETS = [5000, 10000, 15000, 25000, 50000];

export default function CapacityScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<RecyclingCenterProfile | null>(null);
  const [capacityInput, setCapacityInput] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const data = await recyclingService.getProfile();
      setProfile(data);
      if (data?.total_capacity_kg) {
        setCapacityInput(String(data.total_capacity_kg));
      }
    } catch (err) {
      console.error('Failed to load capacity profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const totalKg = Number(profile?.total_capacity_kg) || 0;
  const currentKg = Number(profile?.current_intake_kg) || 0;
  const remainingKg = Math.max(0, totalKg - currentKg);
  const utilizationPct = totalKg > 0 ? Math.min(100, Math.round((currentKg / totalKg) * 100)) : 0;

  const handleSave = async () => {
    const newCapacity = parseFloat(capacityInput);
    if (isNaN(newCapacity) || newCapacity <= 0) {
      const msg = 'Please enter a valid positive capacity in kilograms.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Invalid Input', msg);
      return;
    }

    if (newCapacity < currentKg) {
      const msg = `Total capacity cannot be less than current stored intake (${currentKg.toLocaleString()} kg).`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Capacity Conflict', msg);
      return;
    }

    setSaving(true);
    try {
      const updated = await recyclingService.updateProfile({
        total_capacity_kg: newCapacity,
      });
      setProfile(updated);
      const msg = `Storage capacity successfully updated to ${newCapacity.toLocaleString()} kg (${(newCapacity / 1000).toFixed(1)} MT).`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Capacity Updated', msg);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj.response?.data?.message || errorObj.message || 'Failed to update capacity.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Storage Capacity</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading capacity metrics...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Hero Utilization Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeaderRow}>
              <View>
                <Text style={styles.heroSubHeader}>CURRENT UTILIZATION</Text>
                <Text style={styles.heroMetric}>
                  {(currentKg / 1000).toFixed(1)}{' '}
                  <Text style={styles.heroUnit}>/ {(totalKg / 1000).toFixed(1)} MT</Text>
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      utilizationPct > 85 ? '#FEF2F2' : utilizationPct > 70 ? '#FEF3C7' : '#ECFDF5',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color:
                        utilizationPct > 85
                          ? '#991B1B'
                          : utilizationPct > 70
                            ? '#92400E'
                            : '#065F46',
                    },
                  ]}
                >
                  {utilizationPct}% Full
                </Text>
              </View>
            </View>

            {/* Visual Bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${utilizationPct}%`,
                    backgroundColor:
                      utilizationPct > 85 ? '#EF4444' : utilizationPct > 70 ? '#F59E0B' : '#10B981',
                  },
                ]}
              />
            </View>

            {/* Metrics Breakdown Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Stored Intake</Text>
                <Text style={styles.metricValue}>{currentKg.toLocaleString()} kg</Text>
                <Text style={styles.metricSub}>{(currentKg / 1000).toFixed(2)} Metric Tons</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Available Space</Text>
                <Text style={[styles.metricValue, { color: '#059669' }]}>
                  {remainingKg.toLocaleString()} kg
                </Text>
                <Text style={styles.metricSub}>{(remainingKg / 1000).toFixed(2)} Metric Tons</Text>
              </View>
            </View>
          </View>

          {/* Edit Capacity Setting Form */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="settings-outline" size={18} color="#059669" />
              <Text style={styles.cardTitle}>Configure Facility Limit</Text>
            </View>
            <Text style={styles.fieldHint}>
              Set the maximum licensed processing and storage capacity of your recycling facility.
            </Text>

            <Text style={styles.inputLabel}>Total Capacity (in Kilograms)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={capacityInput}
                onChangeText={setCapacityInput}
                keyboardType="numeric"
                placeholder="e.g. 15000"
                placeholderTextColor="#94A3B8"
              />
              <Text style={styles.inputSuffix}>KG</Text>
            </View>

            {/* Presets */}
            <Text style={styles.presetsLabel}>Quick Presets:</Text>
            <View style={styles.presetRow}>
              {CAPACITY_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    Number(capacityInput) === preset && styles.presetChipActive,
                  ]}
                  onPress={() => setCapacityInput(String(preset))}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      Number(capacityInput) === preset && styles.presetChipTextActive,
                    ]}
                  >
                    {(preset / 1000).toFixed(0)} MT
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Update Storage Limit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Safety & Thresholds Note */}
          <View style={[styles.card, { backgroundColor: '#F8FAFC' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Ionicons name="information-circle-outline" size={18} color="#64748B" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>
                Threshold Guidelines
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 18 }}>
              • At 80% utilization, alerts are triggered on incoming haulers.{'\n'}• Beyond 95%
              capacity, haulers are automatically redirected to nearby overflow partners.
            </Text>
          </View>
        </ScrollView>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...onboardingTheme.cardShadow,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroSubHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  heroMetric: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  heroUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...onboardingTheme.cardShadow,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldHint: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  inputSuffix: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  presetsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#065F46',
  },
  saveBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
