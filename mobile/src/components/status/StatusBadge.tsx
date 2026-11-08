import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: {
    label: 'Pending',
    bg: '#1C1607',
    text: colors.warning,
    dot: colors.warning,
  },
  ACCEPTED: {
    label: 'Accepted',
    bg: '#0A1E2C',
    text: colors.info,
    dot: colors.info,
  },
  IN_TRANSIT: {
    label: 'In Transit',
    bg: '#1F1A05',
    text: '#FBBF24',
    dot: '#FBBF24',
  },
  EN_ROUTE: {
    label: 'En Route',
    bg: '#1F1A05',
    text: '#FBBF24',
    dot: '#FBBF24',
  },
  COMPLETED: {
    label: 'Completed',
    bg: colors.successSurface,
    text: colors.success,
    dot: colors.success,
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: colors.errorSurface,
    text: colors.error,
    dot: colors.error,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const normalized = status ? status.toUpperCase().replace(/\s+/g, '_') : 'PENDING';
  const config = STATUS_CONFIG[normalized] || {
    label: status,
    bg: colors.surfaceAlt,
    text: colors.textSecondary,
    dot: colors.textMuted,
  };

  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSmall]}>
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
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 11,
  },
});

