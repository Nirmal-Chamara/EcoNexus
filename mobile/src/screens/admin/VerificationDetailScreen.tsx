/**
 * VerificationDetailScreen.tsx
 *
 * Admin screen: full detail view for a single verification request.
 *
 * Features:
 *  • Applicant profile card (avatar, name, email, requested role)
 *  • Organization details (name, registration number, document link)
 *  • Review note text area
 *  • APPROVE / REJECT action buttons with confirmation alerts
 *  • Loading state during submission
 *  • Optimistic status update in the card after processing
 *  • Auto-navigates back after successful action
 */

import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { adminService } from '../../services/admin.service';
import type { VerificationRequest, VerificationStatus } from '../../services/admin.service';
import type { AdminVerificationsStackParamList } from '../../navigation/AdminStackNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { UserRole } from '../../types/user';
import { mapApiError } from '../../utils/errorMapper';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<AdminVerificationsStackParamList, 'VerificationDetail'>;
type RoutePropType = RouteProp<AdminVerificationsStackParamList, 'VerificationDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusColor(status: VerificationStatus): string {
  switch (status) {
    case 'PENDING':
      return colors.warning;
    case 'APPROVED':
      return colors.success;
    case 'REJECTED':
      return colors.error;
    default:
      return colors.textMuted;
  }
}

function getStatusLabel(status: VerificationStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending Review';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status;
  }
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'COLLECTOR':
      return 'Waste Collector';
    case 'RECYCLING_CENTER':
      return 'Recycling Center';
    default:
      return role;
  }
}

function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'COLLECTOR':
      return colors.roleCollector;
    case 'RECYCLING_CENTER':
      return colors.roleCenter;
    default:
      return colors.textMuted;
  }
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ─── InfoRow ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─── VerificationDetailScreen ─────────────────────────────────────────────────

