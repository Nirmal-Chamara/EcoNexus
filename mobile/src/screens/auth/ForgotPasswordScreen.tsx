import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../components/common/Button';
import { FormInput } from '../../components/forms/FormInput';
import { authService } from '../../services/auth.service';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { forgotPasswordSchema } from '../../schemas/auth.schema';
import { mapApiError } from '../../utils/errorMapper';

type FormData = { email: string };

interface Props {
  navigation?: { navigate: (screen: string) => void; goBack: () => void };
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [sent, setSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const submit = async ({ email }: FormData) => {
    setRequestError(null);
    try {
      await authService.requestPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (error: unknown) {
      setRequestError(mapApiError(error, 'Unable to submit the request. Try again.'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.description}>
          Enter your account email. If it is registered, we will send a one-time reset code.
        </Text>
        {sent ? (
          <View>
            <Text style={styles.success}>
              If an account exists for that email, a reset code has been sent. Check your inbox and
              enter the code in the next step.
            </Text>
            <Button
              title="Enter reset code"
              onPress={() => navigation?.navigate('ResetPassword')}
              style={styles.button}
            />
          </View>
        ) : (
          <View>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Email address"
                  placeholder="you@example.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit(submit)}
                />
              )}
            />
            {requestError ? <Text style={styles.error}>{requestError}</Text> : null}
            <Button
              title="Send reset code"
              onPress={handleSubmit(submit)}
              loading={isSubmitting}
              style={styles.button}
            />
          </View>
        )}
        <Button title="Back to sign in" variant="ghost" onPress={() => navigation?.goBack()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: 12 },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 28,
    lineHeight: 24,
  },
  success: { ...typography.body, color: colors.success, lineHeight: 24, marginBottom: 16 },
  error: { ...typography.caption, color: colors.error, marginTop: 4 },
  button: { marginTop: 20, marginBottom: 12 },
});
