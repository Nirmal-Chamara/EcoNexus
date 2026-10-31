/**
 * UserDetailScreen.tsx
 *
 * Admin screen: full profile view for a single user with status management.
 *
 * Features:
 *  • Avatar card with role/status badges
 *  • Account metadata (email, phone, joined date)
 *  • One-tap status change actions (ACTIVE, SUSPENDED, REJECTED)
 *  • Confirmation alerts before destructive actions
 *  • Optimistic state update reflected immediately in the UI
 *  • Back button with slide animation
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
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { adminService } from '../../services/admin.service';
import type { AdminUser } from '../../services/admin.service';
import type { AdminUsersStackParamList } from '../../navigation/AdminStackNavigator';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { AccountStatus, UserRole } from '../../types/user';
import { mapApiError } from '../../utils/errorMapper';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<AdminUsersStackParamList, 'UserDetail'>;
type RoutePropType = RouteProp<AdminUsersStackParamList, 'UserDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'USER':
      return colors.roleUser;
    case 'COLLECTOR':
      return colors.roleCollector;
    case 'RECYCLING_CENTER':
      return colors.roleCenter;
    case 'ADMIN':
      return colors.roleAdmin;
    default:
      return colors.textMuted;
  }
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'USER':
      return 'Eco User';
    case 'COLLECTOR':
      return 'Waste Collector';
    case 'RECYCLING_CENTER':
      return 'Recycling Center';
    case 'ADMIN':
      return 'Administrator';
    default:
      return role;
  }
}

function getStatusColor(status: AccountStatus): string {
  switch (status) {
    case 'ACTIVE':
      return colors.success;
    case 'PENDING_VERIFICATION':
      return colors.warning;
    case 'REJECTED':
      return colors.error;
    case 'SUSPENDED':
      return colors.error;
    default:
      return colors.textMuted;
  }
}

function getStatusLabel(status: AccountStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'PENDING_VERIFICATION':
      return 'Pending Verification';
    case 'REJECTED':
      return 'Rejected';
    case 'SUSPENDED':
      return 'Suspended';
    default:
      return status;
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
    });
  } catch {
    return iso;
  }
}

// ─── InfoRow ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────

interface ActionButtonProps {
  label: string;
  sublabel: string;
  icon: string;
  variant: 'success' | 'warning' | 'danger' | 'muted';
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}

const VARIANT_COLORS: Record<string, string> = {
  success: colors.success,
  warning: colors.warning,
  danger: colors.error,
  muted: colors.textMuted,
};

function ActionButton({
  label,
  sublabel,
  icon,
  variant,
  disabled,
  loading,
  onPress,
}: ActionButtonProps) {
  const c = VARIANT_COLORS[variant];
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        { borderColor: c + '55', backgroundColor: c + '11' },
        disabled && styles.actionBtnDisabled,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={disabled || loading}
      testID={`action-${label.toLowerCase().replace(/\s/g, '-')}`}
    >
      {loading ? (
        <ActivityIndicator color={c} size="small" />
      ) : (
        <Text style={[styles.actionIcon, { color: c }]}>{icon}</Text>
      )}
      <View style={styles.actionContent}>
        <Text style={[styles.actionLabel, { color: c }]}>{label}</Text>
        <Text style={styles.actionSublabel}>{sublabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── UserDetailScreen ─────────────────────────────────────────────────────────

export default function UserDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();

  const [user, setUser] = useState<AdminUser>(route.params.user);
  const [loadingAction, setLoadingAction] = useState<AccountStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suspensionModalVisible, setSuspensionModalVisible] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  // ── Status Change ──────────────────────────────────────────────────────────
  const changeStatus = useCallback(
    (newStatus: AccountStatus, confirmMessage: string, reason?: string) => {
      if (user.status === newStatus) return;

      Alert.alert('Confirm Action', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus === 'ACTIVE' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setLoadingAction(newStatus);
              setError(null);
              const res = await adminService.updateUserStatus(user.id, newStatus, reason);
              // Merge updated fields (backend returns id, name, email, status, role)
              setUser((prev) => ({ ...prev, ...res.data, status: newStatus }));
            } catch (error: unknown) {
              setError(mapApiError(error, 'Action failed. Please try again.'));
            } finally {
              setLoadingAction(null);
            }
          },
        },
      ]);
    },
    [user.id, user.status]
  );

  // ─────────────────────────────────────────────────────────────────────────
  const roleColor = getRoleColor(user.role);
  const statusColor = getStatusColor(user.status);
  const initials = getInitials(user.name);
  const isAdmin = user.role === 'ADMIN';

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
          <Text style={styles.backLabel}>Users</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Card ──────────────────────────────────────────────── */}
        <View style={styles.avatarCard}>
          <View style={[styles.avatarRing, { borderColor: roleColor }]}>
            <View style={[styles.avatar, { backgroundColor: roleColor + '22' }]}>
              <Text style={[styles.avatarInitials, { color: roleColor }]}>{initials}</Text>
            </View>
          </View>

          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          <View style={styles.badgeRow}>
            <View
              style={[styles.badge, { backgroundColor: roleColor + '22', borderColor: roleColor }]}
            >
              <Text style={[styles.badgeText, { color: roleColor }]}>
                {getRoleLabel(user.role)}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: statusColor + '22', borderColor: statusColor },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.badgeText, { color: statusColor }]}>
                {getStatusLabel(user.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Account Info ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="📧" label="Email" value={user.email} />
            <View style={styles.divider} />
            <InfoRow icon="📱" label="Phone" value={user.phone ?? 'Not provided'} />
            <View style={styles.divider} />
            <InfoRow icon="🎭" label="Role" value={getRoleLabel(user.role)} />
            <View style={styles.divider} />
            <InfoRow icon="🆔" label="User ID" value={user.id} />
            <View style={styles.divider} />
            <InfoRow icon="📅" label="Joined" value={formatDate(user.created_at)} />
          </View>
        </View>

        {/* ── Error Banner ─────────────────────────────────────────────── */}
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* ── Status Actions ────────────────────────────────────────────── */}
        {!isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Actions</Text>
            <Text style={styles.sectionHint}>
              Changing status will immediately invalidate the user's active sessions.
            </Text>
            <View style={styles.actionsGrid}>
              <ActionButton
                icon="✅"
                label="Activate"
                sublabel="Allow full access"
                variant="success"
                disabled={user.status === 'ACTIVE'}
                loading={loadingAction === 'ACTIVE'}
                onPress={() =>
                  changeStatus(
                    'ACTIVE',
                    `Activate ${user.name}'s account? They will regain full access.`
                  )
                }
              />
              <ActionButton
                icon="🚫"
                label="Suspend"
                sublabel="Temporarily block"
                variant="warning"
                disabled={user.status === 'SUSPENDED'}
                loading={loadingAction === 'SUSPENDED'}
                onPress={() => {
                  setSuspensionReason('');
                  setSuspensionModalVisible(true);
                }}
              />
              <ActionButton
                icon="❌"
                label="Reject"
                sublabel="Permanently deny"
                variant="danger"
                disabled={user.status === 'REJECTED'}
                loading={loadingAction === 'REJECTED'}
                onPress={() =>
                  changeStatus(
                    'REJECTED',
                    `Reject ${user.name}'s account? This will permanently deny their access.`
                  )
                }
              />
            </View>
          </View>
        )}

        {isAdmin && (
          <View style={styles.adminProtectedBanner}>
            <Text style={styles.adminProtectedText}>
              🛡️ Admin accounts cannot be modified from this interface.
            </Text>
          </View>
        )}

        <Text style={styles.footer}>EcoNexus Admin · User ID: {user.id.slice(0, 8)}…</Text>
      </ScrollView>
      <Modal
        visible={suspensionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuspensionModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Suspend {user.name}?</Text>
            <Text style={styles.modalHint}>
              Their active sessions will be invalidated. Enter the reason for the audit record.
            </Text>
            <TextInput
              value={suspensionReason}
              onChangeText={setSuspensionReason}
              style={styles.reasonInput}
              placeholder="Reason (required)"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              accessibilityLabel="Reason for suspending account"
            />
            <ActionButton
              label="Confirm suspension"
              sublabel="This action will be recorded"
              icon="🚫"
              variant="danger"
              disabled={!suspensionReason.trim()}
              loading={loadingAction === 'SUSPENDED'}
              onPress={() => {
                const reason = suspensionReason.trim();
                if (!reason) return;
                setSuspensionModalVisible(false);
                changeStatus(
                  'SUSPENDED',
                  `Suspend ${user.name}'s account? Their active sessions will be invalidated.`,
                  reason
                );
              }}
            />
            <TouchableOpacity
              onPress={() => setSuspensionModalVisible(false)}
              style={styles.modalCancel}
              accessibilityRole="button"
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backArrow: { fontSize: 26, color: colors.roleAdmin, lineHeight: 30, marginRight: 2 },
  backLabel: { ...typography.bodyMedium, color: colors.roleAdmin },

  // Avatar Card
  avatarCard: {
    marginHorizontal: 24,
    marginTop: 8,
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
  userName: { ...typography.h2, color: colors.textPrimary, marginBottom: 4 },
  userEmail: { ...typography.label, color: colors.textMuted, marginBottom: 14 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { ...typography.caption, fontWeight: '600' },

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
  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 12,
    marginLeft: 4,
  },

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

  // Actions
  actionsGrid: { gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  actionBtnDisabled: { opacity: 0.35 },
  actionIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  actionContent: { flex: 1 },
  actionLabel: { ...typography.bodyMedium, fontWeight: '600' },
  actionSublabel: { ...typography.caption, color: colors.textMuted, marginTop: 1 },

  // Admin protected
  adminProtectedBanner: {
    backgroundColor: colors.roleAdmin + '11',
    borderWidth: 1,
    borderColor: colors.roleAdmin + '33',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  adminProtectedText: { ...typography.label, color: colors.roleAdmin, textAlign: 'center' },

  // Footer
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: 24,
  },
  modalCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: 8 },
  modalHint: { ...typography.caption, color: colors.textSecondary, marginBottom: 14 },
  reasonInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 84,
    marginBottom: 14,
    textAlignVertical: 'top',
  },
  modalCancel: { alignItems: 'center', paddingVertical: 14 },
  modalCancelText: { ...typography.bodyMedium, color: colors.textMuted },
});
