import React, { useEffect, useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input, SegmentedTabs, Toast } from '../../components/ui';
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
  const { signIn, logoutReason, dismissLogoutReason } = useAuth();
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { signIn, devLogin } = useAuth();
  const [keepSignedIn, setKeepSignedIn] = React.useState(true);
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
        <View style={styles.header}>
          <Text style={styles.logo}>🌱</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your EcoNexus account</Text>
        </View>

        <SegmentedTabs
          options={[
            { value: 'signin', label: 'Sign In' },
            { value: 'register', label: 'Create Account' },
          ]}
          value="signin"
          onChange={(value) => {
            if (value === 'register') navigation?.navigate('Register');
          }}
        />

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
        {serverError && (
          <Toast
            visible
            tone="error"
            duration={0}
            onDismiss={() => setServerError(null)}
            message={serverError}
          />
        )}

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
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
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                ref={passwordRef}
                label="Password"
                placeholder="Enter your password"
                icon="lock-closed-outline"
                isPassword
                textContentType="password"
                autoComplete="password"
                returnKeyType="done"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />

          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>Keep me signed in</Text>
            <Switch
              value={keepSignedIn}
              onValueChange={setKeepSignedIn}
              accessibilityLabel="Keep me signed in"
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>

          {biometricAvailable && (
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Use Bio ID to unlock this session"
              accessibilityState={{ checked: biometricEnabled }}
              onPress={toggleBiometric}
              style={[styles.biometricChip, biometricEnabled && styles.biometricChipActive]}
            >
              <Text style={styles.biometricIcon}>◉</Text>
              <Text style={styles.biometricText}>
                {biometricEnabled ? 'Bio ID enabled' : 'Enable Bio ID'}
              </Text>
            </Pressable>
          )}

          <Button
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={styles.submitButton}
          />

          <Pressable
            style={styles.forgotPassword}
            onPress={() => navigation?.navigate('ForgotPassword')}
            accessibilityRole="button"
          >
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>

          <View style={styles.providerRow}>
            <Button
              title="Continue with Google (Coming soon)"
              variant="secondary"
              disabled
              fullWidth={false}
              style={styles.providerButton}
            />
            <Button
              title="Continue with Apple (Coming soon)"
              variant="secondary"
              disabled
              fullWidth={false}
              style={styles.providerButton}
            />
          </View>
        </View>

        <Pressable
          onPress={() => navigation?.navigate('Register', { partner: true })}
          accessibilityRole="button"
          style={styles.partnerLink}
        >
          <Text style={styles.partnerText}>Collector / Facility Partner Portal</Text>
        </Pressable>

        {/* Collector Role Portal Link */}
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8, gap: 10 }}>
          <TouchableOpacity
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
          </TouchableOpacity>

          <TouchableOpacity
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
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable onPress={() => navigation?.navigate('Register')} accessibilityRole="button">
            <Text style={styles.link}>Create account</Text>
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
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  header: { alignItems: 'center', marginBottom: spacing.md },
  logo: { fontSize: 56, marginBottom: spacing.md },
  title: { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  form: { marginTop: spacing.sm },
  preferenceRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceLabel: { ...typography.body, color: colors.textSecondary },
  biometricChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  biometricChipActive: { borderColor: colors.primary, backgroundColor: colors.successSurface },
  biometricIcon: { color: colors.primary, fontSize: 18 },
  biometricText: { ...typography.label, color: colors.textPrimary },
  submitButton: { marginTop: spacing.sm },
  forgotPassword: { alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: 4 },
  providerRow: { gap: spacing.sm, marginTop: spacing.sm },
  providerButton: { flex: 1 },
  partnerLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  partnerText: { ...typography.bodyMedium, color: colors.primary, textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  footerText: { ...typography.body, color: colors.textMuted },
  link: { ...typography.bodyMedium, color: colors.primary },
});
