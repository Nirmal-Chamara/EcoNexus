import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { Button } from '../common/Button';

export const statusColors = {
  success: colors.success,
  error: colors.error,
  warning: colors.warning,
  info: colors.info,
  neutral: colors.textSecondary,
} as const;
export type StatusTone = keyof typeof statusColors;

export function Card({
  children,
  elevated = false,
  style,
}: {
  children: React.ReactNode;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, elevated && shadows.md, style]}>{children}</View>;
}

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  return (
    <View style={[styles.chip, { borderColor: statusColors[tone] }]}>
      <Text style={[styles.caption, { color: statusColors[tone] }]}>{label}</Text>
    </View>
  );
}
export const Badge = Chip;

export function Avatar({ name, uri, size = 48 }: { name: string; uri?: string; size?: number }) {
  const { fontScale } = useWindowDimensions();
  const [failedUri, setFailedUri] = useState<string>();
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => Array.from(word)[0] ?? '')
      .join('')
      .toUpperCase() || '?';
  const diameter = Math.max(size, 48 * fontScale);
  const dimensions = { width: diameter, height: diameter, borderRadius: diameter / 2 };
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name || 'Profile avatar'}
      style={[styles.avatar, dimensions]}
    >
      {uri && uri !== failedUri ? (
        <Image source={{ uri }} style={dimensions} onError={() => setFailedUri(uri)} />
      ) : (
        <Text style={styles.initials}>{initials}</Text>
      )}
    </View>
  );
}

export function Loader({
  label = 'Loading',
  size = 'small',
}: {
  label?: string;
  size?: 'small' | 'large';
}) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      accessibilityLiveRegion="polite"
      style={styles.loader}
    >
      <ActivityIndicator size={size} color={colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function Toast({
  message,
  tone = 'info',
  visible,
  onDismiss,
  duration = 4000,
}: {
  message: string;
  tone?: StatusTone;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!visible || duration <= 0) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, message, onDismiss]);
  if (!visible) return null;
  return (
    <View style={[styles.toast, { borderColor: statusColors[tone] }]}>
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.toastText}>
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        onPress={onDismiss}
        style={styles.dismiss}
      >
        <Ionicons name="close" size={22} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  icon = 'leaf-outline',
  action,
}: {
  title: string;
  message?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color={colors.primary} />
      <Text accessibilityRole="header" style={styles.heading}>
        {title}
      </Text>
      {!!message && <Text style={styles.centered}>{message}</Text>}
      {action && <Button title={action.label} onPress={action.onPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chip: {
    maxWidth: '100%',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  caption: { ...typography.label },
  avatar: {
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { ...typography.h3, color: colors.textInverse },
  loader: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  text: { ...typography.body, color: colors.textPrimary },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingLeft: spacing.lg,
  },
  toastText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    paddingVertical: spacing.md,
  },
  dismiss: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  heading: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  centered: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
