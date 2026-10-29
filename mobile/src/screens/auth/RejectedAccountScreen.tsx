import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function RejectedAccountScreen() {
  const { user, signOut } = useAuth();
  const reason = user?.rejectionReason?.trim();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>!</Text>
      </View>
      <Text style={styles.title}>Application not approved</Text>
      <Text style={styles.message}>
        {user?.name ? `Hi ${user.name}. ` : ''}
        Your account verification was not approved.
      </Text>
      <View style={styles.reasonCard}>
        <Text style={styles.reasonTitle}>Review note</Text>
        <Text style={styles.reasonText}>
          {reason ?? 'No additional reason was provided. Please contact support for details.'}
        </Text>
      </View>
      <Text style={styles.supportText}>
        You can contact support if you believe this was a mistake.
      </Text>
      <Button title="Sign Out" variant="secondary" onPress={signOut} style={styles.signOutButton} />
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
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.errorSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: { ...typography.h1, color: colors.error },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  reasonCard: {
    width: '100%',
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  reasonTitle: { ...typography.label, color: colors.textSecondary, marginBottom: 8 },
  reasonText: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
  supportText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  signOutButton: { marginTop: 32 },
});
