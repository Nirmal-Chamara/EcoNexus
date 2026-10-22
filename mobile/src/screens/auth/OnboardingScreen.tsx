import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const slides = [
  {
    icon: '🌱',
    title: 'Welcome to EcoNexus',
    body: 'A smarter way to reduce waste and build cleaner communities.',
  },
  {
    icon: '♻️',
    title: 'Recycle with confidence',
    body: 'Find responsible collection and recycling options near you.',
  },
  {
    icon: '🚛',
    title: 'Reliable collections',
    body: 'Request pickups and keep track of your waste collection.',
  },
  {
    icon: '🌍',
    title: 'See your impact',
    body: 'Follow your recycling activity and celebrate the difference you make.',
  },
  {
    icon: '🤝',
    title: 'Better together',
    body: 'Residents, collectors, and recycling centers work together in one place.',
  },
];

interface Props {
  onComplete: () => Promise<void>;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const slide = slides[index];

  const finish = async () => {
    setSaving(true);
    try {
      await onComplete();
    } catch {
      Alert.alert('Could not save progress', 'Please try continuing again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{slide.icon}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.page}>
          {index + 1} / {slides.length}
        </Text>
        {index === slides.length - 1 ? (
          <Button title="Get started" onPress={finish} loading={saving} />
        ) : (
          <Button title="Next" onPress={() => setIndex((current) => current + 1)} />
        )}
        <Button title="Skip" variant="ghost" disabled={saving} onPress={finish} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 72, marginBottom: 28 },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'center', marginBottom: 14 },
  body: { ...typography.body, color: colors.textSecondary, lineHeight: 25, textAlign: 'center' },
  footer: { gap: 8 },
  page: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginBottom: 8 },
});
