import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  colors,
  spacing,
  radii,
  shadows,
  typography,
  fontSize,
  fontWeight,
  lineHeight,
} from '../../theme';

export default function ThemePreviewScreen({ onClose }: { onClose: () => void }) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
          <Text style={styles.label}>Close preview</Text>
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          EcoNexus tokens
        </Text>
        <Text accessibilityRole="header" style={styles.heading}>
          Colors
        </Text>
        {Object.entries(colors).map(([name, value]) => (
          <View key={name} style={styles.row}>
            <View style={[styles.swatch, { backgroundColor: value }]} />
            <View style={styles.details}>
              <Text style={styles.label}>{name}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          </View>
        ))}
        <Text accessibilityRole="header" style={styles.heading}>
          Typography / system font
        </Text>
        {Object.entries(typography).map(([name, style]) => (
          <View key={name} style={styles.sample}>
            <Text style={styles.value}>
              {name} / {style.fontSize} / {style.lineHeight}
            </Text>
            <Text style={[style, styles.ink]}>EcoNexus</Text>
          </View>
        ))}
        <Text accessibilityRole="header" style={styles.heading}>
          Font sizes
        </Text>
        {Object.entries(fontSize).map(([name, value]) => (
          <Text key={name} style={[styles.ink, { fontSize: value }]}>
            {name} / {value}
          </Text>
        ))}
        <Text accessibilityRole="header" style={styles.heading}>
          Font weights
        </Text>
        {Object.entries(fontWeight).map(([name, value]) => (
          <Text key={name} style={[styles.label, { fontWeight: value }]}>
            {name} / {value}
          </Text>
        ))}
        <Text accessibilityRole="header" style={styles.heading}>
          Line heights
        </Text>
        {Object.entries(lineHeight).map(([name, value]) => (
          <Text key={name} style={[styles.label, { lineHeight: fontSize.base * value }]}>
            {name} / {value}
            {'\n'}EcoNexus
          </Text>
        ))}
        <Text accessibilityRole="header" style={styles.heading}>
          Spacing
        </Text>
        {Object.entries(spacing).map(([name, value]) => (
          <View key={name} style={styles.row}>
            <View
              style={{ width: value, height: spacing.xl, backgroundColor: colors.primaryDark }}
            />
            <Text style={styles.label}>
              {name} / {value}
            </Text>
          </View>
        ))}
        <Text accessibilityRole="header" style={styles.heading}>
          Radii
        </Text>
        {Object.entries(radii).map(([name, value]) => (
          <View key={name} style={[styles.shape, { borderRadius: value }]}>
            <Text style={styles.label}>
              {name} / {value}
            </Text>
          </View>
        ))}
        <Text accessibilityRole="header" style={styles.heading}>
          Shadows
        </Text>
        {Object.entries(shadows).map(([name, value]) => (
          <View key={name} style={[styles.shadow, value]}>
            <Text style={styles.label}>{name}</Text>
            <Text style={styles.value}>
              Offset {value.shadowOffset.height} / blur {value.shadowRadius}
            </Text>
            <Text style={styles.value}>
              Opacity {value.shadowOpacity} / elevation {value.elevation}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral50 },
  content: {
    padding: spacing.xl,
    gap: spacing.md,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  close: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  title: { ...typography.h1, color: colors.neutral900 },
  heading: { ...typography.h2, color: colors.neutral900, marginTop: spacing.xl },
  ink: { color: colors.neutral900 },
  label: { ...typography.bodyMedium, color: colors.neutral900, flexShrink: 1 },
  value: { ...typography.label, color: colors.neutral600 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  details: { flex: 1 },
  swatch: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radii.sm,
  },
  sample: { gap: spacing.xs },
  shape: {
    minHeight: 64,
    padding: spacing.lg,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
  },
  shadow: {
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    padding: spacing.lg,
    marginVertical: spacing.sm,
  },
});
