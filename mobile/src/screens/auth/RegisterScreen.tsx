import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  BackHandler,
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/user';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/common/Button';
import EcoNexusLogo from '../../components/common/EcoNexusLogo';
import { onboardingTheme } from '../../theme/onboardingTheme';
import { radii, spacing, typography } from '../../theme';
import { registerFormSchema } from '../../schemas/auth.schema';
import { mapApiError } from '../../utils/errorMapper';
import axios from 'axios';

type RegisterForm = z.infer<typeof registerFormSchema>;
type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

interface RoleOption {
  id: Exclude<UserRole, 'ADMIN'>;
  label: string;
  badge?: string;
  subtext: string;
  description: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
}

const ROLES: RoleOption[] = [
  {
    id: 'USER',
    label: 'Household',
    badge: 'Popular',
    subtext: 'Household / Waste Generator',
    description: 'Schedule pickups and track your eco impact',
    iconName: 'home',
  },
  {
    id: 'COLLECTOR',
    label: 'Collector',
    badge: 'Fleet',
    subtext: 'Fleet Logistics & Field Couriers',
    description: 'Manage pickup requests and collection routes',
    iconName: 'car',
  },
  {
    id: 'RECYCLING_CENTER',
    label: 'Recycling Center',
    badge: 'Facility',
    subtext: 'Processors & Aggregators',
    description: 'Manage accepted materials and recycling operations',
    iconName: 'business',
  },
];

const STEPS = ['Role', 'Account', 'Organization', 'Review'] as const;

