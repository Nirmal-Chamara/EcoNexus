import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { onboardingTheme } from '../../theme/onboardingTheme';
import { CleanSriLankaEmblem } from '../../components/onboarding/OnboardingArtwork';

interface Props {
  onGetStarted?: () => void;
}

export default function SplashScreen({ onGetStarted }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [progressLabel, setProgressLabel] = useState('Initializing telemetry...');

  useEffect(() => {
    const useNative = Platform.OS !== 'web';

    // Fade-in & subtle scale-up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: useNative,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: useNative,
      }),
    ]).start();

    // Progress bar fill animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    const timer1 = setTimeout(() => {
      setProgressLabel('Connecting to Sri Lanka Central Environmental ledger...');
    }, 600);

    const timer2 = setTimeout(() => {
      setProgressLabel('Calculating carbon offsets...');
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── 1. Top Bar ─────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <View style={styles.topPill}>
            <View style={styles.topPillDot} />
            <Text style={styles.topPillText}>CIRCULAR TECH SRI LANKA</Text>
          </View>
          <Text style={styles.versionTag}>v0.4</Text>
        </View>

        {/* ── 2. Hero Brand Section ──────────────────────────────── */}
        <Animated.View
          style={[
            styles.brandContent,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Glowing Clean Sri Lanka Emblem */}
          <CleanSriLankaEmblem />

          {/* Title & Slogan */}
          <View style={styles.titleRow}>
            <Text style={styles.brandTitle}>EcoNexus</Text>
            <View style={styles.brandTitleDot} />
          </View>

          <Text style={styles.brandSubtitle}>Smart Recycling & Circular Living</Text>

          <Text style={styles.missionHeadline}>
            Connect • Collect • Create Impact
          </Text>
          <Text style={styles.missionBody}>
            Turning everyday waste into verifiable ecological value.
          </Text>

          {/* Progress Tracker */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[styles.progressBarFill, { width: progressWidth }]}
              />
            </View>
            <Text style={styles.progressStatusText}>{progressLabel}</Text>
          </View>
        </Animated.View>

        {/* ── 3. Action Button ───────────────────────────────────── */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={onGetStarted}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── 4. Endorsement Footer ──────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerHeadline}>
            Empowering Sri Lanka's Zero-Waste Future
          </Text>

          <View style={styles.badgesRow}>
            <View style={styles.endorseBadge}>
              <Text style={styles.badgeText}>ISO 14001</Text>
            </View>
            <View style={styles.endorseBadge}>
              <Text style={styles.badgeText}>CEA Endorsed</Text>
            </View>
            <View style={styles.endorseBadge}>
              <Text style={styles.badgeText}>Zero-Landfill</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: onboardingTheme.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: onboardingTheme.canvas,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 24 : 12,
    paddingBottom: 20,
  },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  topPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  topPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  topPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.6,
  },
  versionTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },

  /* Center Brand Content */
  brandContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: onboardingTheme.textPrimary,
    letterSpacing: -0.5,
  },
  brandTitleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  brandSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
    marginBottom: 14,
  },
  missionHeadline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  missionBody: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 24,
    lineHeight: 18,
  },

  /* Progress tracker */
  progressSection: {
    width: '100%',
    maxWidth: 260,
    alignItems: 'center',
    marginTop: 24,
  },
  progressBarTrack: {
    width: '100%',
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  progressStatusText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500',
  },

  /* Actions */
  actionSection: {
    width: '100%',
    paddingVertical: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    height: 52,
    borderRadius: 26,
    gap: 8,
    ...onboardingTheme.glowShadow,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    gap: 8,
  },
  footerHeadline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  endorseBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
});
