import React, { useRef } from 'react';
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
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/forms/FormInput';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// ─── Validation Schema (mirrors backend Zod schema) ──────────────────────────
const loginSchema = z.object({
  email:    z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

// ─── Navigation Prop Type ─────────────────────────────────────────────────────
interface Props {
  navigation?: {
    navigate: (screen: string) => void;
  };
}

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const passwordRef = useRef<any>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await signIn({ email: data.email, password: data.password });
      // AuthContext status updates → RootNavigator switches to role navigator automatically
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Invalid email or password. Please try again.';
      setError('password', { message });
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🌱</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your EcoNexus account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Email address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
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
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <FormInput
                ref={passwordRef}
                label="Password"
                placeholder="Enter your password"
                isPassword
                returnKeyType="done"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />

          <Button
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={styles.submitButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Register')}>
            <Text style={styles.link}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header:   { alignItems: 'center', marginBottom: 40 },
  logo:     { fontSize: 56, marginBottom: 16 },
  title:    { ...typography.displayMedium, color: colors.textPrimary, marginBottom: 8 },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  form:         { marginBottom: 24 },
  submitButton: { marginTop: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: { ...typography.body, color: colors.textMuted },
  link:       { ...typography.bodyMedium, color: colors.primary },
});
