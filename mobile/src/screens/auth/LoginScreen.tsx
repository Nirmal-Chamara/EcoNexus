import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../../hooks/useAuth';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { Button } from '../../components/common/Button';
import EcoNexusLogo from '../../components/common/EcoNexusLogo';
import { Toast } from '../../components/ui';
import { colors, radii, spacing, typography } from '../../theme';
import { loginSchema } from '../../schemas/auth.schema';
import { canUseBiometrics } from '../../services/biometric';
import { tokenStorage } from '../../services/tokenStorage';
import { mapApiError } from '../../utils/errorMapper';

type LoginForm = z.infer<typeof loginSchema>;

interface Props {
  navigation?: {
    navigate: (screen: string, params?: { partner?: boolean }) => void;
  };
}

export default function LoginScreen({ navigation }: Props) {
  const { signIn, devLogin, logoutReason, dismissLogoutReason } = useAuth();
  const {
    promptGoogleSignIn,
    isLoading: isGoogleLoading,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleAuth();
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });
  const email = watch('email');
  const emailIsValid = loginSchema.shape.email.safeParse(email).success;

  useEffect(() => {
    let mounted = true;
    Promise.all([canUseBiometrics(), tokenStorage.getBiometricEnabled()]).then(
      ([available, enabled]) => {
        if (!mounted) return;
        setBiometricAvailable(available);
        setBiometricEnabled(available && enabled);
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  const toggleBiometric = async () => {
    const nextValue = !biometricEnabled;
    setBiometricEnabled(nextValue);
    try {
      await tokenStorage.setBiometricEnabled(nextValue);
    } catch {
      setBiometricEnabled(!nextValue);
      setServerError('Biometric preferences could not be saved. Please try again.');
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      await signIn(data, keepSignedIn);
    } catch (error: unknown) {
      setServerError(mapApiError(error, 'Invalid email or password. Please try again.'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Badge & Branding */}
        <View style={styles.header}>
          <EcoNexusLogo size="lg" containerStyle={{ marginBottom: 4 }} />
          <Text style={styles.brandSubtitle}>
            Smart recycling & doorstep waste pickup for sustainable living
          </Text>
        </View>

        {/* Segmented Toggle Tabs */}
        <View accessibilityRole="tablist" style={styles.tabContainer}>
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Sign In"
            accessibilityState={{ selected: true }}
            style={[styles.tabButton, styles.tabActive]}
          >
            <Ionicons name="log-in-outline" size={17} color="#065F46" style={styles.tabIcon} />
            <Text style={styles.tabActiveText}>Sign In</Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Create Account"
            accessibilityState={{ selected: false }}
            onPress={() => navigation?.navigate('Register')}
            style={styles.tabButton}
          >
            <Ionicons name="person-add-outline" size={17} color="#6B7280" style={styles.tabIcon} />
            <Text style={styles.tabInactiveText}>Create Account</Text>
          </Pressable>
        </View>

        {/* Toast Alerts */}
        {logoutReason && (
          <Toast
            visible
            tone="error"
            duration={0}
            onDismiss={dismissLogoutReason}
            message={
              logoutReason === 'SUSPENDED'
                ? 'Your account is suspended or disabled. Contact support.'
                : 'Your session has expired. Please sign in again.'
            }
          />
        )}
        {(serverError || googleError) && (
          <Toast
            visible
            tone="error"
            duration={0}
            onDismiss={() => {
              setServerError(null);
              clearGoogleError();
            }}
            message={serverError || googleError || ''}
          />
        )}

        {/* Social Authentication Buttons */}
        <View style={styles.socialButtonsGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            style={styles.socialButton}
            onPress={() => promptGoogleSignIn(keepSignedIn)}
            disabled={isGoogleLoading}
          >
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={styles.socialButtonText}>
              {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Apple"
            style={styles.socialButton}
            onPress={() => { }}
          >
            <Ionicons name="logo-apple" size={19} color="#000000" />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Email Field */}
          <View style={styles.fieldWrapper}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Household Email</Text>
              {emailIsValid && (
                <View style={styles.validBadge}>
                  <Text style={styles.validBadgeText}>✓ Valid</Text>
                </View>
              )}
            </View>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputBox, errors.email && styles.inputBoxError]}>
                  <Ionicons name="mail-outline" size={19} color="#9CA3AF" style={styles.inputLeadingIcon} />
                  <TextInput
                    ref={undefined}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="sarah.eco@greenmail.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    accessibilityLabel="Email address"
                    accessibilityHint={
                      ['Email address', errors.email?.message || (emailIsValid ? 'Valid' : undefined)]
                        .filter(Boolean)
                        .join('. ') || undefined
                    }
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    style={styles.textInput}
                  />
                  {emailIsValid && !errors.email && (
                    <Ionicons name="checkmark-circle" size={19} color="#10B981" />
                  )}
                </View>
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          {/* Password Field */}
          <View style={styles.fieldWrapper}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Security Password</Text>
              <Pressable
                onPress={() => navigation?.navigate('ForgotPassword')}
                accessibilityRole="button"
                accessibilityLabel="Forgot password?"
              >
                <Text style={styles.forgotLink}>Forgot?</Text>
              </Pressable>
            </View>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputBox, errors.password && styles.inputBoxError]}>
                  <Ionicons name="lock-closed-outline" size={19} color="#9CA3AF" style={styles.inputLeadingIcon} />
                  <TextInput
                    ref={passwordRef}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="CleanPlanet2026!"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoComplete="password"
                    autoCapitalize="none"
                    returnKeyType="done"
                    accessibilityLabel="Password"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    style={styles.textInput}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </Pressable>
                </View>
              )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          {/* Keep me signed in + Bio ID row */}
          <View style={styles.controlsRow}>
            <Pressable
              onPress={() => setKeepSignedIn(!keepSignedIn)}
              style={styles.checkboxWrapper}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: keepSignedIn }}
              accessibilityLabel="Keep me signed in"
            >
              <View style={[styles.checkbox, keepSignedIn && styles.checkboxActive]}>
                {keepSignedIn && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Keep me signed in</Text>
            </Pressable>

            {biometricAvailable && (
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="Use Bio ID to unlock this session"
                accessibilityState={{ checked: biometricEnabled }}
                onPress={toggleBiometric}
                style={[styles.bioIdPill, biometricEnabled && styles.bioIdPillActive]}
              >
                <Ionicons
                  name="finger-print-outline"
                  size={16}
                  color={biometricEnabled ? '#047857' : '#059669'}
                />
                <Text style={styles.bioIdText}>Bio ID</Text>
              </Pressable>
            )}
          </View>

          {/* Primary Submit Button */}
          <Button
            title="Sign In to EcoNexus →"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            accessibilityLabel="Sign In"
            style={styles.submitButton}
          />
        </View>

        {/* Social Proof / Benefit Promo Card */}
        <View style={styles.benefitCard}>
          <View style={styles.benefitTopRow}>
            <View style={styles.benefitIconCircle}>
              <Ionicons name="ribbon-outline" size={20} color="#059669" />
            </View>
            <Text style={styles.benefitTitle}>14,280+ Active Households</Text>
            <View style={styles.ptsBadge}>
              <Text style={styles.ptsBadgeText}>+100 Pts</Text>
            </View>
          </View>
          <Text style={styles.benefitDescription}>
            Earn 100 EcoPoints right after your first sorted waste pickup is verified.
          </Text>
          <View style={styles.benefitBottomRow}>
            <View style={styles.avatarStack}>
              <View style={[styles.avatarCircle, { backgroundColor: '#A7F3D0', zIndex: 3 }]}>
                <Text style={styles.avatarInitials}>NP</Text>
              </View>
              <View style={[styles.avatarCircle, { backgroundColor: '#BAE6FD', marginLeft: -8, zIndex: 2 }]}>
                <Text style={styles.avatarInitials}>AS</Text>
              </View>
              <View style={[styles.avatarCircle, { backgroundColor: '#FED7AA', marginLeft: -8, zIndex: 1 }]}>
                <Text style={styles.avatarInitials}>KM</Text>
              </View>
            </View>
            <Text style={styles.recycledHighlight}>• 65 tons recycled this month</Text>
          </View>
        </View>

        {/* Collector / Partner Link */}
        <View style={styles.partnerSection}>
          <Text style={styles.partnerPrompt}>Collecting or sorting commercial waste?</Text>
          <Pressable
            onPress={() => navigation?.navigate('Register', { partner: true })}
            accessibilityRole="button"
            accessibilityLabel="Log In to Collector or Facility Partner Portal"
            style={styles.partnerPillButton}
          >
            <Ionicons name="business-outline" size={16} color="#059669" />
            <Text style={styles.partnerPillText}>Log In to Collector / Facility Partner Portal &gt;</Text>
          </Pressable>
        </View>

        {/* Collector Role Portal Link */}
        <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 4, gap: 10 }}>
          <Pressable
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 20,
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderWidth: 1,
              borderColor: 'rgba(245, 158, 11, 0.3)',
            }}
            onPress={() => navigation?.navigate('CollectorLogin')}
          >
            <Text style={{ color: colors.roleCollector, fontSize: 13, fontWeight: '700' }}>
              🚛 Collector Partner Sign In →
            </Text>
          </Pressable>

          <Pressable
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              backgroundColor: '#ECFDF5',
              borderWidth: 1,
              borderColor: '#10B981',
            }}
            onPress={() => devLogin?.('COLLECTOR')}
          >
            <Text style={{ color: '#047857', fontSize: 12, fontWeight: '800' }}>
              ⚡ Instant Look (Collector Dashboard) →
            </Text>
          </Pressable>
        </View>

        {/* Security Footnote */}
        <Text style={styles.securityFootnote}>
          🔒 256-Bit SSL Encrypted  •  ISO 14001 Certified
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeContainer: {
    marginBottom: spacing.sm,
  },
  badgeCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  badgeZeroWaste: {
    fontSize: 8,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },

  // Segmented Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 24,
    padding: 4,
    marginVertical: spacing.xs,
  },
  tabButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabActiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  tabInactiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Social Auth Buttons
  socialButtonsGroup: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    paddingHorizontal: spacing.sm,
  },

  // Form
  form: {
    gap: spacing.sm,
  },
  fieldWrapper: {
    marginBottom: spacing.xs,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  validBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  validBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  inputBoxError: {
    borderColor: '#EF4444',
  },
  inputLeadingIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    minHeight: 44,
  },
  eyeButton: {
    padding: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },

  // Controls Row
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: '#10B981',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#374151',
  },
  bioIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    minHeight: 36,
  },
  bioIdPillActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#34D399',
  },
  bioIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  // Submit Button
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 25,
    minHeight: 52,
    marginTop: spacing.xs,
  },

  // Benefit Card
  benefitCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  benefitTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  benefitTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  ptsBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ptsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  benefitDescription: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
    marginTop: 6,
  },
  benefitBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarInitials: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1E293B',
  },
  recycledHighlight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },

  // Partner Section
  partnerSection: {
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 6,
  },
  partnerPrompt: {
    fontSize: 12,
    color: '#6B7280',
  },
  partnerPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    minHeight: 42,
  },
  partnerPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },

  // Footnote
  securityFootnote: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
