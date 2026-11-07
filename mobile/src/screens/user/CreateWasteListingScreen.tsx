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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { pickupService } from '../../services/pickup.service';
import { useLocation } from '../../hooks/useLocation';

const CATEGORIES = [
  { label: 'Plastic', emoji: '🧴' },
  { label: 'Paper', emoji: '📄' },
  { label: 'Cardboard', emoji: '📦' },
  { label: 'Metal', emoji: '🥫' },
  { label: 'Glass', emoji: '🍾' },
  { label: 'E-Waste', emoji: '💻' },
  { label: 'Textiles', emoji: '👕' },
];

export default function CreateWasteListingScreen() {
  const navigation = useNavigation<any>();
  const { location, address: detectedAddress, loading: locLoading, getCurrentLocation } = useLocation();

  const [selectedCategory, setSelectedCategory] = useState<string>('Plastic');
  const [address, setAddress] = useState<string>('');
  const [weight, setWeight] = useState<string>('5');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (detectedAddress && !address) {
      setAddress(detectedAddress);
    }
  }, [detectedAddress, address]);

  const handleUseCurrentLocation = async () => {
    const coords = await getCurrentLocation();
    if (!coords) {
      Alert.alert('Location Error', 'Unable to retrieve your current location.');
    }
  };

  const handleSubmit = async () => {
    if (!address.trim()) {
      Alert.alert('Missing Address', 'Please provide a collection address.');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid estimated weight in kg.');
      return;
    }

    const lat = location?.latitude || 6.9271;
    const lng = location?.longitude || 79.8612;

    try {
      setSubmitting(true);
      const created = await pickupService.createPickup({
        latitude: lat,
        longitude: lng,
        address: address.trim(),
        wasteType: selectedCategory,
        estimatedWeight: weightNum,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Pickup Requested!',
        'Your waste collection order has been placed. Nearby verified collectors have been alerted.',
        [
          {
            text: 'Track Pickup Now',
            onPress: () => {
              navigation.navigate('TrackTab', { pickupId: created.id });
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to place pickup request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Request Waste Pickup</Text>
        <Text style={styles.subtitle}>
          Schedule recyclable materials collection directly from your doorstep
        </Text>
      </View>

      {/* Category Selection */}
      <Text style={styles.sectionTitle}>Select Waste Material</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.label;
          return (
            <TouchableOpacity
              key={cat.label}
              style={[styles.categoryTile, isSelected && styles.categoryTileSelected]}
              onPress={() => setSelectedCategory(cat.label)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text
                style={[styles.categoryText, isSelected && styles.categoryTextSelected]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Address Form */}
      <View style={styles.formSection}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Pickup Address</Text>
          <TouchableOpacity onPress={handleUseCurrentLocation} style={styles.gpsAutoBtn}>
            <Text style={styles.gpsAutoText}>
              {locLoading ? 'Locating...' : '📍 Auto-detect GPS'}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="e.g., No. 45, Temple Road, Colombo"
          placeholderTextColor={colors.textMuted}
          value={address}
          onChangeText={setAddress}
          multiline
        />
      </View>

      {/* Weight Estimation */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Estimated Weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="5"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />
      </View>

      {/* Optional Instructions */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Instructions for Collector (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g., Gate code is 1234, bags placed by the porch"
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Submit Action */}
      <TouchableOpacity
        style={styles.submitBtn}
        disabled={submitting}
        onPress={handleSubmit}
      >
        {submitting ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.submitBtnText}>Submit Pickup Request 🚀</Text>
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
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryTile: {
    width: '31%',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTileSelected: {
    borderColor: colors.primary,
    backgroundColor: '#071C0D',
  },
  categoryEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  formSection: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  gpsAutoBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gpsAutoText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
});

