import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { collectorService } from '../../services/collector.service';
import { CollectorProfile } from '../../types/collector';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

interface WasteStream {
  id: string;
  name: string;
  rate: string;
  specs: string;
  capacityLimit: string;
  enabled: boolean;
  color: string;
  icon: string;
}

export default function ServiceAreaScreen() {
  const [profile, setProfile] = useState<CollectorProfile | null>(null);
  const [isOperationalActive, setIsOperationalActive] = useState(true);
  const [selectedRadius, setSelectedRadius] = useState('8.5 km');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sub-zones toggles
  const [kuruwitaNorth, setKuruwitaNorth] = useState(true);
  const [kahawattaCorridor, setKahawattaCorridor] = useState(true);

  // Waste streams
  const [wasteStreams, setWasteStreams] = useState<WasteStream[]>([
    {
      id: 'plastic',
      name: 'Plastic Containers',
      rate: '$0.25/kg',
      specs: 'PET / HDPE, Rigid/Clean',
      capacityLimit: '220 kg space',
      enabled: true,
      color: '#10B981',
      icon: '🧴',
    },
    {
      id: 'paper',
      name: 'Paper & Cardboard',
      rate: '$0.15/kg',
      specs: 'Clean bales, Corrugated',
      capacityLimit: '150 kg space',
      enabled: true,
      color: '#F59E0B',
      icon: '📦',
    },
    {
      id: 'metal',
      name: 'Metal & Aluminium',
      rate: '$0.55/kg',
      specs: 'Beverage cans, light scrap',
      capacityLimit: 'Higher odor tolerance',
      enabled: true,
      color: '#8B5CF6',
      icon: '🥫',
    },
    {
      id: 'ewaste',
      name: 'E-Waste & Circuitry',
      rate: '$1.45/kg',
      specs: 'Certified filter, PCBs, small batteries',
      capacityLimit: 'Hazard protocol',
      enabled: true,
      color: '#EF4444',
      icon: '💻',
    },
    {
      id: 'glass',
      name: 'Glass & Cullet',
      rate: '$0.10/kg',
      specs: 'Requires cushioned transport',
      capacityLimit: 'Heavy handling',
      enabled: false,
      color: '#06B6D4',
      icon: '🍾',
    },
    {
      id: 'organic',
      name: 'Organic Waste',
      rate: '$0.08/kg',
      specs: 'Requires odor-sealed container',
      capacityLimit: 'Perishable',
      enabled: false,
      color: '#84CC16',
      icon: '🌱',
    },
  ]);

  // Operating days
  const [activeDays, setActiveDays] = useState(['M', 'T', 'W', 'T', 'F']);
  const allDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  useEffect(() => {
    async function loadData() {
      try {
        const data = await collectorService.getProfile();
        setProfile(data);
      } catch {
        // Fallback profile
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleDay = (day: string, index: number) => {
    const key = `${day}-${index}`;
    // Toggle simple inclusion
    if (activeDays.includes(day)) {
      setActiveDays(activeDays.filter((d) => d !== day));
    } else {
      setActiveDays([...activeDays, day]);
    }
  };

  const toggleStream = (id: string) => {
    setWasteStreams((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await collectorService.updateProfile({
        isAvailable: isOperationalActive,
      });
      const activeCount = wasteStreams.filter((s) => s.enabled).length;
      const msg = `Service Area & Dispatch Parameters Updated!\n• Operational: ${
        isOperationalActive ? 'ACTIVE' : 'INACTIVE'
      }\n• Primary Hub: Sector 04 Hub (${selectedRadius})\n• Active Streams: ${activeCount} accepted\n• Operating Shift: 08:00 AM - 05:30 PM`;

      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Settings Saved 🎉', msg);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update service area settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading operational dispatch settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* ── Top Header Profile ─────────────────────────────────── */}
      <View style={styles.topProfileBar}>
        <View style={styles.avatarBox}>
          <Text style={{ fontSize: 24 }}>👨‍✈️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.haulerName}>{profile?.name || 'Kamal Perera'}</Text>
            <View style={styles.certPill}>
              <Text style={styles.certPillText}>Certified Hauler</Text>
            </View>
          </View>
          <Text style={styles.vehicleSubtitle}>
            {profile?.vehicle_type || 'WP-CAD-4912'} • 🛻 Light Truck • 850 kg Cap
          </Text>
        </View>
        <TouchableOpacity style={styles.headerActionBtn}>
          <Ionicons name="share-social-outline" size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* ── Service Operational Area Card ──────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Service Operational Area</Text>
            <Text style={styles.cardSubtitle}>Live territory matching & dispatch scope</Text>
          </View>
          <View style={styles.activeSwitchWrap}>
            <View style={[styles.activeDot, { backgroundColor: isOperationalActive ? '#10B981' : '#94A3B8' }]} />
            <Text style={[styles.activeLabel, { color: isOperationalActive ? '#059669' : '#64748B' }]}>
              {isOperationalActive ? 'Active' : 'Paused'}
            </Text>
            <Switch
              value={isOperationalActive}
              onValueChange={setIsOperationalActive}
              trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              thumbColor={isOperationalActive ? '#059669' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Radar Graphic Map Card */}
        <View style={styles.radarCard}>
          <View style={styles.hubHeaderRow}>
            <View style={styles.hubBadge}>
              <Ionicons name="location" size={14} color="#059669" />
              <Text style={styles.hubBadgeText}>Sector 04 Hub</Text>
            </View>
            <View style={styles.radiusTag}>
              <Text style={styles.radiusTagText}>8.5 km</Text>
            </View>
          </View>

          {/* Visual Radar Rings */}
          <View style={styles.radarVisualContainer}>
            <View style={styles.radarRingOuter}>
              <View style={styles.radarRingMid}>
                <View style={styles.radarRingInner}>
                  <View style={styles.radarCenterBlip} />
                </View>
              </View>
            </View>
            <View style={styles.radarPulseLine} />
          </View>

          <Text style={styles.radarFooterNote}>Base Operations • Ratnapura Central & East</Text>
        </View>

        {/* Primary Zone */}
        <View style={styles.zoneRow}>
          <Text style={styles.zoneLabel}>PRIMARY ZONE</Text>
          <Text style={styles.zoneValue}>Ratnapura Central & East</Text>
          <Text style={styles.zoneMeta}>Base Operations • Sector 04</Text>
        </View>

        {/* Coverage Dispatch Radius Options */}
        <View style={styles.radiusSelectSection}>
          <View style={styles.radiusHeaderRow}>
            <Text style={styles.smallSectionLabel}>Coverage Dispatch Radius:</Text>
            <Text style={styles.radiusActiveValue}>8.5 km</Text>
          </View>
          <View style={styles.radiusPillsRow}>
            {['Handcart 5km', 'Van 12km', '25km Regional'].map((item) => {
              const isSelected = item.includes('12km') || selectedRadius === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.radiusPill, isSelected && styles.radiusPillActive]}
                  onPress={() => setSelectedRadius(item)}
                >
                  <Text style={[styles.radiusPillText, isSelected && styles.radiusPillTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Connected Sub-Zones */}
        <View style={styles.subZonesSection}>
          <Text style={styles.smallSectionLabel}>CONNECTED SUB-ZONES</Text>

          <View style={styles.subZoneRow}>
            <View style={styles.subZoneIconWrap}>
              <Ionicons name="navigate-outline" size={16} color="#059669" />
            </View>
            <Text style={styles.subZoneName}>Kuruwita North</Text>
            <Switch
              value={kuruwitaNorth}
              onValueChange={setKuruwitaNorth}
              trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              thumbColor={kuruwitaNorth ? '#059669' : '#F1F5F9'}
            />
          </View>

          <View style={styles.subZoneRow}>
            <View style={styles.subZoneIconWrap}>
              <Ionicons name="navigate-outline" size={16} color="#059669" />
            </View>
            <Text style={styles.subZoneName}>Kahawatta Road Corridor</Text>
            <Switch
              value={kahawattaCorridor}
              onValueChange={setKahawattaCorridor}
              trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              thumbColor={kahawattaCorridor ? '#059669' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Save Settings & Update Live Dispatch Button */}
        <TouchableOpacity
          style={styles.saveDispatchBtn}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveDispatchBtnText}>Save Settings & Update Live Dispatch</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Accepted Waste Streams ─────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.cardTitle}>Accepted Waste Streams</Text>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>4 Active</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>Filter load rates & vehicle compliance</Text>
          </View>
        </View>

        {wasteStreams.map((stream) => (
          <View key={stream.id} style={styles.streamItem}>
            <View style={styles.streamIconBox}>
              <Text style={{ fontSize: 20 }}>{stream.icon}</Text>
            </View>

            <View style={styles.streamDetails}>
              <View style={styles.streamTitleRow}>
                <Text style={styles.streamName}>{stream.name}</Text>
                <Text style={styles.streamRate}>{stream.rate}</Text>
              </View>
              <Text style={styles.streamSpecs}>{stream.specs}</Text>
              <Text style={styles.streamLimit}>{stream.capacityLimit}</Text>
            </View>

            <Switch
              value={stream.enabled}
              onValueChange={() => toggleStream(stream.id)}
              trackColor={{ false: '#CBD5E1', true: '#A7F3D0' }}
              thumbColor={stream.enabled ? '#059669' : '#F1F5F9'}
            />
          </View>
        ))}
      </View>

      {/* ── Weekly Schedule & Shift ────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Weekly Schedule & Shift</Text>
            <Text style={styles.cardSubtitle}>Automated pickup dispatch availability</Text>
          </View>
        </View>

        {/* Days of Week Row */}
        <View style={styles.daysRow}>
          {allDays.map((d, idx) => {
            const isSelected = idx < 5; // Monday through Friday default
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.dayCircle, isSelected && styles.dayCircleActive]}
                onPress={() => toggleDay(d, idx)}
              >
                <Text style={[styles.dayCircleText, isSelected && styles.dayCircleTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Shift Window Times */}
        <View style={styles.shiftBoxesRow}>
          <View style={styles.shiftBox}>
            <Text style={styles.shiftBoxLabel}>SHIFT WINDOW • STARTS</Text>
            <Text style={styles.shiftBoxTime}>08:00 AM</Text>
          </View>
          <View style={styles.shiftBox}>
            <Text style={styles.shiftBoxLabel}>SHIFT WINDOW • ENDS</Text>
            <Text style={styles.shiftBoxTime}>05:30 PM</Text>
          </View>
        </View>

        <Text style={styles.shiftHoursMeta}>
          ⏱ 9.5 hours/day active pickup window configured
        </Text>
      </View>

      {/* ── Digital Scale Sync Ready ───────────────────────────── */}
      <View style={styles.scaleSyncCard}>
        <View style={styles.scaleSyncIconBadge}>
          <Ionicons name="bluetooth" size={18} color="#059669" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.scaleSyncTitle}>Digital Scale Sync Ready</Text>
          <Text style={styles.scaleSyncDesc}>
            Ecoscale Smart-pair v2 Ready, Auto-tare on start enabled
          </Text>
        </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },

  /* Top Profile Bar */
  topProfileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  haulerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  certPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  certPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  vehicleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  headerActionBtn: {
    padding: 8,
  },

  /* Base Card */
  card: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activeSwitchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Radar Map */
  radarCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },
  hubHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
    gap: 4,
  },
  hubBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  radiusTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  radiusTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  radarVisualContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarRingOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 252, 231, 0.4)',
  },
  radarRingMid: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1.5,
    borderColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRingInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCenterBlip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },
  radarPulseLine: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    width: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  radarFooterNote: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
    textAlign: 'center',
    marginTop: 6,
  },

  /* Zone */
  zoneRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  zoneLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  zoneValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  zoneMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  /* Radius Select */
  radiusSelectSection: {
    marginBottom: 14,
  },
  radiusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  smallSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  radiusActiveValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  radiusPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radiusPillActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  radiusPillTextActive: {
    color: '#15803D',
  },

  /* Sub Zones */
  subZonesSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginBottom: 16,
  },
  subZoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  subZoneIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subZoneName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },

  /* Save Dispatch Button */
  saveDispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveDispatchBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Waste Streams */
  countPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  streamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  streamIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  streamDetails: {
    flex: 1,
  },
  streamTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  streamName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  streamRate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  streamSpecs: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  streamLimit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
  },

  /* Schedule */
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayCircleActive: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },
  dayCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  dayCircleTextActive: {
    color: '#FFFFFF',
  },
  shiftBoxesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  shiftBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shiftBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  shiftBoxTime: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 3,
  },
  shiftHoursMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginTop: 10,
    textAlign: 'center',
  },

  /* Scale Sync */
  scaleSyncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  scaleSyncIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  scaleSyncTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  scaleSyncDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
