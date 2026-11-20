import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, spacing, radii, typography } from '../../theme';

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: readonly { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const { fontScale, width } = useWindowDimensions();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.row, (fontScale >= 1.5 || width < 360) && styles.stacked]}
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="tab"
          accessibilityLabel={option.label}
          accessibilityState={{
            selected: value === option.value,
            disabled: disabled || option.disabled,
          }}
          disabled={disabled || option.disabled}
          onPress={() => onChange(option.value)}
          style={[
            styles.tab,
            value === option.value && styles.selected,
            (disabled || option.disabled) && styles.disabled,
          ]}
        >
          <Text style={[styles.label, value === option.value && styles.selectedText]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    padding: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    minWidth: 44,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  selected: { backgroundColor: colors.primary },
  stacked: { flexDirection: 'column' },
  label: { ...typography.label, color: colors.textSecondary, textAlign: 'center' },
  selectedText: { color: colors.textInverse },
  disabled: { opacity: 0.5 },
});