export default function VerificationDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();

  const [item, setItem] = useState<VerificationRequest>(route.params.verification);
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isProcessed = item.status !== 'PENDING';

  // ── Process ────────────────────────────────────────────────────────────────
  const handleProcess = useCallback(
    (decision: 'APPROVED' | 'REJECTED') => {
      if (decision === 'REJECTED' && !reviewNote.trim()) {
        setError('Enter a reason before rejecting this verification.');
        return;
      }
      if (reviewNote.trim().length > 500) {
        setError('Review notes must be 500 characters or fewer.');
        return;
      }
      const verb = decision === 'APPROVED' ? 'approve' : 'reject';
      const emoji = decision === 'APPROVED' ? '✅' : '❌';
      const style = decision === 'APPROVED' ? 'default' : 'destructive';

      Alert.alert(
        `${emoji} ${decision === 'APPROVED' ? 'Approve' : 'Reject'} Request`,
        decision === 'APPROVED'
          ? `Approving will grant ${item.user_name} the ${getRoleLabel(item.requested_role)} role and activate their account.`
          : `Rejecting will deny ${item.user_name}'s request. You can provide a reason in the review note.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: decision === 'APPROVED' ? 'Approve' : 'Reject',
            style,
            onPress: async () => {
              try {
                setSubmitting(decision);
                setError(null);
                await adminService.processVerification(item.id, {
                  status: decision,
                  review_note: reviewNote.trim() || undefined,
                });
                // Update local state
                setItem((prev) => ({ ...prev, status: decision }));
                // Show success and navigate back
                setTimeout(() => navigation.goBack(), 800);
              } catch (error: unknown) {
                setError(mapApiError(error, `Failed to ${verb} request.`));
              } finally {
                setSubmitting(null);
              }
            },
          },
        ]
      );
    },
    [item.id, item.user_name, item.requested_role, reviewNote, navigation]
  );

  const openDocument = useCallback(() => {
    if (item.document_url) {
      Linking.openURL(item.document_url).catch(() =>
        Alert.alert('Error', 'Could not open the document link.')
      );
    }
  }, [item.document_url]);

  // ─────────────────────────────────────────────────────────────────────────
  const statusColor = getStatusColor(item.status);
  const roleColor = getRoleColor(item.requested_role);
  const initials = getInitials(item.user_name);

  return (
    <View style={styles.screen}>
      {/* ── Back Bar ──────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          testID="back-btn"
        >
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backLabel}>Queue</Text>
        </TouchableOpacity>

        {/* Current status pill */}
        <View
          style={[
            styles.statusPill,
            { backgroundColor: statusColor + '22', borderColor: statusColor },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Applicant Card ───────────────────────────────────────────── */}
        <View style={styles.applicantCard}>
          <View style={[styles.avatarRing, { borderColor: roleColor }]}>
            <View style={[styles.avatar, { backgroundColor: roleColor + '22' }]}>
              <Text style={[styles.avatarInitials, { color: roleColor }]}>{initials}</Text>
            </View>
          </View>

          <Text style={styles.applicantName}>{item.user_name}</Text>
          <Text style={styles.applicantEmail}>{item.user_email}</Text>

          {/* Requested Role pill */}
          <View
            style={[styles.rolePill, { backgroundColor: roleColor + '22', borderColor: roleColor }]}
          >
            <Text style={[styles.rolePillText, { color: roleColor }]}>
              Requesting: {getRoleLabel(item.requested_role)}
            </Text>
          </View>

          <Text style={styles.submittedDate}>📅 Submitted {formatDate(item.created_at)}</Text>
        </View>

        {/* ── Organization Details ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization Details</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="🏢"
              label="Organization Name"
              value={item.organization_name ?? 'Not provided'}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="🔢"
              label="Registration Number"
              value={item.registration_no ?? 'Not provided'}
            />
            <View style={styles.divider} />
            <InfoRow icon="🆔" label="Request ID" value={item.id} />
          </View>
        </View>

        {/* ── Document ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supporting Document</Text>
          {item.document_url ? (
            <TouchableOpacity
              style={styles.docBtn}
              onPress={openDocument}
              activeOpacity={0.75}
              testID="open-document-btn"
            >
              <Text style={styles.docIcon}>📄</Text>
              <View style={styles.docContent}>
                <Text style={styles.docTitle}>View Document</Text>
                <Text style={styles.docUrl} numberOfLines={1}>
                  {item.document_url}
                </Text>
              </View>
              <Text style={styles.docChevron}>›</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.noDocBanner}>
              <Text style={styles.noDocText}>⚠️ No document was submitted with this request.</Text>
            </View>
          )}
        </View>

        {/* ── Error Banner ─────────────────────────────────────────────── */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* ── Review Note ──────────────────────────────────────────────── */}
        {!isProcessed && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Note (required for rejection)</Text>
            <Text style={styles.sectionHint}>
              A reason is required to reject a verification. Notes are recorded in the audit log.
            </Text>
            <TextInput
              style={styles.noteInput}
              value={reviewNote}
              onChangeText={setReviewNote}
              placeholder="Add a review note…"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoCapitalize="sentences"
              testID="review-note-input"
            />
          </View>
        )}

        {/* ── Actions ──────────────────────────────────────────────────── */}
        {!isProcessed ? (
          <View style={styles.actionsSection}>
            {/* Approve */}
            <TouchableOpacity
              style={[styles.approveBtn, submitting ? styles.btnDisabled : undefined]}
              onPress={() => handleProcess('APPROVED')}
              disabled={!!submitting}
              activeOpacity={0.8}
              testID="approve-btn"
            >
              {submitting === 'APPROVED' ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <>
                  <Text style={styles.approveBtnIcon}>✅</Text>
                  <Text style={styles.approveBtnText}>Approve Request</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Reject */}
            <TouchableOpacity
              style={[styles.rejectBtn, submitting ? styles.btnDisabled : undefined]}
              onPress={() => handleProcess('REJECTED')}
              disabled={!!submitting}
              activeOpacity={0.8}
              testID="reject-btn"
            >
              {submitting === 'REJECTED' ? (
                <ActivityIndicator color={colors.error} size="small" />
              ) : (
                <>
                  <Text style={styles.rejectBtnIcon}>❌</Text>
                  <Text style={styles.rejectBtnText}>Reject Request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // Already processed — show outcome banner
          <View
            style={[
              styles.outcomeBanner,
              { backgroundColor: statusColor + '11', borderColor: statusColor + '44' },
            ]}
          >
            <Text style={[styles.outcomeEmoji]}>{item.status === 'APPROVED' ? '✅' : '❌'}</Text>
            <View style={styles.outcomeContent}>
              <Text style={[styles.outcomeTitle, { color: statusColor }]}>
                {item.status === 'APPROVED' ? 'Request Approved' : 'Request Rejected'}
              </Text>
              <Text style={styles.outcomeText}>
                This verification request has already been processed and cannot be changed.
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>EcoNexus Admin · Verification ID: {item.id.slice(0, 8)}…</Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  // Top bar
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backArrow: { fontSize: 26, color: colors.roleAdmin, lineHeight: 30, marginRight: 2 },
  backLabel: { ...typography.bodyMedium, color: colors.roleAdmin },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { ...typography.caption, fontWeight: '700' },

  // Applicant card
  applicantCard: {
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 28, fontWeight: '700' },
  applicantName: { ...typography.h2, color: colors.textPrimary, marginBottom: 4 },
  applicantEmail: { ...typography.label, color: colors.textMuted, marginBottom: 14 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  rolePillText: { ...typography.label, fontWeight: '700' },
  submittedDate: { ...typography.caption, color: colors.textMuted },

  // Sections
  section: { marginHorizontal: 24, marginBottom: 20 },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionHint: { ...typography.caption, color: colors.textMuted, marginBottom: 12, marginLeft: 4 },

  // Info Card
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  infoIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  infoValue: { ...typography.bodyMedium, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },

  // Document
  docBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.info + '44',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  docIcon: { fontSize: 22 },
  docContent: { flex: 1, minWidth: 0 },
  docTitle: { ...typography.bodyMedium, color: colors.info },
  docUrl: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  docChevron: { fontSize: 20, color: colors.info, lineHeight: 24 },
  noDocBanner: {
    backgroundColor: colors.warningSurface,
    borderWidth: 1,
    borderColor: colors.warning + '44',
    borderRadius: 12,
    padding: 14,
  },
  noDocText: { ...typography.label, color: colors.warning },

  // Error
  errorBanner: {
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.error + '44',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { ...typography.label, color: colors.error },

  // Review Note
  noteInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 100,
  },

  // Actions
  actionsSection: { marginHorizontal: 24, marginBottom: 20, gap: 10 },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 14,
    height: 54,
    gap: 10,
  },
  approveBtnIcon: { fontSize: 20 },
  approveBtnText: { ...typography.button, color: colors.textInverse },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.error + '55',
    borderRadius: 14,
    height: 54,
    gap: 10,
  },
  rejectBtnIcon: { fontSize: 20 },
  rejectBtnText: { ...typography.button, color: colors.error },
  btnDisabled: { opacity: 0.5 },

  // Outcome Banner
  outcomeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  outcomeEmoji: { fontSize: 28 },
  outcomeContent: { flex: 1 },
  outcomeTitle: { ...typography.h3, marginBottom: 4 },
  outcomeText: { ...typography.body, color: colors.textMuted },

  // Footer
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
});
