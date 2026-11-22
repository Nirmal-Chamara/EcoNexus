import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';
import { emailVerificationTokenFromUrl } from '../../services/emailLinks';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { mapApiError } from '../../utils/errorMapper';

export default function EmailVerificationScreen({ initialToken }: { initialToken?: string | null }) {
  const { user, refreshUser, signOut } = useAuth();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { if (initialToken) setToken(initialToken); }, [initialToken]);
  useEffect(() => {
    let active = true;
    const accept = (url: string | null) => {
      const code = emailVerificationTokenFromUrl(url);
      if (active && code) setToken(code);
    };
    void Linking.getInitialURL()
      .then(accept)
      .catch(() => {});
    const listener = Linking.addEventListener('url', (event) => accept(event.url));
    return () => {
      active = false;
      listener.remove();
    };
  }, []);
  useEffect(() => {
    if (!seconds) return;
    const timer = setTimeout(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await authService.confirmEmailVerification(token.trim());
      await refreshUser();
    } catch (failure) {
      setError(mapApiError(failure, 'Unable to verify your email.'));
    } finally {
      setBusy(false);
    }
  };
  const request = async () => {
    setBusy(true);
    setError(null);
    try {
      await authService.requestEmailVerification();
      setQueued(true);
      setSeconds(60);
    } catch (failure) {
      setError(mapApiError(failure, 'Unable to request a verification email.'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.text}>{user?.email}</Text>
      <Text style={styles.text}>
        New accounts receive a verification email automatically. Open its link or paste the one-time
        code below. Your account stays restricted until your email is verified.
      </Text>
      <TextInput
        accessibilityLabel="Email verification code"
        placeholder="Code from your email"
        placeholderTextColor={colors.textMuted}
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={64}
        style={styles.input}
        editable={!busy}
      />
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {queued ? (
        <Text style={styles.text}>
          Verification email queued. Check your inbox; delivery may take a moment.
        </Text>
      ) : null}
      <Button
        title="Verify email"
        onPress={() => void confirm()}
        disabled={!/^[a-fA-F0-9]{64}$/.test(token.trim()) || busy}
        loading={busy}
      />
      <Button
        title={seconds ? `Request another email in ${seconds}s` : 'Send verification email'}
        variant="secondary"
        disabled={busy || seconds > 0}
        onPress={() => void request()}
      />
      <Button
        title="Refresh verification status"
        variant="ghost"
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void refreshUser()
            .catch((failure) =>
              setError(mapApiError(failure, 'Unable to refresh verification status.'))
            )
            .finally(() => setBusy(false));
        }}
      />
      <Button
        title="Sign out"
        variant="ghost"
        onPress={() => {
          void signOut().catch((failure) => setError(mapApiError(failure, 'Unable to sign out. Please try again.')));
        }}
        disabled={busy}
      />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 64,
    gap: 16,
    backgroundColor: colors.background,
  },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' },
  text: { color: colors.textSecondary, lineHeight: 22 },
  error: { color: colors.error },
  input: {
    color: colors.textPrimary,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 14,
    borderRadius: 10,
  },
});
