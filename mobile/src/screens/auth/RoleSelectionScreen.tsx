import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { onboardingTheme } from '../../theme/onboardingTheme';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import GoogleLogo from '../../components/common/GoogleLogo';

export type UserRoleType = 'user' | 'collector' | 'center';

interface Props {
  navigation?: any;
  onProceed?: (role: UserRoleType) => void;
  onLogin?: () => void;
}

export default function RoleSelectionScreen({ navigation, onProceed, onLogin }: Props) {
  const [selectedRole, setSelectedRole] = useState<UserRoleType>('user');
  const {
    promptGoogleSignIn,
    isLoading: isGoogleLoading,
    error: googleError,
    clearError: clearGoogleError,
  } = useGoogleAuth();

  const handleProceed = () => {
    if (onProceed) {
      onProceed(selectedRole);
      return;
    }

    if (navigation) {
      if (selectedRole === 'collector') {
        navigation.navigate('Register', { role: 'collector', partner: true });
      } else if (selectedRole === 'center') {
        navigation.navigate('Register', { role: 'center', partner: true });
      } else {
        navigation.navigate('Register', { role: 'user' });
      }
    }
  };

  const handleLoginPress = () => {
    if (onLogin) {
      onLogin();
    } else if (navigation) {
      navigation.navigate('Login');
    }
  };

  const handleGoogleSignIn = async () => {
    const roleMap: Record<UserRoleType, string> = {
      user: 'USER',
      collector: 'COLLECTOR',
      center: 'RECYCLING_CENTER',
    };
    await promptGoogleSignIn(true, roleMap[selectedRole]);
  };

  const getButtonLabel = () => {
    switch (selectedRole) {
      case 'collector':
        return 'Get Started as Collector';
      case 'center':
        return 'Get Started as Recycling Center';
      case 'user':
      default:
        return 'Get Started as Waste Generator';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. Welcome Tag & Heading ────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.welcomePill}>
              <Ionicons name="sparkles" size={13} color="#059669" />
              <Text style={styles.welcomePillText}>WELCOME TO ECONEXUS</Text>
            </View>

            <Text style={styles.headline}>Circular Living Made Rewarding</Text>
            <Text style={styles.subheadline}>
              Empowering Circular Living & Zero-Waste Communities
            </Text>
          </View>

          {/* ── 2. Feature Banner Carousel Preview ──────────────────── */}
          <View style={styles.previewBanner}>
            <View style={styles.previewTopRow}>
              <View style={styles.impactBadge}>
                <Ionicons name="leaf" size={12} color="#059669" />
                <Text style={styles.impactBadgeText}>Level 1 Impact</Text>
              </View>
              <View style={styles.pointsPill}>
                <Text style={styles.pointsPillText}>+250 pts</Text>
              </View>
            </View>

            <Text style={styles.previewTitle}>Turn Waste into EcoPoints</Text>

            <View style={styles.miniScreensRow}>
              <View style={styles.miniScreenCard}>
                <Ionicons name="trash-bin-outline" size={16} color="#059669" />
                <Text style={styles.miniScreenText}>Segregate</Text>
              </View>
              <View style={styles.miniScreenCard}>
                <MaterialCommunityIcons name="truck-fast-outline" size={16} color="#059669" />
                <Text style={styles.miniScreenText}>Live Pickup</Text>
              </View>
              <View style={styles.miniScreenCard}>
                <Ionicons name="gift-outline" size={16} color="#059669" />
                <Text style={styles.miniScreenText}>Redeem</Text>
              </View>
            </View>

            <Text style={styles.previewStepCaption}>Step 1 of 3: Select Profile</Text>
          </View>

          {/* ── 3. Section Heading ──────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Choose Your Path</Text>
              <View style={styles.gridIconTag}>
                <Ionicons name="grid-outline" size={14} color="#059669" />
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>
              Customize your eco-dashboard and tools
            </Text>
          </View>

          {/* ── 4. Persona Selection Cards ──────────────────────────── */}
          <View style={styles.cardsContainer}>
            {/* Persona 1: Waste Generator */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'user' && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole('user')}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedRole === 'user' }}
            >
              <View style={styles.roleCardTop}>
                <View
                  style={[
                    styles.roleIconContainer,
                    selectedRole === 'user' && styles.roleIconContainerActive,
                  ]}
                >
                  <Ionicons
                    name="home"
                    size={20}
                    color={selectedRole === 'user' ? '#FFFFFF' : '#059669'}
                  />
                </View>

                <View style={styles.roleTitleGroup}>
                  <Text style={styles.roleName}>Waste Generator</Text>
                  <Text style={styles.roleSubtext}>Household / Business</Text>
                </View>

                <View style={styles.roleBadgeGroup}>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Popular</Text>
                  </View>
                  <View
                    style={[
                      styles.checkCircle,
                      selectedRole === 'user' && styles.checkCircleActive,
                    ]}
                  >
                    {selectedRole === 'user' && (
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                    )}
                  </View>
                </View>
              </View>

              <Text style={styles.roleDescription}>
                List recyclable items, request doorstep pickups, earn EcoPoints &
                discounts.
              </Text>
            </TouchableOpacity>

            {/* Persona 2: Collector / Hauler */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'collector' && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole('collector')}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedRole === 'collector' }}
            >
              <View style={styles.roleCardTop}>
                <View
                  style={[
                    styles.roleIconContainer,
                    selectedRole === 'collector' && styles.roleIconContainerActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="truck-delivery"
                    size={20}
                    color={selectedRole === 'collector' ? '#FFFFFF' : '#059669'}
                  />
                </View>

                <View style={styles.roleTitleGroup}>
                  <Text style={styles.roleName}>Collector / Hauler</Text>
                  <Text style={styles.roleSubtext}>Fleet Logistics & Field Couriers</Text>
                </View>

                <View
                  style={[
                    styles.checkCircle,
                    selectedRole === 'collector' && styles.checkCircleActive,
                  ]}
                >
                  {selectedRole === 'collector' && (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  )}
                </View>
              </View>

              <Text style={styles.roleDescription}>
                Accept pickup requests in your sector, weigh materials with BLE
                scales, earn per-kg fees & bonus incentives.
              </Text>
            </TouchableOpacity>

            {/* Persona 3: Recycling Center */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'center' && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole('center')}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedRole === 'center' }}
            >
              <View style={styles.roleCardTop}>
                <View
                  style={[
                    styles.roleIconContainer,
                    selectedRole === 'center' && styles.roleIconContainerActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="factory"
                    size={20}
                    color={selectedRole === 'center' ? '#FFFFFF' : '#059669'}
                  />
                </View>

                <View style={styles.roleTitleGroup}>
                  <Text style={styles.roleName}>Recycling Center</Text>
                  <Text style={styles.roleSubtext}>Processors & Aggregators</Text>
                </View>

                <View
                  style={[
                    styles.checkCircle,
                    selectedRole === 'center' && styles.checkCircleActive,
                  ]}
                >
                  {selectedRole === 'center' && (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  )}
                </View>
              </View>

              <Text style={styles.roleDescription}>
                Receive batches, verify materials with smart digital scale sync,
                manage inventory & certified municipal output.
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 5. Trust & Endorsement Indicators ──────────────────── */}
          <View style={styles.trustBadgesRow}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={13} color="#059669" />
              <Text style={styles.trustText}>ISO Certified Traceability</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="lock-closed" size={13} color="#059669" />
              <Text style={styles.trustText}>Safe & Encrypted</Text>
            </View>
          </View>
        </ScrollView>

        {/* ── 6. Fixed Bottom Actions ─────────────────────────────── */}
        <View style={styles.footer}>
          {/* Dynamic Primary CTA */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleProceed}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>{getButtonLabel()}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or connect quickly</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Error Banner */}
          {googleError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorBannerText}>{googleError}</Text>
              <TouchableOpacity onPress={clearGoogleError}>
                <Ionicons name="close" size={14} color="#991B1B" />
              </TouchableOpacity>
            </View>
          )}

          {/* Google Sign-in Button */}
          <TouchableOpacity
            style={[styles.googleButton, isGoogleLoading && { opacity: 0.7 }]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
            activeOpacity={0.85}
          >
            <GoogleLogo size={20} />
            <Text style={styles.googleButtonText}>
              {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginLinkButton}
            onPress={handleLoginPress}
          >
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkHighlight}>Login</Text>
            </Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 20,
  },

  /* Header */
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  welcomePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.6,
  },
  headline: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subheadline: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },

  /* Preview Banner */
  previewBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 14,
    marginBottom: 18,
    ...onboardingTheme.cardShadow,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  impactBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  pointsPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pointsPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: 10,
  },
  miniScreensRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  miniScreenCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniScreenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  previewStepCaption: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },

  /* Section Header */
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  gridIconTag: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  /* Role Cards */
  cardsContainer: {
    gap: 10,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...onboardingTheme.cardShadow,
  },
  roleCardSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  roleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  roleIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleIconContainerActive: {
    backgroundColor: '#059669',
  },
  roleTitleGroup: {
    flex: 1,
  },
  roleName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  roleSubtext: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  roleBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popularBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  popularBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkCircleActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  roleDescription: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 17,
    marginTop: 2,
  },

  /* Trust Badges */
  trustBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Footer */
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 16 : 8,
    paddingTop: 8,
    backgroundColor: onboardingTheme.canvas,
    gap: 10,
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
    fontSize: 15,
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    ...onboardingTheme.cardShadow,
  },
  googleButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  loginLinkButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  loginLinkText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  loginLinkHighlight: {
    color: '#059669',
    fontWeight: '700',
  },
});

