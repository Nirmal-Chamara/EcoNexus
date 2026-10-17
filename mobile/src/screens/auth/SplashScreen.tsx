import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

/**
 * SplashScreen — displayed by RootNavigator while AuthContext status = 'loading'.
 * Shows a branded animated splash while session is being restored from secure storage.
 */
export default function SplashScreen() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const spinAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    // Continuous spinner
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      >
        <Text style={styles.logoEmoji}>🌱</Text>
        <Text style={styles.appName}>EcoNexus</Text>
        <Text style={styles.tagline}>Smart Waste & Recycling</Text>
      </Animated.View>

      <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />

      <Animated.Text style={[styles.loading, { opacity: fadeAnim }]}>
        Restoring session...
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: { alignItems: 'center', marginBottom: 60 },
  logoEmoji:     { fontSize: 72, marginBottom: 12 },
  appName: {
    ...typography.displayMedium,
    color: colors.primary,
    letterSpacing: 1,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 6,
  },
  spinner: {
    position: 'absolute',
    bottom: 120,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.border,
    borderTopColor: colors.primary,
  },
  loading: {
    position: 'absolute',
    bottom: 80,
    ...typography.caption,
    color: colors.textMuted,
  },
});
