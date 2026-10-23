import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { UserRole, AccountStatus } from '../../types/user';

// ─── Param List ───────────────────────────────────────────────────────────────
// Each role-specific ProfileStack should define at minimum these routes.
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
};

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'USER':             return 'Eco User';
    case 'COLLECTOR':        return 'Waste Collector';
    case 'RECYCLING_CENTER': return 'Recycling Center';
    case 'ADMIN':            return 'Administrator';
    default:                 return role;
  }
}

function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case 'USER':             return colors.roleUser;
    case 'COLLECTOR':        return colors.roleCollector;
    case 'RECYCLING_CENTER': return colors.roleCenter;
    case 'ADMIN':            return colors.roleAdmin;
    default:                 return colors.primary;
  }
}

function getStatusColor(status: AccountStatus): string {
  switch (status) {
    case 'ACTIVE':               return colors.success;
    case 'PENDING_VERIFICATION': return colors.warning;
    case 'SUSPENDED':            return colors.error;
    case 'REJECTED':             return colors.error;
    default:                     return colors.textMuted;
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

// ─── MenuItem ─────────────────────────────────────────────────────────────────
interface MenuItemProps {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
  testID?: string;
}

function MenuItem({ icon, label, sublabel, onPress, danger = false, testID }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
    >
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
      </View>
      <Text style={[styles.menuChevron, danger && styles.menuLabelDanger]}>›</Text>
    </TouchableOpacity>
  );
}

// ─── ProfileScreen ─────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<ProfileNavProp>();

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  }, [signOut]);

  if (!user) return null;

  const roleColor    = getRoleBadgeColor(user.role);
  const statusColor  = getStatusColor(user.status);
  const initials     = getInitials(user.name);
  const roleLabel    = getRoleLabel(user.role);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ─────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      {/* ── Avatar Card ───────────────────────── */}
      <View style={styles.avatarCard}>
        <View style={[styles.avatarRing, { borderColor: roleColor }]}>
          <View style={[styles.avatar, { backgroundColor: roleColor + '22' }]}>
            <Text style={[styles.avatarInitials, { color: roleColor }]}>{initials}</Text>
          </View>
        </View>

        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>

        <View style={styles.badgeRow}>
          {/* Role Badge */}
          <View style={[styles.badge, { backgroundColor: roleColor + '22', borderColor: roleColor }]}>
            <Text style={[styles.badgeText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
          {/* Status Badge */}
          <View style={[styles.badge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {user.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {user.phone ? (
          <Text style={styles.phoneText}>📱 {user.phone}</Text>
        ) : null}
      </View>

      {/* ── Account Section ───────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="✏️"
            label="Edit Profile"
            sublabel="Update your name & phone"
            onPress={() => navigation.navigate('EditProfile')}
            testID="profile-edit-btn"
          />
          <View style={styles.divider} />
          <MenuItem
            icon="🔐"
            label="Change Password"
            sublabel="Keep your account secure"
            onPress={() => navigation.navigate('ChangePassword')}
            testID="profile-change-pwd-btn"
          />
        </View>
      </View>

      {/* ── Preferences Section ───────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>More</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="🚪"
            label="Sign Out"
            sublabel="Sign out from your account"
            onPress={handleSignOut}
            danger
            testID="profile-signout-btn"
          />
        </View>
      </View>

      {/* ── Footer ────────────────────────────── */}
      <Text style={styles.footer}>EcoNexus · Building a greener future 🌱</Text>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: 48 },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: { ...typography.h1, color: colors.textPrimary },

  // Avatar Card
  avatarCard: {
    marginHorizontal: 24,
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
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '700',
  },
  userName:  { ...typography.h2,    color: colors.textPrimary, marginBottom: 4 },
  userEmail: { ...typography.label, color: colors.textMuted,   marginBottom: 12 },
  phoneText: { ...typography.label, color: colors.textSecondary, marginTop: 8 },

  // Badges
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
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
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 60,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: colors.errorSurface },
  menuIconText:   { fontSize: 18 },
  menuContent:    { flex: 1 },
  menuLabel:      { ...typography.bodyMedium, color: colors.textPrimary },
  menuLabelDanger:{ color: colors.error },
  menuSublabel:   { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  menuChevron:    { fontSize: 22, color: colors.textMuted, lineHeight: 26 },

  // Footer
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
});
