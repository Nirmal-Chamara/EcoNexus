import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../hooks/useAuth';
import { onboardingTheme } from '../../theme/onboardingTheme';
import { radii, spacing } from '../../theme';

export default function RejectedAccountScreen() {
  const { user, signOut } = useAuth();
  const reason = user?.rejectionReason?.trim();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Status Tag */}
      <View style={styles.topBadge}>
        <Ionicons name="alert-circle-outline" size={13} color="#DC2626" />
        <Text style={styles.topBadgeText}>APPLICATION STATUS • DECISION FINALIZED</Text>
      </View>

      {/* Emblem */}
      <View style={styles.iconWrapper}>
        <View style={styles.iconInner}>
          <Ionicons name="close-circle" size={44} color="#DC2626" />
        </View>
      </View>

      {/* Titles */}
      <Text style={styles.title}>Application Not Approved</Text>
      <Text style={styles.subtitle}>
        {user?.name ? `Hi ${user.name}. ` : ''}
        Your partner account verification could not be approved at this time.
      </Text>

      {/* Reason Card */}
      <View style={styles.reasonCard}>
        <View style={styles.reasonHeaderRow}>
          <Ionicons name="clipboard-outline" size={18} color="#DC2626" />
          <Text style={styles.reasonTitle}>Review Note from Compliance Team</Text>
        </View>
        <Text style={styles.reasonText}>
          {reason ??
            'Your application did not meet our current vehicle capacity, regional licensing, or verification requirements.'}
        </Text>
      </View>

      {/* Help Guidance Card */}
      <View style={styles.guidanceCard}>
        <Ionicons name="information-circle-outline" size={20} color="#059669" />
        <View style={{ flex: 1 }}>
          <Text style={styles.guidanceTitle}>Believed this was an error?</Text>
          <Text style={styles.guidanceText}>
            You may re-apply with updated documentation or contact our partner onboarding desk at{' '}
            <Text style={{ color: '#059669', fontWeight: '700' }}>support@econexus.com</Text>.
          </Text>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={signOut}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Sign Out"
      >
        <Ionicons name="log-out-outline" size={18} color="#475569" />
        <Text style={styles.signOutBtnText}>Sign Out & Return Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 48,
    alignItems: 'center',
    gap: spacing.md,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginBottom: 4,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    ...onboardingTheme.cardShadow,
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 380,
  },
  reasonCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
    ...onboardingTheme.cardShadow,
  },
  reasonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reasonTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  reasonText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  guidanceCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 14,
  },
  guidanceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  guidanceText: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 17,
  },
  signOutBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    ...onboardingTheme.cardShadow,
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});
