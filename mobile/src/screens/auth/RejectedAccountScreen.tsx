import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function RejectedAccountScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconWrapper}>
        <Text style={styles.icon}>!</Text>
      </View>
      <Text style={styles.title}>Application not approved</Text>
      <Text style={styles.message}>
        {user?.name ? `Hi ${user.name}. ` : ''}
        Your account verification was not approved. Please contact support if you need more
        information.
      </Text>
      <Button
        title="Sign Out"
        variant="secondary"
        onPress={signOut}
        style={styles.signOutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingVertical: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.errorSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: { ...typography.h1, color: colors.error },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  signOutButton: { marginTop: 32 },
});
