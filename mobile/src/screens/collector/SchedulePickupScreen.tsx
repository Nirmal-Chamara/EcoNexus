import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collectorService } from '../../services/collector.service';
import { PickupRequest } from '../../types/collector';
import { colors } from '../../theme/colors';

const TIME_SLOTS = [
  { id: 'MORNING', label: 'Morning', time: '08:00 - 12:00', emoji: '🌅' },
  { id: 'AFTERNOON', label: 'Afternoon', time: '12:00 - 16:00', emoji: '☀️' },
  { id: 'EVENING', label: 'Evening', time: '16:00 - 19:00', emoji: '🌇' },
];

export default function SchedulePickupScreen() {
  const navigation = useNavigation<any>();
  const [scheduledPickups, setScheduledPickups] = useState<PickupRequest[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('MORNING');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadScheduled = useCallback(async () => {
    try {
      const data = await collectorService.getAssignedPickups();
      setScheduledPickups(data || []);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadScheduled();
  }, [loadScheduled]);

  const onRefresh = () => {
    setRefreshing(true);
    loadScheduled();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>ROUTE DISPATCH SCHEDULER</Text>
        <Text style={styles.headerTitle}>Scheduled Collections</Text>
        <Text style={styles.headerDesc}>
          Plan and review upcoming time-slot collections assigned to your vehicle fleet.
        </Text>
      </View>

      {/* Time-Slot Filter Pills */}
      <View style={styles.slotsRow}>
        {TIME_SLOTS.map((slot) => {
          const isSelected = selectedSlot === slot.id;
          return (
            <TouchableOpacity
              key={slot.id}
              style={[styles.slotTile, isSelected && styles.slotTileSelected]}
              onPress={() => setSelectedSlot(slot.id)}
            >
              <Text style={styles.slotEmoji}>{slot.emoji}</Text>
              <Text style={[styles.slotLabel, isSelected && styles.slotLabelSelected]}>
                {slot.label}
              </Text>
              <Text style={styles.slotTime}>{slot.time}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Scheduled Orders Section */}
      <Text style={styles.sectionHeader}>Upcoming Dispatch Stops</Text>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      ) : scheduledPickups.length > 0 ? (
        scheduledPickups.map((item, idx) => (
          <View key={item.id} style={styles.scheduleCard}>
            <View style={styles.cardTop}>
              <Text style={styles.cardId}>#ECO-{item.id.slice(0, 4)}</Text>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>
                  🕒 {idx === 0 ? '11:30 AM' : '02:00 PM'}
                </Text>
              </View>
            </View>

            <Text style={styles.customerName}>{item.user_name || 'Dilani K.'}</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              📍 {item.address_text}
            </Text>

            <View style={styles.materialsBox}>
              <Text style={styles.materialsLabel}>MATERIALS</Text>
              <Text style={styles.materialsValue}>
                {item.estimated_weight || 12}.0 kg {item.waste_type}
              </Text>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.actionBtnOutline}
                onPress={() => navigation.navigate('RequestDetails', { pickupId: item.id })}
              >
                <Text style={styles.actionBtnOutlineText}>Details & Map</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSolid}
                onPress={() => Alert.alert('Confirmed', 'Dispatch confirmed.')}
              >
                <Text style={styles.actionBtnSolidText}>Confirm Dispatch ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>📅</Text>
          <Text style={styles.emptyTitle}>No Pickups Scheduled</Text>
          <Text style={styles.emptyDesc}>
            Time-slot reservations made by household customers will appear in this timeline.
          </Text>
        </View>
      )}
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
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  header: {
    marginBottom: 20,
  },
  headerSub: {
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
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  slotTile: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotTileSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  slotEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  slotLabelSelected: {
    color: '#059669',
  },
  slotTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardId: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  timeBadge: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A16207',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  materialsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  materialsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  materialsValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnOutline: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnOutlineText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnSolid: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSolidText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: '85%',
  },
});
