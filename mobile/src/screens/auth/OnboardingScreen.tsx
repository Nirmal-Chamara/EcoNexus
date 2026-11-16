import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { onboardingTheme } from '../../theme/onboardingTheme';
import {
  DoorstepHaulerArtwork,
  EcologicalImpactArtwork,
  RewardsValueArtwork,
} from '../../components/onboarding/OnboardingArtwork';

const { width } = Dimensions.get('window');

interface Props {
  onComplete?: () => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
  onSignIn?: () => void;
}

export default function OnboardingScreen({ onComplete, onSkip, onSignIn }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0); // 0, 1, 2
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goToSlide = (nextSlide: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setCurrentSlide(nextSlide);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    });
  };

  const handleNext = async () => {
    if (currentSlide < 2) {
      goToSlide(currentSlide + 1);
    } else {
      if (onComplete) {
        await onComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  const handleSkip = async () => {
    if (onSkip) {
      await onSkip();
    } else if (onComplete) {
      await onComplete();
    }
  };

  const handlePairDevice = () => {
    Alert.alert(
      'Smart Bin BLE Pairing',
      'Scanning for nearby EcoNexus Smart Bins and BLE Bluetooth scales...',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* ── Top Bar ────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          {currentSlide === 0 ? (
            <View style={styles.brandRow}>
              <View style={styles.brandLogoCircle}>
                <Ionicons name="leaf" size={16} color="#059669" />
              </View>
              <Text style={styles.brandName}>EcoNexus</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>
          )}

          {/* Segmented Step Indicator for slides 1 & 2 */}
          {currentSlide > 0 && (
            <View style={styles.stepTrackContainer}>
              <View
                style={[
                  styles.stepSegment,
                  currentSlide >= 0 && styles.stepSegmentActive,
                ]}
              />
              <View
                style={[
                  styles.stepSegment,
                  currentSlide >= 1 && styles.stepSegmentActive,
                ]}
              />
              <View
                style={[
                  styles.stepSegment,
                  currentSlide >= 2 && styles.stepSegmentActive,
                ]}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip Tour"
          >
            <Text style={styles.skipButtonText}>
              {currentSlide === 0 ? 'Skip Tour' : 'Skip'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Slide Content Carousel ─────────────────────────────── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
            {/* ══════════ SLIDE 0: DOORSTEP COLLECTION ══════════ */}
            {currentSlide === 0 && (
              <View style={styles.slideContainer}>
                {/* Visual Card */}
                <View style={styles.heroCard}>
                  <View style={styles.cardHeaderBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.cardHeaderBadgeText}>
                      LIVE HAULERS ACTIVE
                    </Text>
                  </View>

                  <DoorstepHaulerArtwork />

                  {/* 3-Dot Pagination */}
                  <View style={styles.dotRow}>
                    <View style={[styles.dotPill, styles.dotPillActive]} />
                    <View style={styles.dotCircle} />
                    <View style={styles.dotCircle} />
                  </View>
                </View>

                {/* Typography */}
                <Text style={styles.headline}>
                  Dispose Recyclables{'\n'}Anytime, Anywhere
                </Text>
                <Text style={styles.bodyDescription}>
                  Sort paper, plastics, metals, or e-waste comfortably at home.
                  Book a verified eco-hauler with live GPS tracking right to your
                  doorstep.
                </Text>

                {/* Value Highlight Pill */}
                <View style={styles.valueHighlightCard}>
                  <View style={styles.highlightCheckCircle}>
                    <Ionicons name="checkmark" size={14} color="#059669" />
                  </View>
                  <View style={styles.highlightContent}>
                    <Text style={styles.highlightTitle}>Zero Pickup Fees</Text>
                    <Text style={styles.highlightSubtitle}>
                      Free collection for all pre-sorted bundles
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ══════════ SLIDE 1: ECOLOGICAL IMPACT ══════════ */}
            {currentSlide === 1 && (
              <View style={styles.slideContainer}>
                {/* Visual Card */}
                <View style={styles.heroCard}>
                  <View style={styles.cardHeaderBadge}>
                    <Ionicons name="sparkles" size={13} color="#059669" />
                    <Text style={styles.cardHeaderBadgeText}>
                      VERIFIED IMPACT
                    </Text>
                  </View>

                  <EcologicalImpactArtwork />

                  {/* Bottom IoT Status Pill */}
                  <View style={styles.iotStatusPill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.iotStatusText}>
                      BLE 0.00kg Calibrated
                    </Text>
                  </View>
                </View>

                {/* Category Pill */}
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>
                    🌱 Reforestation & Smart Sorting
                  </Text>
                </View>

                {/* Typography */}
                <Text style={styles.headline}>
                  Turn Waste into Living Impact
                </Text>
                <Text style={styles.bodyDescription}>
                  Every kilogram of segregated waste verified on digital BLE
                  scales prevents landfill overflow and directly funds urban
                  micro-forests.
                </Text>

                {/* EcoNexus Network Ledger Card */}
                <View style={styles.ledgerCard}>
                  <View style={styles.ledgerHeaderRow}>
                    <View style={styles.ledgerTitleGroup}>
                      <Ionicons name="shield-checkmark-outline" size={14} color="#059669" />
                      <Text style={styles.ledgerTitle}>
                        EcoNexus Network Ledger
                      </Text>
                    </View>
                    <View style={styles.liveIndicator}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.liveIndicatorText}>LIVE</Text>
                    </View>
                  </View>

                  <View style={styles.ledgerStatsRow}>
                    <View style={styles.ledgerCol}>
                      <Text style={styles.statLabel}>DIVERTED</Text>
                      <Text style={styles.statNumber}>184.2 t</Text>
                      <Text style={styles.statTrendPositive}>+14.6% this week</Text>
                    </View>

                    <View style={styles.ledgerDivider} />

                    <View style={styles.ledgerCol}>
                      <Text style={styles.statLabel}>PRESERVED</Text>
                      <Text style={styles.statNumber}>24,860 pcs</Text>
                      <Text style={styles.statTrendFund}>Urban Canopy Fund</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ══════════ SLIDE 2: REWARDS & VALUE ══════════ */}
            {currentSlide === 2 && (
              <View style={styles.slideContainer}>
                {/* Visual Card */}
                <View style={styles.heroCard}>
                  <View style={[styles.cardHeaderBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                    <Text style={styles.pointsTagEmoji}>🪙</Text>
                    <Text style={[styles.cardHeaderBadgeText, { color: '#B45309' }]}>
                      +850 Pts
                    </Text>
                  </View>

                  <RewardsValueArtwork />

                  {/* Sync status tag */}
                  <View style={styles.syncStatusBadge}>
                    <Ionicons name="flash" size={11} color="#0284C7" />
                    <Text style={styles.syncStatusText}>Instant BLE Sync</Text>
                  </View>

                  <View style={styles.iotStatusPill}>
                    <Ionicons name="checkmark-circle" size={13} color="#059669" />
                    <Text style={styles.iotStatusText}>
                      Verified Eco-Earner Status
                    </Text>
                  </View>
                </View>

                {/* Step Category Tag */}
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>
                    STEP 03 • CASH & IMPACT
                  </Text>
                </View>

                {/* Typography */}
                <Text style={styles.headline}>
                  Earn Real Value from Your Waste
                </Text>
                <Text style={styles.bodyDescription}>
                  Receive instant EcoPoints upon collector BLE digital weighing
                  verification. Redeem anytime for supermarket groceries, power
                  bill subsidies, or direct bank cashout.
                </Text>

                {/* Instant Redeem Partners List */}
                <View style={styles.partnersCard}>
                  <View style={styles.partnersHeaderRow}>
                    <Text style={styles.partnersTitle}>INSTANT REDEEM PARTNERS</Text>
                    <Text style={styles.exchangeRateText}>1 EcoPt = Rs. 1.00</Text>
                  </View>

                  {/* Partner 1 */}
                  <View style={styles.partnerRow}>
                    <View style={[styles.partnerIconBox, { backgroundColor: '#DCFCE7' }]}>
                      <MaterialCommunityIcons name="cart-outline" size={16} color="#059669" />
                    </View>
                    <View style={styles.partnerDetails}>
                      <Text style={styles.partnerName}>Keells & Cargills</Text>
                      <Text style={styles.partnerDesc}>Grocery Super Vouchers</Text>
                    </View>
                    <View style={styles.ptsPill}>
                      <Text style={styles.ptsPillText}>1,000 Pts ›</Text>
                    </View>
                  </View>

                  {/* Partner 2 */}
                  <View style={styles.partnerRow}>
                    <View style={[styles.partnerIconBox, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="flash-outline" size={16} color="#D97706" />
                    </View>
                    <View style={styles.partnerDetails}>
                      <Text style={styles.partnerName}>Electricity & Water Bill</Text>
                      <Text style={styles.partnerDesc}>Direct Utility Discount</Text>
                    </View>
                    <View style={[styles.ptsPill, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.ptsPillText, { color: '#B45309' }]}>500 Pts ›</Text>
                    </View>
                  </View>

                  {/* Partner 3 */}
                  <View style={[styles.partnerRow, { borderBottomWidth: 0 }]}>
                    <View style={[styles.partnerIconBox, { backgroundColor: '#E0F2FE' }]}>
                      <Ionicons name="card-outline" size={16} color="#0284C7" />
                    </View>
                    <View style={styles.partnerDetails}>
                      <Text style={styles.partnerName}>Direct Bank Cashout</Text>
                      <Text style={styles.partnerDesc}>LANKAQR & Bank Transfer</Text>
                    </View>
                    <View style={[styles.ptsPill, { backgroundColor: '#E0F2FE' }]}>
                      <Text style={[styles.ptsPillText, { color: '#0369A1' }]}>Instant ›</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* ── Footer Navigation ──────────────────────────────────── */}
        <View style={styles.footerSection}>
          {currentSlide === 0 ? (
            <View style={styles.slide0ActionRow}>
              <TouchableOpacity
                style={styles.skipTextButton}
                onPress={handleSkip}
              >
                <Text style={styles.skipActionText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : currentSlide === 1 ? (
            <View style={styles.stackedActions}>
              <TouchableOpacity
                style={styles.fullPrimaryButton}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.fullPrimaryButtonText}>
                  Continue to Verification
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryLinkRow}
                onPress={handlePairDevice}
              >
                <Text style={styles.secondaryLinkText}>
                  Already have a smart bin?{' '}
                  <Text style={styles.secondaryLinkHighlight}>Pair Device</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stackedActions}>
              <TouchableOpacity
                style={styles.fullPrimaryButton}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.fullPrimaryButtonText}>
                  Get Started / Register
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryLinkRow}
                onPress={onSignIn || handleSkip}
              >
                <Text style={styles.secondaryLinkText}>
                  I Already Have an Account •{' '}
                  <Text style={styles.secondaryLinkHighlight}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  screen: {
    flex: 1,
    backgroundColor: onboardingTheme.canvas,
    justifyContent: 'space-between',
  },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 10,
    height: 54,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginHorizontal: 16,
  },
  stepSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  stepSegmentActive: {
    backgroundColor: '#059669',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Scroll Content */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  slideContainer: {
    alignItems: 'center',
    width: '100%',
  },

  /* Hero Card */
  heroCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardHeaderBadge: {
    position: 'absolute',
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    ...onboardingTheme.cardShadow,
    zIndex: 10,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  cardHeaderBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.6,
  },
  pointsTagEmoji: {
    fontSize: 12,
  },

  /* Pagination Dots */
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dotPill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotPillActive: {
    width: 22,
    backgroundColor: '#059669',
  },
  dotCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },

  /* IoT Pill */
  iotStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
    marginTop: 6,
  },
  iotStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  syncStatusBadge: {
    position: 'absolute',
    bottom: 38,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  syncStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0369A1',
  },

  /* Category Tag */
  categoryPill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 10,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },

  /* Typography */
  headline: {
    fontSize: 23,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
    lineHeight: 30,
  },
  bodyDescription: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
    marginBottom: 16,
  },

  /* Slide 0 Value Pill */
  valueHighlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 12,
    width: '100%',
    gap: 12,
  },
  highlightCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#065F46',
  },
  highlightSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },

  /* Slide 1 Ledger */
  ledgerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    ...onboardingTheme.cardShadow,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  ledgerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ledgerTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  liveIndicatorText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#059669',
  },
  ledgerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ledgerCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 2,
  },
  statTrendPositive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  statTrendFund: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  ledgerDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },

  /* Slide 2 Partners Card */
  partnersCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    ...onboardingTheme.cardShadow,
  },
  partnersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginBottom: 8,
  },
  partnersTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  exchangeRateText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  partnerIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  partnerDetails: {
    flex: 1,
  },
  partnerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  partnerDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  ptsPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ptsPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#065F46',
  },

  /* Footers & Buttons */
  footerSection: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 16 : 8,
    paddingTop: 8,
    backgroundColor: onboardingTheme.canvas,
  },
  slide0ActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  skipTextButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    height: 50,
    borderRadius: 25,
    gap: 8,
    ...onboardingTheme.glowShadow,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  stackedActions: {
    gap: 10,
    alignItems: 'center',
  },
  fullPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    height: 52,
    borderRadius: 26,
    width: '100%',
    gap: 8,
    ...onboardingTheme.glowShadow,
  },
  fullPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryLinkRow: {
    paddingVertical: 6,
  },
  secondaryLinkText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  secondaryLinkHighlight: {
    color: '#059669',
    fontWeight: '700',
  },
});
