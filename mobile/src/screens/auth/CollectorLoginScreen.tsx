import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

const FLEET_TYPES = [
  { id: 'TRUCK', label: 'Truck', emoji: '🚛' },
  { id: 'VAN', label: 'Van', emoji: '🚐' },
  { id: 'THREE_WHEELER', label: '3-Wheeler', emoji: '🛺' },
  { id: 'BICYCLE', label: 'Bicycle', emoji: '🚲' },
];

export default function CollectorLoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const [selectedFleet, setSelectedFleet] = useState<string>('TRUCK');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your collector email and password.');
      return;
    }

    try {
      setLoading(true);
      await signIn({ email: email.trim(), password }, rememberMe);
      // Once signed in, RoleGate automatically switches to CollectorNavigator!
    } catch (e: any) {
      Alert.alert('Sign-In Failed', e?.message || 'Invalid credentials or collector not registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Logo Emblem */}
        <View style={styles.logoEmblem}>
          <Text style={styles.logoIcon}>🌿</Text>
        </View>

        {/* Collector Role Badge */}
        <View style={styles.roleBadge}>
          <View style={styles.roleDot} />
          <Text style={styles.roleBadgeText}>COLLECTOR FLEET PORTAL</Text>
        </View>

        <Text style={styles.title}>Welcome Back, Driver</Text>
        <Text style={styles.subtitle}>
          Sign in to access your assigned collection routes and live GPS guidance.
        </Text>

        {/* Fleet Vehicle Selector */}
        <Text style={styles.sectionLabel}>Select Fleet Vehicle</Text>
        <View style={styles.fleetRow}>
          {FLEET_TYPES.map((fleet) => {
            const isSelected = selectedFleet === fleet.id;
            return (
              <TouchableOpacity
                key={fleet.id}
                style={[styles.fleetTile, isSelected && styles.fleetTileSelected]}
                onPress={() => setSelectedFleet(fleet.id)}
              >
                <Text style={styles.fleetEmoji}>{fleet.emoji}</Text>
                <Text
                  style={[styles.fleetLabel, isSelected && styles.fleetLabelSelected]}
                >
                  {fleet.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Email / Identifier */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Collector Email or Phone</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLeadIcon}>👤</Text>
            <TextInput
              style={styles.textInput}
              placeholder="driver@econexus.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password / Fleet PIN</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLeadIcon}>🔒</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        {/* Options Row */}
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberText}>Remember Fleet Device</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation?.navigate?.('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot PIN?</Text>
          </TouchableOpacity>
        </View>

        {/* Primary CTA Button */}
        <TouchableOpacity
          style={styles.loginBtn}
          disabled={loading}
          onPress={handleLogin}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.loginBtnText}>Sign In to Driver Fleet →</Text>
          )}
        </TouchableOpacity>

        {/* Footer Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Want to register a new vehicle?{' '}
            <Text
              style={styles.footerLink}
              onPress={() => navigation?.navigate?.('Register')}
            >
              Partner Sign Up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // #0A0F0D
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 40,
  },
  logoEmblem: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 28,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.roleCollector, // #F59E0B
    marginRight: 6,
  },
  roleBadgeText: {
    color: colors.roleCollector,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  fleetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  fleetTile: {
    width: '23%',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fleetTileSelected: {
    borderColor: colors.roleCollector,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  fleetEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  fleetLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  fleetLabelSelected: {
    color: colors.roleCollector,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 48,
  },
  inputLeadIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: colors.roleCollector,
    borderColor: colors.roleCollector,
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.roleCollector,
  },
  loginBtn: {
    backgroundColor: colors.roleCollector, // #F59E0B
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.roleCollector,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  loginBtnText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  footerLink: {
    color: colors.roleCollector,
    fontWeight: '700',
  },
});

