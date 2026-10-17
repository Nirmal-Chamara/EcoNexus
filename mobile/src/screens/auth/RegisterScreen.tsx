import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/forms/FormInput';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// ─── Validation Schema ────────────────────────────────────────────────────────
const baseSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[0-9]/, 'Must include a number'),
  phone:    z.string().optional(),
  role:     z.enum(['USER', 'COLLECTOR', 'RECYCLING_CENTER'] as const),
  organizationName: z.string().optional(),
});

type RegisterForm = z.infer<typeof baseSchema>;

// ─── Role Config ──────────────────────────────────────────────────────────────
const ROLES: { id: UserRole; label: string; emoji: string; description: string }[] = [
  { id: 'USER',             label: 'Resident',         emoji: '🏡', description: 'Schedule pickups, track your eco impact' },
  { id: 'COLLECTOR',        label: 'Waste Collector',  emoji: '🚛', description: 'Manage pickup requests and routes' },
  { id: 'RECYCLING_CENTER', label: 'Recycling Center', emoji: '♻️', description: 'Manage recycling operations' },
];

// ─── Step Config ──────────────────────────────────────────────────────────────
const STEPS = ['Role', 'Account', 'Confirm'];

interface Props {
  navigation?: { navigate: (screen: string) => void; goBack: () => void };
}

export default function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [step, setStep] = useState(0);
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const orgRef = useRef<any>(null);

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: '', email: '', password: '', phone: '', role: 'USER', organizationName: '',
    },
  });

  const selectedRole = watch('role');
  const requiresOrg  = selectedRole === 'COLLECTOR' || selectedRole === 'RECYCLING_CENTER';

  // ── Step navigation ──────────────────────────────────────────────────────────
  const nextStep = async () => {
    let valid = false;
    if (step === 0) valid = await trigger('role');
    if (step === 1) valid = await trigger(['name', 'email', 'password', 'phone']);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: RegisterForm) => {
    try {
      await signUp({
        name:  data.name,
        email: data.email,
        password: data.password,
        role:  data.role,
        phone: data.phone || undefined,
        organizationName: requiresOrg ? data.organizationName || undefined : undefined,
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Registration failed. Please try again.';
      setError('email', { message });
      setStep(1);
    }
  };

  // ── Step indicator ───────────────────────────────────────────────────────────
  const StepIndicator = () => (
    <View style={styles.stepRow}>
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
              <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>
                {i < step ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{label}</Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={[styles.stepLine, i < step && styles.stepLineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join EcoNexus and make an impact</Text>
        </View>

        <StepIndicator />

        {/* ── Step 0: Role Selection ── */}
        {step === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>I am a...</Text>
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View style={styles.roleList}>
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      style={[styles.roleCard, value === role.id && styles.roleCardActive]}
                      onPress={() => onChange(role.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.roleEmoji}>{role.emoji}</Text>
                      <View style={styles.roleInfo}>
                        <Text style={[styles.roleLabel, value === role.id && styles.roleLabelActive]}>
                          {role.label}
                        </Text>
                        <Text style={styles.roleDesc}>{role.description}</Text>
                      </View>
                      <View style={[styles.radioOuter, value === role.id && styles.radioOuterActive]}>
                        {value === role.id && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {requiresOrg && (
              <View style={styles.orgNote}>
                <Text style={styles.orgNoteText}>
                  ℹ️ Your account will require admin verification before activation.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Step 1: Account Details ── */}
        {step === 1 && (
          <View style={styles.section}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Full name"
                  placeholder="John Smith"
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
                <FormInput
                  ref={emailRef}
                  label="Email address"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  ref={passwordRef}
                  label="Password"
                  placeholder="Min 8 chars, upper, lower, number"
                  isPassword
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  onSubmitEditing={() => orgRef.current?.focus()}
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Phone number (optional)"
                  placeholder="+94 77 123 4567"
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                />
              )}
            />
          </View>
        )}

        {/* ── Step 2: Confirm / Org Details ── */}
        {step === 2 && (
          <View style={styles.section}>
            {requiresOrg && (
              <Controller
                control={control}
                name="organizationName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormInput
                    ref={orgRef}
                    label="Organization name"
                    placeholder="Your company or center name"
                    returnKeyType="done"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.organizationName?.message}
                  />
                )}
              />
            )}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Review your details</Text>
              <Text style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Role: </Text>
                <Text style={styles.summaryVal}>
                  {ROLES.find((r) => r.id === selectedRole)?.label}
                </Text>
              </Text>
              <Text style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Email: </Text>
                <Text style={styles.summaryVal}>{watch('email')}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {step < STEPS.length - 1 ? (
            <Button title="Continue" onPress={nextStep} />
          ) : (
            <Button title="Create Account" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
          )}
          {step > 0 && (
            <Button
              title="Back"
              variant="ghost"
              onPress={() => setStep((s) => s - 1)}
              style={styles.backButton}
            />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Login')}>
            <Text style={styles.link}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 },
  header:    { marginBottom: 28 },
  title:     { ...typography.displayMedium, color: colors.textPrimary, marginBottom: 6 },
  subtitle:  { ...typography.body, color: colors.textSecondary },

  // Step indicator
  stepRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  stepItem:       { alignItems: 'center', gap: 4 },
  stepDot:        { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceAlt, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive:  { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNum:        { ...typography.caption, color: colors.textMuted },
  stepNumActive:  { color: colors.textInverse, fontWeight: '700' },
  stepLabel:      { ...typography.caption, color: colors.textMuted },
  stepLabelActive:{ color: colors.primary },
  stepLine:       { flex: 1, height: 2, backgroundColor: colors.border, marginBottom: 20, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: colors.primary },

  section:       { marginBottom: 24 },
  sectionTitle:  { ...typography.h2, color: colors.textPrimary, marginBottom: 16 },

  // Role cards
  roleList:       { gap: 12 },
  roleCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, padding: 16, gap: 14 },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.successSurface },
  roleEmoji:      { fontSize: 28 },
  roleInfo:       { flex: 1 },
  roleLabel:      { ...typography.bodyMedium, color: colors.textPrimary },
  roleLabelActive:{ color: colors.primary },
  roleDesc:       { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  radioOuter:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: colors.primary },
  radioInner:     { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  orgNote:      { marginTop: 14, backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border },
  orgNoteText:  { ...typography.caption, color: colors.textSecondary },

  // Summary card
  summaryCard:  { backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 8, marginBottom: 8 },
  summaryTitle: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: 4 },
  summaryRow:   { ...typography.body, color: colors.textSecondary },
  summaryKey:   { color: colors.textMuted },
  summaryVal:   { color: colors.textPrimary },

  actions:      { gap: 8, marginBottom: 24 },
  backButton:   { marginTop: 0 },

  footer:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText:   { ...typography.body, color: colors.textMuted },
  link:         { ...typography.bodyMedium, color: colors.primary },
});
