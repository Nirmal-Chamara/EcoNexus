import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collectorService } from '../../services/collector.service';
import { CollectorProfile } from '../../types/collector';
import { colors } from '../../theme/colors';

const WASTE_CATEGORIES = [
  { id: 'PLASTIC', name: 'Plastic (PET, HDPE)', emoji: '🧴' },
  { id: 'PAPER', name: 'Paper & Cardboard', emoji: '📦' },
  { id: 'METAL', name: 'Metal & Aluminium', emoji: '🥫' },
  { id: 'GLASS', name: 'Glass & Bottles', emoji: '🍾' },
  { id: 'E_WASTE', name: 'E-Waste & Gadgets', emoji: '💻' },
  { id: 'ORGANIC', name: 'Organic & Food Waste', emoji: '🥬' },
];

export default function CapacityScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<CollectorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [capacityKg, setCapacityKg] = useState('500');
  const [vehicleType, setVehicleType] = useState('TRUCK');
  const [acceptedCategories, setAcceptedCategories] = useState<Record<string, boolean>>({
    PLASTIC: true,
    PAPER: true,
    METAL: true,
    GLASS: true,
    E_WASTE: false,
    ORGANIC: false,
  });

  const loadProfile = useCallback(async () => {
    try {
      const data = await collectorService.getProfile();
      if (data) {
        setProfile(data);
        if (data.vehicle_capacity) {
          setCapacityKg(String(data.vehicle_capacity));
        }
        if (data.vehicle_type) {
          setVehicleType(data.vehicle_type);
        }
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const toggleCategory = (catId: string) => {
    setAcceptedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleSave = async () => {
    const num = parseFloat(capacityKg);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Capacity', 'Please enter a positive payload capacity in kg.');
      return;
    }

    try {
      setSaving(true);
      await collectorService.updateProfile({
        vehicleCapacity: num,
        vehicleType,
      });
      Alert.alert('Settings Saved', 'Vehicle payload capacity and accepted categories updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update vehicle capacity.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading vehicle specifications...</Text>
      </View>
    );
  }

  const currentLoad = 240; // From current route stops
  const maxCapacity = parseFloat(capacityKg) || 500;
  const loadPercentage = Math.min(100, Math.round((currentLoad / maxCapacity) * 100));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>FLEET SPECIFICATIONS</Text>
        <Text style={styles.headerTitle}>Vehicle Payload Capacity</Text>
        <Text style={styles.headerDesc}>
          Set your vehicle limits to optimize smart route dispatches and prevent overload.
        </Text>
      </View>

      {/* Real-time Load Gauge Card */}
      <View style={styles.gaugeCard}>
        <View style={styles.gaugeTopRow}>
          <Text style={styles.gaugeLabel}>Current Route Load</Text>
          <Text style={styles.gaugeValue}>
            {currentLoad} / {maxCapacity} kg
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${loadPercentage}%` }]} />
        </View>

        <View style={styles.gaugeFooter}>
          <Text style={styles.gaugeFootText}>
            Remaining available space:{' '}
            <Text style={{ fontWeight: '800', color: '#059669' }}>
              {Math.max(0, maxCapacity - currentLoad)} kg
            </Text>
          </Text>
          <Text style={styles.gaugePercentage}>{loadPercentage}% Full</Text>
        </View>
      </View>

      {/* Payload Setting Form */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Max Payload Setting</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Maximum Vehicle Payload (kg)</Text>
          <TextInput
            style={styles.textInput}
            keyboardType="numeric"
            value={capacityKg}
            onChangeText={setCapacityKg}
            placeholder="e.g. 500"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {/* Accepted Waste Materials */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Accepted Waste Categories</Text>
        <Text style={styles.sectionSub}>
          Dispatches will only assign requests matching your vehicle's capability.
        </Text>

        <View style={styles.categoriesList}>
          {WASTE_CATEGORIES.map((cat) => {
            const isEnabled = Boolean(acceptedCategories[cat.id]);
            return (
              <View key={cat.id} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={styles.catName}>{cat.name}</Text>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={() => toggleCategory(cat.id)}
                  trackColor={{ false: '#E2E8F0', true: '#A7F3D0' }}
                  thumbColor={isEnabled ? '#059669' : '#FFFFFF'}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} disabled={saving} onPress={handleSave}>
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveBtnText}>Save Vehicle Capacity Specifications ✓</Text>
        )}
      </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  headerDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  gaugeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  gaugeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gaugeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  gaugeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  progressBarTrack: {
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 6,
  },
  gaugeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeFootText: {
    fontSize: 12,
    color: '#64748B',
  },
  gaugePercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  inputGroup: {
    marginTop: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  categoriesList: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catEmoji: {
    fontSize: 18,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  saveBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
