import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  PENDING: {
    label: 'Pending',
    bg: '#FEF3C7',
    text: '#B45309',
    dot: '#F59E0B',
    border: '#FDE68A',
  },
  ACCEPTED: {
    label: 'Accepted',
    bg: '#E0F2FE',
    text: '#0369A1',
    dot: '#0284C7',
    border: '#BAE6FD',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    bg: '#FEF9C3',
    text: '#A16207',
    dot: '#EAB308',
    border: '#FEF08A',
  },
  EN_ROUTE: {
    label: 'En Route',
    bg: '#FEF9C3',
    text: '#A16207',
    dot: '#EAB308',
    border: '#FEF08A',
  },
  COMPLETED: {
    label: 'Completed',
    bg: '#ECFDF5',
    text: '#065F46',
    dot: '#059669',
    border: '#A7F3D0',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: '#FEE2E2',
    text: '#B91C1C',
    dot: '#EF4444',
    border: '#FECACA',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const normalized = status ? status.toUpperCase().replace(/\s+/g, '_') : 'PENDING';
  const config = STATUS_CONFIG[normalized] || {
    label: status,
    bg: '#F1F5F9',
    text: '#475569',
    dot: '#94A3B8',
    border: '#E2E8F0',
  };

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        isSmall && styles.badgeSmall,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.text, { color: config.text }, isSmall && styles.textSmall]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 11,
  },
});

