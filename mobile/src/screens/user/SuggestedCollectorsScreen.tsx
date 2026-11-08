import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  navigation?: {
    goBack: () => void;
  };
}

export default function SuggestedCollectorsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="compass-outline" size={44} color="#0284C7" />
      </View>
      <Text style={styles.title}>Explore &amp; Nearby Haulers</Text>
      <Text style={styles.subtitle}>
        Find certified recycling centers, active haulers, and community exchange hubs near Ratnapura and Colombo.
      </Text>
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
    backgroundColor: '#E0F2FE',
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
  },
});

