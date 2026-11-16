import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../hooks/useAuth';
import { onboardingTheme } from '../../theme/onboardingTheme';
import { radii, spacing } from '../../theme';
import { mapApiError } from '../../utils/errorMapper';

/**
 * PendingVerificationScreen
 *
 * Shown via RootNavigator when:
 *   - user.status === 'PENDING_VERIFICATION'
 *
 * Displayed after a COLLECTOR or RECYCLING_CENTER registers.
 * Designed with the unified light EcoNexus aesthetic matching onboarding and registration.
 */
export default function PendingVerificationScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refreshUser();
    } catch (refreshError: unknown) {
      setError(mapApiError(refreshError, 'Unable to check your status. Please try again.'));
    } finally {
      setRefreshing(false);
    }
  };

  const roleLabel =
    user?.role === 'COLLECTOR'
      ? 'Waste Collector'
      : user?.role === 'RECYCLING_CENTER'
        ? 'Recycling Center'
        : 'Partner';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={checkStatus}
          tintColor="#059669"
          colors={['#059669']}
        />
      }
    >
      {/* ── 1. Top Status Badge ───────────────────────────────────── */}
      <View style={styles.topBadge}>
        <Ionicons name="time-outline" size={13} color="#D97706" />
        <Text style={styles.topBadgeText}>COMPLIANCE VERIFICATION • 1-2 BUSINESS DAYS</Text>
      </View>

      {/* ── 2. Glowing Concentric Emblem ─────────────────────────── */}
      <View style={styles.emblemOuterRing}>
        <View style={styles.emblemMiddleRing}>
          <Text style={styles.emblemEmoji}>⏳</Text>
        </View>
        <View style={styles.livePulseDot}>
          <View style={styles.livePulseInner} />
        </View>
      </View>

      {/* ── 3. Title & Personalized Subtitle ──────────────────────── */}
      <Text style={styles.title}>Verification Pending</Text>
      <Text style={styles.subtitle}>
        Hi <Text style={styles.highlightName}>{user?.name || 'Partner'}</Text>! Your{' '}
        <Text style={styles.highlightRole}>{roleLabel}</Text> account has been submitted for
        compliance and operations review.
      </Text>

      {/* ── 4. 3-Step Verification Pipeline ───────────────────────── */}
      <View style={styles.pipelineCard}>
        <Text style={styles.pipelineHeader}>Onboarding Progress</Text>
        <View style={styles.stepsRow}>
          {/* Step 1 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCompleted]}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
            <Text style={styles.stepLabelActive}>Submitted</Text>
          </View>
          <View style={[styles.stepLine, styles.stepLineActive]} />

          {/* Step 2 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepInProgress]}>
              <Ionicons name="hourglass-outline" size={12} color="#D97706" />
            </View>
            <Text style={styles.stepLabelInProgress}>Admin Review</Text>
          </View>
          <View style={styles.stepLine} />

          {/* Step 3 */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepPending]}>
              <Ionicons name="lock-closed-outline" size={12} color="#94A3B8" />
            </View>
            <Text style={styles.stepLabelPending}>Dispatch Ready</Text>
          </View>
        </View>
      </View>

      {/* ── 5. Account Details Summary Card ───────────────────────── */}
      <View style={styles.accountCard}>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Entity / Name:</Text>
          <Text style={styles.accountValue} numberOfLines={1}>
            {user?.name || '—'}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Requested Role:</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{roleLabel}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Notification Email:</Text>
          <Text style={styles.accountValue} numberOfLines={1}>
            {user?.email || '—'}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Account Status:</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Under Admin Review</Text>
          </View>
        </View>
      </View>

      {/* ── 6. Informational Feature Cards ────────────────────────── */}
      <View style={styles.infoCardsSection}>
        {/* Card 1: What happens next */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="document-text-outline" size={20} color="#059669" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>What happens next?</Text>
              <Text style={styles.cardDesc}>
                Our operations team verifies your business credentials, vehicle registration, and
                service sectors. Review typically takes 1–2 business days.
              </Text>
            </View>
          </View>
        </View>

        {/* Card 2: Notification notice */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="mail-unread-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>You'll be notified</Text>
              <Text style={styles.cardDesc}>
                An official approval email will be sent to{' '}
                <Text style={styles.emailHighlight}>{user?.email}</Text> once your fleet dispatch
                tools and dashboard are activated.
              </Text>
            </View>
          </View>
        </View>

        {/* Card 3: Why verification */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#D97706" />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Why verification?</Text>
              <Text style={styles.cardDesc}>
                We verify all collectors and recycling facilities to ensure ISO-standard circular
                traceability, fair weight calculations, and citizen payout safety.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── 7. Error Alert Banner (if check fails) ─────────────────── */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#DC2626" />
          <Text accessibilityRole="alert" style={styles.errorText}>
            {error}
          </Text>
        </View>
      )}

      {/* ── 8. Action Buttons ─────────────────────────────────────── */}
      <View style={styles.actionSection}>
        {/* Primary Check Status Button */}
        <TouchableOpacity
          style={[styles.primaryBtn, refreshing && styles.primaryBtnDisabled]}
          disabled={refreshing}
          onPress={checkStatus}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Check Verification Status"
        >
          {refreshing ? (
            <View style={styles.btnContent}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.primaryBtnText}>Checking Status...</Text>
            </View>
          ) : (
            <View style={styles.btnContent}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Check Status</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Secondary Sign Out Button */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={signOut}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
        >
          <Ionicons name="log-out-outline" size={18} color="#475569" />
          <Text style={styles.secondaryBtnText}>Sign Out / Switch Account</Text>
        </TouchableOpacity>
      </View>

      {/* ── 9. Compliance Helpdesk Footnote ───────────────────────── */}
      <View style={styles.footnoteRow}>
        <Ionicons name="help-buoy-outline" size={13} color="#64748B" />
        <Text style={styles.footnoteText}>
          Need urgent assistance? Contact compliance@econexus.com
        </Text>
      </View>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 48,
    alignItems: 'center',
    gap: spacing.md,
  },

  /* Top Badge */
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginBottom: 4,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },

  /* Concentric Glowing Emblem */
  emblemOuterRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
    ...onboardingTheme.cardShadow,
  },
  emblemMiddleRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    ...onboardingTheme.cardShadow,
  },
  emblemEmoji: {
    fontSize: 34,
  },
  livePulseDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePulseInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D97706',
  },

  /* Title & Subtitle */
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
    paddingHorizontal: 8,
  },
  highlightName: {
    color: '#0F172A',
    fontWeight: '700',
  },
  highlightRole: {
    color: '#059669',
    fontWeight: '800',
  },

  /* 3-Step Progress Pipeline Card */
  pipelineCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...onboardingTheme.cardShadow,
  },
  pipelineHeader: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleted: {
    backgroundColor: '#059669',
  },
  stepInProgress: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#D97706',
  },
  stepPending: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  stepLabelInProgress: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  stepLabelPending: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    marginBottom: 14,
  },
  stepLineActive: {
    backgroundColor: '#059669',
  },

  /* Account Details Summary Card */
  accountCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    ...onboardingTheme.cardShadow,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  accountValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  roleTag: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400E',
  },

  /* Info Feature Cards */
  infoCardsSection: {
    width: '100%',
    gap: 10,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    ...onboardingTheme.cardShadow,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  emailHighlight: {
    color: '#2563EB',
    fontWeight: '600',
  },

  /* Error Banner */
  errorBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },

  /* Action Section */
  actionSection: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: '#047857',
    opacity: 0.8,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...onboardingTheme.cardShadow,
  },
  secondaryBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },

  /* Footnote */
  footnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  footnoteText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
});
