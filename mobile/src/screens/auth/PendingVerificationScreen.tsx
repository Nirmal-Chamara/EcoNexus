import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * PendingVerificationScreen
 *
 * Shown via RootNavigator when:
 *   - user.status === 'PENDING_VERIFICATION'
 *
 * Displayed after a COLLECTOR or RECYCLING_CENTER registers.
 * They cannot access operational routes until an admin approves.
 */
export default function PendingVerificationScreen() {
  const { user, signOut } = useAuth();

  const roleLabel =
    user?.role === 'COLLECTOR'        ? 'Waste Collector' :
    user?.role === 'RECYCLING_CENTER' ? 'Recycling Center' : '';

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Illustration */}
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>⏳</Text>
      </View>

      {/* Content */}
      <Text style={styles.title}>Verification Pending</Text>
      <Text style={styles.subtitle}>
        Hi <Text style={styles.name}>{user?.name}</Text>! Your{' '}
        <Text style={styles.role}>{roleLabel}</Text> account has been submitted
        for admin review.
      </Text>

      {/* Info Cards */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>📋</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>What happens next?</Text>
            <Text style={styles.cardDesc}>
              Our admin team will review your registration and verify your credentials.
              This typically takes 1–2 business days.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>📧</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>You'll be notified</Text>
            <Text style={styles.cardDesc}>
              A notification will be sent to{' '}
              <Text style={styles.email}>{user?.email}</Text> once your account
              is approved or if additional information is required.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>🔒</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Why verification?</Text>
            <Text style={styles.cardDesc}>
              We verify all collectors and recycling centers to ensure a trusted,
              safe platform for the entire EcoNexus community.
            </Text>
          </View>
        </View>
      </View>

      {/* Action */}
      <Button
        title="Sign Out"
        variant="secondary"
        onPress={signOut}
        style={styles.signOutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingVertical: 56,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.warningSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 1.5,
    borderColor: colors.warning,
  },
  icon:     { fontSize: 44 },
  title:    { ...typography.h1, color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  name:     { color: colors.primary, fontWeight: '600' },
  role:     { color: colors.warning, fontWeight: '600' },
  email:    { color: colors.primaryLight },

  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardRow:  { flexDirection: 'row', gap: 14 },
  cardIcon: { fontSize: 22, marginTop: 2 },
  cardText: { flex: 1 },
  cardTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: 4 },
  cardDesc:  { ...typography.caption, color: colors.textMuted, lineHeight: 18 },

  signOutButton: { marginTop: 28 },
});
