import React, { useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import {
  KeyboardAvoidingView,
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/user';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Button } from '../../components/common/Button';
import { Card, Input } from '../../components/ui';
import { colors, radii, spacing, typography } from '../../theme';
import { registerFormSchema } from '../../schemas/auth.schema';
import { mapApiError } from '../../utils/errorMapper';
import axios from 'axios';

type RegisterForm = z.infer<typeof registerFormSchema>;
type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const ROLES: {
  id: Exclude<UserRole, 'ADMIN'>;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    id: 'USER',
    label: 'Household',
    icon: '⌂',
    description: 'Schedule pickups and track your eco impact',
  },
  {
    id: 'COLLECTOR',
    label: 'Collector',
    icon: '♻',
    description: 'Manage pickup requests and collection routes',
  },
  {
    id: 'RECYCLING_CENTER',
    label: 'Recycling Center',
    icon: '◎',
    description: 'Manage accepted materials and recycling operations',
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
  const tone = score <= 2 ? colors.error : score < 5 ? colors.warning : colors.success;
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
            style={[styles.strengthBar, index < score && { backgroundColor: tone }]}
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
  const defaultRole: Exclude<UserRole, 'ADMIN'> = partnerMode ? 'COLLECTOR' : 'USER';
  const [step, setStep] = useState(0);
  const emailRef = useRef<TextInput>(null);
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

  const selectedRoleLabel = ROLES.find((role) => role.id === selectedRole)?.label ?? selectedRole;

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
        <View style={styles.header}>
          <Text style={styles.title}>
            {partnerMode ? 'Partner registration' : 'Create account'}
          </Text>
          <Text style={styles.subtitle}>
            {partnerMode
              ? 'Apply to join EcoNexus as a verified collection partner.'
              : 'Join EcoNexus and make an impact.'}
          </Text>
        </View>

        <View style={styles.stepRow} accessibilityLabel={`Registration step ${step + 1} of 4`}>
          {STEPS.map((label, index) => (
            <React.Fragment key={label}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, index <= step && styles.stepDotActive]}>
                  <Text style={[styles.stepNumber, index <= step && styles.stepNumberActive]}>
                    {index < step ? '✓' : index + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, index <= step && styles.stepLabelActive]}>
                  {label}
                </Text>
              </View>
              {index < STEPS.length - 1 && (
                <View style={[styles.stepLine, index < step && styles.stepLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {step === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose your account type</Text>
            {partnerMode && (
              <Text style={styles.helper}>Partner accounts require admin verification.</Text>
            )}
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View style={styles.roleList}>
                  {visibleRoles.map((role) => (
                    <Pressable
                      key={role.id}
                      accessibilityRole="radio"
                      accessibilityLabel={role.label}
                      accessibilityState={{ checked: value === role.id }}
                      onPress={() => onChange(role.id)}
                      style={[styles.roleCard, value === role.id && styles.roleCardActive]}
                    >
                      <Text style={styles.roleIcon}>{role.icon}</Text>
                      <View style={styles.roleInfo}>
                        <Text
                          style={[styles.roleLabel, value === role.id && styles.roleLabelActive]}
                        >
                          {role.label}
                        </Text>
                        <Text style={styles.roleDescription}>{role.description}</Text>
                      </View>
                      <View style={[styles.radio, value === role.id && styles.radioActive]}>
                        {value === role.id && <View style={styles.radioDot} />}
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.section}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full name"
                  placeholder="Alex Green"
                  icon="person-outline"
                  textContentType="name"
                  autoComplete="name"
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={emailRef}
                  label="Email address"
                  placeholder="you@example.com"
                  icon="mail-outline"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  valid={emailIsValid}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone number (optional)"
                  placeholder="+94 77 123 4567"
                  icon="call-outline"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={passwordRef}
                  label="Password"
                  placeholder="8–72 characters with upper, lower, number"
                  icon="lock-closed-outline"
                  isPassword
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />
              )}
            />
            <PasswordStrength password={password} />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  ref={confirmPasswordRef}
                  label="Confirm password"
                  placeholder="Re-enter your password"
                  icon="lock-closed-outline"
                  isPassword
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="done"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  onSubmitEditing={nextStep}
                />
              )}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            {requiresOrg ? (
              <Controller
                control={control}
                name="organizationName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    ref={organizationRef}
                    label="Organization name"
                    placeholder="Green Collectors Ltd"
                    icon="business-outline"
                    textContentType="organizationName"
                    returnKeyType="done"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.organizationName?.message}
                    onSubmitEditing={nextStep}
                  />
                )}
              />
            ) : (
              <Card>
                <Text style={styles.cardTitle}>No organization details needed</Text>
                <Text style={styles.cardBody}>
                  Household accounts can continue directly to the review step.
                </Text>
              </Card>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review your details</Text>
            <Card>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Account type: </Text>
                {selectedRoleLabel}
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Name: </Text>
                {watch('name')}
              </Text>
              <Text style={styles.reviewRow}>
                <Text style={styles.reviewKey}>Email: </Text>
                {watch('email')}
              </Text>
              {!!watch('phone') && (
                <Text style={styles.reviewRow}>
                  <Text style={styles.reviewKey}>Phone: </Text>
                  {watch('phone')}
                </Text>
              )}
              {requiresOrg && (
                <Text style={styles.reviewRow}>
                  <Text style={styles.reviewKey}>Organization: </Text>
                  {watch('organizationName')}
                </Text>
              )}
            </Card>
            <Text style={styles.reviewNote}>
              {requiresOrg
                ? 'Submitting will create a pending account for admin verification.'
                : 'Submitting will create your active household account.'}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title={step === STEPS.length - 1 ? 'Create Account' : 'Continue'}
            onPress={step === STEPS.length - 1 ? handleSubmit(onSubmit) : nextStep}
            loading={isSubmitting}
          />
          {step > 0 && (
            <Button
              title="Back"
              variant="ghost"
              onPress={() => setStep((current) => current - 1)}
            />
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Login')} accessibilityRole="button">
            <Text style={styles.link}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  header: { marginBottom: spacing.sm },
  title: { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },
  helper: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  stepItem: { alignItems: 'center', gap: spacing.xs },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNumber: { ...typography.caption, color: colors.textMuted },
  stepNumberActive: { color: colors.textInverse, fontWeight: '700' },
  stepLabel: { ...typography.caption, color: colors.textMuted },
  stepLabelActive: { color: colors.primary },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: spacing.xs,
    marginBottom: 20,
    backgroundColor: colors.border,
  },
  stepLineActive: { backgroundColor: colors.primary },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  roleList: { gap: spacing.sm },
  roleCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.successSurface },
  roleIcon: { width: 32, textAlign: 'center', fontSize: 26, color: colors.primary },
  roleInfo: { flex: 1 },
  roleLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  roleLabelActive: { color: colors.primary },
  roleDescription: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  strengthBars: { flex: 1, flexDirection: 'row', gap: spacing.xs },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  strengthLabel: { ...typography.caption, width: 48, textAlign: 'right' },
  cardTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.sm },
  cardBody: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  reviewRow: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.sm },
  reviewKey: { color: colors.textMuted },
  reviewNote: { ...typography.caption, color: colors.textSecondary, lineHeight: 20 },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  footerText: { ...typography.body, color: colors.textMuted },
  link: { ...typography.bodyMedium, color: colors.primary },
});
