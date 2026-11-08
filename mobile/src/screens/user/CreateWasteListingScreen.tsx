import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  navigation?: {
    goBack: () => void;
  };
}

export default function CreateWasteListingScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="add-circle" size={48} color="#059669" />
      </View>
      <Text style={styles.title}>List Your Waste</Text>
      <Text style={styles.subtitle}>
        Select recyclable materials, estimate weight, and request an EcoNexus pickup in 30 seconds.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation?.goBack()}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Return to Home Dashboard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#059669',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

