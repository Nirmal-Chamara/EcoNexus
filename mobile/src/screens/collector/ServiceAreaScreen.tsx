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
} from 'react-native';
import { colors } from '../../theme/colors';
import { collectorService } from '../../services/collector.service';
import { CollectorProfile } from '../../types/collector';

const VEHICLE_OPTIONS = ['TRUCK', 'VAN', 'PICKUP', 'THREE_WHEELER', 'BICYCLE'];

export default function ServiceAreaScreen() {
  const [profile, setProfile] = useState<CollectorProfile | null>(null);
  const [vehicleType, setVehicleType] = useState('TRUCK');
  const [capacity, setCapacity] = useState('500');
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
  }, []);

  const handleSave = async () => {
    const numCapacity = parseFloat(capacity);
    if (isNaN(numCapacity) || numCapacity <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid capacity in kilograms.');
      return;
    }

    try {
      setSaving(true);
      const updated = await collectorService.updateProfile({
        vehicleType,
        vehicleCapacity: numCapacity,
      });
      setProfile(updated);
      Alert.alert('Saved', 'Vehicle details and service capacity updated successfully.');
    } catch (e: any) {
      Alert.alert('Save Failed', e.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.roleCollector} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Vehicle & Capacity</Text>
      <Text style={styles.screenSubtitle}>
        Configure your collection transport parameters for optimal waste allocation.
      </Text>

      {/* Vehicle Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Select Vehicle Type</Text>
        <View style={styles.optionsWrap}>
          {VEHICLE_OPTIONS.map((opt) => {
            const isSelected = vehicleType.toUpperCase() === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.optionChip, isSelected && styles.selectedChip]}
                onPress={() => setVehicleType(opt)}
              >
                <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                  {opt.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Vehicle Capacity Input */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Vehicle Maximum Capacity (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={capacity}
          onChangeText={setCapacity}
          placeholder="e.g. 500"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.helperText}>
          Pickups with estimated weights exceeding this limit won't be prioritized for your route.
        </Text>
      </View>

      {/* Profile Overview Card */}
      <View style={styles.overviewCard}>
        <Text style={styles.overviewTitle}>Current Fleet Status</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Current Rating:</Text>
          <Text style={styles.rowValue}>
            ⭐ {profile?.rating ? Number(profile.rating).toFixed(1) : '5.0'} / 5.0
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Total Collections:</Text>
          <Text style={styles.rowValue}>{profile?.completed_pickups ?? 0} trips</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Availability:</Text>
          <Text
            style={[
              styles.rowValue,
              { color: profile?.is_available ? colors.primary : colors.textMuted },
            ]}
          >
            {profile?.is_available ? 'Online (Accepting Jobs)' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color={colors.textInverse} />
        ) : (
          <Text style={styles.saveBtnText}>Save Vehicle Configuration</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 24,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  selectedChip: {
    backgroundColor: colors.roleCollector,
    borderColor: colors.roleCollector,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectedChipText: {
    color: colors.textInverse,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
  overviewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  overviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: colors.roleCollector,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
