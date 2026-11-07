import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { subscribeNetworkStatus } from '../../services/networkStatus';

export default function NetworkStatusBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => subscribeNetworkStatus(setOffline), []);

  if (!offline) return null;

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={styles.banner}
    >
      <Text style={styles.title}>You’re offline</Text>
      <Text style={styles.message}>Some actions may be unavailable until you reconnect.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningSurface,
    borderBottomColor: colors.warning,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  title: { ...typography.label, color: colors.warning },
  message: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