function passwordScore(password: string) {
  return [
    password.length >= 8,
    password.length <= 72,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
  ].filter(Boolean).length;
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordScore(password);
  const label = score <= 2 ? 'Weak' : score < 5 ? 'Fair' : 'Strong';
  const tone = score <= 2 ? '#EF4444' : score < 5 ? '#F59E0B' : '#10B981';

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Password strength: ${label}`}
      accessibilityValue={{ min: 0, max: 5, now: score }}
      style={styles.strengthContainer}
    >
      <View style={styles.strengthBars}>
        {Array.from({ length: 5 }, (_, index) => (
          <View
            key={index}
            style={[
              styles.strengthBar,
              index < score && { backgroundColor: tone },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color: tone }]}>{label}</Text>
    </View>
  );
}

export default function RegisterScreen({ navigation, route }: Props) {
  const { signUp } = useAuth();
  const partnerMode = route.params?.partner === true;
  const paramRole = route.params?.role;
  const defaultRole: Exclude<UserRole, 'ADMIN'> =
    paramRole === 'center'
      ? 'RECYCLING_CENTER'
      : paramRole === 'collector' || partnerMode
      ? 'COLLECTOR'
      : 'USER';

  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const organizationRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      role: defaultRole,
      organizationName: '',
    },
  });

  const selectedRole = watch('role');
  const password = watch('password');
  const email = watch('email');
  const requiresOrg = selectedRole === 'COLLECTOR' || selectedRole === 'RECYCLING_CENTER';
  const visibleRoles = partnerMode ? ROLES.filter((role) => role.id !== 'USER') : ROLES;
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 0) return false;
      setStep((current) => current - 1);
      return true;
    });

    return () => subscription.remove();
  }, [step]);

  const nextStep = async () => {
    const fields =
      step === 0
        ? ['role']
        : step === 1
          ? ['name', 'email', 'password', 'confirmPassword', 'phone']
          : step === 2 && requiresOrg
            ? ['organizationName']
            : [];
    const valid = fields.length === 0 || (await trigger(fields as (keyof RegisterForm)[]));
    if (valid) setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const onSubmit = async (data: RegisterForm) => {
    try {
      await signUp({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone || undefined,
        organizationName: requiresOrg ? data.organizationName || undefined : undefined,
      });
    } catch (error: unknown) {
      const code = axios.isAxiosError(error) ? error.response?.data?.code : undefined;
      const field = code === 'PHONE_EXISTS' ? 'phone' : 'email';
      setError(field, { message: mapApiError(error, 'Registration failed. Please try again.') });
      setStep(1);
    }
  };

  const selectedRoleOption = ROLES.find((role) => role.id === selectedRole);
  const selectedRoleLabel = selectedRoleOption?.label ?? selectedRole;

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
        {/* ── Header Branding & Title ───────────────────────────────── */}
        <View style={styles.header}>
          <EcoNexusLogo size="sm" containerStyle={styles.logoBadge} />
          <Text style={styles.title}>
            {partnerMode ? 'Partner registration' : 'Create account'}
          </Text>
          <Text style={styles.subtitle}>
            {partnerMode
              ? 'Apply to join EcoNexus as a verified collection partner.'
              : 'Join EcoNexus and make an impact.'}
          </Text>
        </View>

        {/* ── Step Progress Indicator ───────────────────────────────── */}
        <View style={styles.stepRow} accessibilityLabel={`Registration step ${step + 1} of 4`}>
          {STEPS.map((label, index) => {
            const isCompleted = index < step;
            const isCurrent = index === step;
            const isActive = index <= step;

            return (
              <React.Fragment key={label}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      isActive && styles.stepDotActive,
                      isCurrent && styles.stepDotCurrent,
                    ]}
                  >
                    <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                      {isCompleted ? '✓' : index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                    {label}
                  </Text>
                </View>
                {index < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      index < step && styles.stepLineActive,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Step 0: Choose Account Type ───────────────────────────── */}
        {step === 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Choose your account type</Text>
              {partnerMode && (
                <Text style={styles.helper}>Partner accounts require admin verification.</Text>
              )}
            </View>

            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View style={styles.roleList}>
                  {visibleRoles.map((role) => {
                    const isSelected = value === role.id;
                    return (
                      <Pressable
                        key={role.id}
                        accessibilityRole="radio"
                        accessibilityLabel={role.label}
                        accessibilityState={{ checked: isSelected }}
                        onPress={() => onChange(role.id)}
                        style={[
                          styles.roleCard,
                          isSelected && styles.roleCardActive,
                        ]}
                      >
                        {/* Icon circle */}
                        <View
                          style={[
                            styles.roleIconCircle,
                            isSelected && styles.roleIconCircleActive,
                          ]}
                        >
                          <Ionicons
                            name={role.iconName}
                            size={20}
                            color={isSelected ? '#FFFFFF' : '#059669'}
                          />
                        </View>

                        {/* Text info */}
                        <View style={styles.roleInfo}>
                          <View style={styles.roleTitleRow}>
                            <Text
                              style={[
                                styles.roleLabel,
                                isSelected && styles.roleLabelActive,
                              ]}
                            >
                              {role.label}
                            </Text>
                            {role.badge && (
                              <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>{role.badge}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.roleDescription}>{role.description}</Text>
                        </View>

                        {/* Radio selection circle */}
                        <View
                          style={[
                            styles.radio,
                            isSelected && styles.radioActive,
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />
          </View>
        )}

        {/* ── Step 1: Account Details ───────────────────────────────── */}
        {step === 1 && (
          <View style={styles.section}>
            {/* Full Name */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Full name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputBox, errors.name && styles.inputBoxError]}>
                    <Ionicons name="person-outline" size={19} color="#9CA3AF" style={styles.inputLeadingIcon} />
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Alex Green"
                      placeholderTextColor="#9CA3AF"
                      textContentType="name"
                      autoComplete="name"
                      returnKeyType="next"
                      accessibilityLabel="Full name"
                      onSubmitEditing={() => emailRef.current?.focus()}
                      style={styles.textInput}
                    />
                  </View>
                )}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
            </View>

            {/* Email Address */}
            <View style={styles.fieldWrapper}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Email address</Text>
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
                      ref={emailRef}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="you@example.com"
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
                      onSubmitEditing={() => phoneRef.current?.focus()}
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

            {/* Phone Number */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Phone number (optional)</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputBox, errors.phone && styles.inputBoxError]}>
                    <Ionicons name="call-outline" size={19} color="#9CA3AF" style={styles.inputLeadingIcon} />
                    <TextInput
                      ref={phoneRef}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="+94 77 123 4567"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      textContentType="telephoneNumber"
                      autoComplete="tel"
                      returnKeyType="next"
                      accessibilityLabel="Phone number (optional)"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      style={styles.textInput}
                    />
                  </View>
                )}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
            </View>

            {/* Password */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Password</Text>
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
                      placeholder="8–72 characters with upper, lower, number"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      textContentType="newPassword"
                      autoComplete="new-password"
                      autoCapitalize="none"
                      returnKeyType="next"
                      accessibilityLabel="Password"
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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

            {/* Password Strength Meter */}
            <PasswordStrength password={password} />

            {/* Confirm Password */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Confirm password</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputBox, errors.confirmPassword && styles.inputBoxError]}>
                    <Ionicons name="lock-closed-outline" size={19} color="#9CA3AF" style={styles.inputLeadingIcon} />
                    <TextInput
                      ref={confirmPasswordRef}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirmPassword}
                      textContentType="newPassword"
                      autoComplete="new-password"
                      autoCapitalize="none"
                      returnKeyType="done"
                      accessibilityLabel="Confirm password"
                      onSubmitEditing={nextStep}
                      style={styles.textInput}
                    />
                    <Pressable
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      accessibilityRole="button"
                      accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </Pressable>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
              )}
            </View>
          </View>
        )}

        {/* ── Step 2: Organization Details ──────────────────────────── */}
        {step === 2 && (
          <View style={styles.section}>
            {requiresOrg ? (
              <View style={styles.fieldWrapper}>
                <View style={styles.partnerInfoCard}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.partnerInfoTitle}>Commercial Partner Verification</Text>
                    <Text style={styles.partnerInfoSubtitle}>
                      Official registration ensures your facility or fleet is verified on the Sri Lankan circular ledger.
                    </Text>
                  </View>
                </View>

                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Organization name</Text>
                <Controller
                  control={control}
                  name="organizationName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputBox, errors.organizationName && styles.inputBoxError]}>
                      <Ionicons name="business-outline" size={19} color="#9CA3AF" style={styles.inputLeadingIcon} />
                      <TextInput
                        ref={organizationRef}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Green Collectors Ltd"
                        placeholderTextColor="#9CA3AF"
                        textContentType="organizationName"
                        returnKeyType="done"
                        accessibilityLabel="Organization name"
                        onSubmitEditing={nextStep}
                        style={styles.textInput}
                      />
                    </View>
                  )}
                />
                {errors.organizationName && (
                  <Text style={styles.errorText}>{errors.organizationName.message}</Text>
                )}
              </View>
            ) : (
              <View style={styles.infoCard}>
                <View style={styles.infoIconCircle}>
                  <Ionicons name="checkmark-done-circle-outline" size={28} color="#059669" />
                </View>
                <Text style={styles.cardTitle}>No organization details needed</Text>
                <Text style={styles.cardBody}>
                  Household accounts can continue directly to the review step.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Step 3: Review Details ────────────────────────────────── */}
        {step === 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review your details</Text>

            <View style={styles.reviewCard}>
              <View style={styles.reviewHeaderRow}>
                <View style={styles.reviewAvatarCircle}>
                  <Text style={styles.reviewAvatarText}>
                    {watch('name') ? watch('name').charAt(0).toUpperCase() : 'E'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewPersonName}>{watch('name') || 'Eco Member'}</Text>
                  <View style={styles.reviewRoleBadge}>
                    <Text style={styles.reviewRoleBadgeText}>{selectedRoleLabel}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.reviewDivider} />

              <View style={styles.reviewGrid}>
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewKey}>Account type:</Text>
                  <Text style={styles.reviewVal}>{selectedRoleLabel}</Text>
                </View>

                <View style={styles.reviewItem}>
                  <Text style={styles.reviewKey}>Name:</Text>
                  <Text style={styles.reviewVal}>{watch('name')}</Text>
                </View>

                <View style={styles.reviewItem}>
                  <Text style={styles.reviewKey}>Email:</Text>
                  <Text style={styles.reviewVal}>{watch('email')}</Text>
                </View>

                {!!watch('phone') && (
                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewKey}>Phone:</Text>
                    <Text style={styles.reviewVal}>{watch('phone')}</Text>
                  </View>
                )}

                {requiresOrg && (
                  <View style={styles.reviewItem}>
                    <Text style={styles.reviewKey}>Organization:</Text>
                    <Text style={styles.reviewVal}>{watch('organizationName')}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.reviewNoteRow}>
              <Ionicons name="shield-checkmark" size={15} color="#059669" />
              <Text style={styles.reviewNote}>
                {requiresOrg
                  ? 'Submitting will create a pending account for admin verification.'
                  : 'Submitting will create your active household account.'}
              </Text>
            </View>
          </View>
        )}

        {/* ── Action Buttons ────────────────────────────────────────── */}
        <View style={styles.actions}>
          <Button
            title={step === STEPS.length - 1 ? 'Create Account' : 'Continue'}
            onPress={step === STEPS.length - 1 ? handleSubmit(onSubmit) : nextStep}
            loading={isSubmitting}
            accessibilityLabel={step === STEPS.length - 1 ? 'Create Account' : 'Continue'}
            style={styles.primaryButton}
          />
          {step > 0 && (
            <Button
              title="Back"
              variant="ghost"
              onPress={() => setStep((current) => current - 1)}
              style={styles.backButton}
            />
          )}
        </View>

        {/* ── Sign In Footer ────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.link}>Sign in</Text>
          </Pressable>
        </View>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  /* Header */
  header: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  logoBadge: {
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  helper: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* Step Progress */
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
    paddingHorizontal: 4,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    ...onboardingTheme.cardShadow,
  },
  stepDotActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  stepDotCurrent: {
    ...onboardingTheme.glowShadow,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepNumberActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepLabelActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 6,
    marginBottom: 16,
    backgroundColor: '#E2E8F0',
  },
  stepLineActive: {
    backgroundColor: '#059669',
  },

  /* Section */
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* Role Selection Cards */
  roleList: {
    gap: 10,
  },
  roleCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    ...onboardingTheme.cardShadow,
  },
  roleCardActive: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  roleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconCircleActive: {
    backgroundColor: '#059669',
  },
  roleInfo: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleLabelActive: {
    color: '#064E3B',
  },
  roleBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
  },
  roleDescription: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  radioActive: {
    borderColor: '#059669',
    backgroundColor: '#059669',
  },

  /* Form Fields */
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
    marginBottom: 6,
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

  /* Strength meter */
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    width: 48,
    textAlign: 'right',
  },

  /* Info Card (Step 2 - Household) */
  infoCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
    ...onboardingTheme.cardShadow,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    textAlign: 'center',
  },

  /* Partner Info Card (Step 2 - Collector/Facility) */
  partnerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
  },
  partnerInfoTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#065F46',
  },
  partnerInfoSubtitle: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
    marginTop: 2,
  },

  /* Review Card (Step 3) */
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...onboardingTheme.cardShadow,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  reviewPersonName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  reviewRoleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  reviewGrid: {
    gap: 8,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewKey: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  reviewVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  reviewNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  reviewNote: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    lineHeight: 16,
    fontWeight: '500',
  },

  /* Actions */
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    backgroundColor: '#059669',
    borderRadius: 25,
    minHeight: 52,
    ...onboardingTheme.glowShadow,
  },
  backButton: {
    minHeight: 44,
  },

  /* Footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
});
