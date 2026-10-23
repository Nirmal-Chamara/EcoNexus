import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user.service';
import { FormInput } from '../../components/forms/FormInput';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// ─── Validation Schema ────────────────────────────────────────────────────────
const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((d) => d.oldPassword !== d.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

// ─── PasswordStrengthBar ──────────────────────────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  const score = (() => {
    let s = 0;
    if (password.length >= 8)          s++;
    if (/[A-Z]/.test(password))        s++;
    if (/[0-9]/.test(password))        s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const labels   = ['Weak', 'Fair', 'Good', 'Strong'];
  const labelColors = [colors.error, colors.warning, colors.primaryLight, colors.success];
  const barColor = password.length === 0 ? colors.border : labelColors[score - 1] ?? colors.border;
  const label    = password.length === 0 ? '' : labels[score - 1] ?? '';

  return (
    <View style={pwStyles.container}>
      <View style={pwStyles.bars}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              pwStyles.bar,
              { backgroundColor: i < score ? barColor : colors.surfaceAlt },
            ]}
          />
        ))}
      </View>
      {label ? <Text style={[pwStyles.label, { color: barColor }]}>{label}</Text> : null}
    </View>
  );
}

const pwStyles = StyleSheet.create({
  container: { marginTop: -8, marginBottom: 12, gap: 4 },
  bars:      { flexDirection: 'row', gap: 4 },
  bar:       { flex: 1, height: 4, borderRadius: 2 },
  label:     { ...typography.caption, fontWeight: '600' },
});

// ─── ChangePasswordScreen ─────────────────────────────────────────────────────
export default function ChangePasswordScreen() {
  const { signOut } = useAuth();
  const navigation  = useNavigation();
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword:     '',
      newPassword:     '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword');

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsSaving(true);
    try {
      await userService.changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      // Server increments token_version → all existing sessions are invalidated.
      // Force the user to log in again with the new password.
      Alert.alert(
        'Password Changed',
        'Your password has been updated. Please sign in again with your new password.',
        [
          {
            text: 'Sign Out',
            onPress: () => signOut(),
          },
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        'Failed to change password. Please check your current password and try again.';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            testID="change-pwd-back-btn"
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* ── Security Icon ──────────────────────── */}
        <View style={styles.iconSection}>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>🔐</Text>
          </View>
          <Text style={styles.iconSubtitle}>
            Use a strong password with 8+ characters, uppercase letters, and numbers.
          </Text>
        </View>

        {/* ── Form Card ─────────────────────────── */}
        <View style={styles.formCard}>
          <Text style={styles.formSection}>Update Password</Text>

          {/* Current Password */}
          <Controller
            control={control}
            name="oldPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Current Password"
                placeholder="Enter your current password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.oldPassword?.message}
                isPassword
                returnKeyType="next"
                testID="change-pwd-old-input"
              />
            )}
          />

          {/* New Password */}
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <FormInput
                  label="New Password"
                  placeholder="At least 8 characters"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.newPassword?.message}
                  isPassword
                  returnKeyType="next"
                  testID="change-pwd-new-input"
                />
                <PasswordStrengthBar password={value} />
              </>
            )}
          />

          {/* Confirm Password */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Confirm New Password"
                placeholder="Re-enter your new password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                isPassword
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
                testID="change-pwd-confirm-input"
              />
            )}
          />
        </View>

        {/* ── Security Tips ──────────────────────── */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🛡️  Security Tips</Text>
          {[
            'Use at least 8 characters',
            'Include uppercase & lowercase letters',
            'Add numbers and special characters',
            'Never reuse passwords from other sites',
          ].map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <Text style={styles.tipDot}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* ── Actions ───────────────────────────── */}
        <View style={styles.actions}>
          <Button
            title={isSaving ? 'Changing Password…' : 'Change Password'}
            onPress={handleSubmit(onSubmit)}
            loading={isSaving}
            testID="change-pwd-submit-btn"
          />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.cancelBtn}
            testID="change-pwd-cancel-btn"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex:      { flex: 1 },
  screen:    { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: 48 },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingTop:        52,
    paddingBottom:     12,
    paddingHorizontal: 24,
  },
  backBtn:      { width: 36, alignItems: 'flex-start' },
  backIcon:     { fontSize: 30, color: colors.textPrimary, lineHeight: 34 },
  headerTitle:  { ...typography.h2, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  headerSpacer: { width: 36 },

  // Icon section
  iconSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successSurface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon:         { fontSize: 32 },
  iconSubtitle: { ...typography.label, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // Form
  formCard: {
    marginHorizontal: 24,
    backgroundColor:  colors.surface,
    borderRadius:     16,
    borderWidth:      1,
    borderColor:      colors.border,
    padding:          20,
    marginBottom:     20,
  },
  formSection: {
    ...typography.label,
    color:         colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom:  16,
  },

  // Tips
  tipsCard: {
    marginHorizontal: 24,
    backgroundColor:  colors.successSurface,
    borderRadius:     14,
    borderWidth:      1,
    borderColor:      colors.border,
    padding:          16,
    marginBottom:     24,
    gap: 6,
  },
  tipsTitle: { ...typography.bodyMedium, color: colors.primaryLight, marginBottom: 6 },
  tipRow:    { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tipDot:    { color: colors.primary, fontSize: 16, lineHeight: 20 },
  tipText:   { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },

  // Actions
  actions:   { paddingHorizontal: 24, gap: 8 },
  cancelBtn: { marginTop: 0 },
});
