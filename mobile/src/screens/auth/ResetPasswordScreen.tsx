import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/forms/FormInput';
import { authService } from '../../services/auth.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { resetPasswordSchema } from '../../schemas/auth.schema';
import { mapApiError } from '../../utils/errorMapper';

type FormData = { token: string; newPassword: string; confirmPassword: string };

interface Props {
  navigation?: { navigate: (screen: string) => void; goBack: () => void };
}

export default function ResetPasswordScreen({ navigation }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: '', newPassword: '', confirmPassword: '' },
  });

  const submit = async ({ token, newPassword }: FormData) => {
    setSubmitError(null);
    try {
      await authService.resetPassword(token.trim(), newPassword);
      navigation?.navigate('Login');
    } catch (error: unknown) {
      setSubmitError(
        mapApiError(error, 'The reset code is invalid or expired. Request a new code.')
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Choose a new password</Text>
        <Text style={styles.description}>
          Enter the code from your email. Reset codes expire after 15 minutes.
        </Text>
        <Controller
          control={control}
          name="token"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Reset code"
              placeholder="Paste the code from your email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.token?.message}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="New password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.newPassword?.message}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormInput
              label="Confirm new password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
        <Button
          title="Reset password"
          onPress={handleSubmit(submit)}
          loading={isSubmitting}
          style={styles.button}
        />
        <Button title="Back" variant="ghost" onPress={() => navigation?.goBack()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: 12 },
  description: { ...typography.body, color: colors.textSecondary, marginBottom: 24 },
  error: { ...typography.caption, color: colors.error, marginTop: 8 },
  button: { marginTop: 20, marginBottom: 12 },
});
