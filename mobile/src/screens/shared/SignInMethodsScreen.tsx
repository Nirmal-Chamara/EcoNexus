import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { userService } from '../../services/user.service';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { mapApiError } from '../../utils/errorMapper';

export default function SignInMethodsScreen() {
  const { user, forceLogout } = useAuth();
  const [methods, setMethods] = useState<{ hasPassword: boolean; googleLinked: boolean } | null>(
    null
  );
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    setMethods(null);
    userService
      .getSignInMethods()
      .then((data) => {
        if (active) setMethods(data);
      })
      .catch((error) => {
        if (active) setLoadError(mapApiError(error, 'Unable to load your sign-in methods.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id, retry]);
  const connectIdentity = useCallback(
    async (idToken: string, nonce: string) => {
      try {
        await userService.linkGoogle({ idToken, nonce, currentPassword: password });
        await forceLogout('SIGN_IN_METHOD_CHANGED');
      } finally {
        setPassword('');
      }
    },
    [password, forceLogout]
  );
  const google = useGoogleAuth({ onIdentity: connectIdentity });
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Sign-in methods</Text>
      <Text style={styles.description}>{user?.email}</Text>
      {loading ? <ActivityIndicator accessibilityLabel="Loading sign-in methods" /> : null}
      {loadError ? (
        <View>
          <Text accessibilityRole="alert" style={styles.error}>{loadError}</Text>
          <Button title="Retry" onPress={() => setRetry((value) => value + 1)} />
        </View>
      ) : null}
      {methods ? (
        <>
          <Text style={styles.description}>
            Password: {methods.hasPassword ? 'Configured' : 'Not configured'}
          </Text>
          <Text style={styles.description}>
            Google: {methods.googleLinked ? 'Connected' : 'Not connected'}
          </Text>
          {methods.googleLinked ? (
            <Text style={styles.description}>
              Your Google identity is connected. Your existing sign-in methods remain available.
            </Text>
          ) : methods.hasPassword ? (
            <>
              <Text style={styles.description}>
                Confirm your current password, then choose the Google account with the same email.
                Connecting Google signs out existing sessions; sign in again afterward.
              </Text>
              <TextInput
                accessibilityLabel="Current account password"
                placeholder="Current password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                value={password}
                onChangeText={setPassword}
                editable={!google.isLoading}
                style={styles.input}
              />
              {!google.isConfigured ? (
                <Text style={styles.description}>
                  Google sign-in is unavailable for this build.
                </Text>
              ) : null}
              {google.error ? <Text accessibilityRole="alert" style={styles.error}>{google.error}</Text> : null}
              <Button
                title="Connect Google"
                loading={google.isLoading}
                disabled={!password || !google.isConfigured}
                onPress={() => {
                  google.clearError();
                  void google.promptGoogleSignIn();
                }}
              />
            </>
          ) : (
            <Text style={styles.description}>
              An existing sign-in method must be verified before another identity can be connected.
            </Text>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 16, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  description: { fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  error: { color: colors.error, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: 10,
    color: colors.textPrimary,
  },
});
