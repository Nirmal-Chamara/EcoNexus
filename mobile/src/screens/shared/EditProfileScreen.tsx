import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user.service';
import { FormInput } from '../../components/forms/FormInput';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// ─── Validation Schema ────────────────────────────────────────────────────────
const editProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name is too long')
    .trim(),
  phone: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

// ─── EditProfileScreen ────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const navigation = useNavigation();
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name:  user?.name  ?? '',
      phone: user?.phone ?? '',
    },
  });

  // Re-seed form when user changes (e.g. after a hot reload)
  useEffect(() => {
    reset({ name: user?.name ?? '', phone: user?.phone ?? '' });
  }, [user?.name, user?.phone]);

  const onSubmit = async (data: EditProfileForm) => {
    if (!isDirty) {
      navigation.goBack();
      return;
    }
    setIsSaving(true);
    try {
      const updated = await userService.updateMe({
        name:  data.name.trim(),
        phone: data.phone?.trim() || undefined,
      });
      // Sync AuthContext so the app reflects the changes instantly
      updateUser({ name: updated.name, phone: updated.phone ?? null });
      Alert.alert('Profile Updated', 'Your profile has been saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? 'Failed to update profile. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            testID="edit-profile-back-btn"
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* ── Avatar Preview ───────────────────── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>
                {(user?.name ?? 'U')
                  .trim()
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase() ?? '')
                  .join('')}
              </Text>
            </View>
          </View>
          <Text style={styles.avatarHint}>Profile picture coming soon</Text>
        </View>

        {/* ── Form ─────────────────────────────── */}
        <View style={styles.formCard}>
          <Text style={styles.formSection}>Personal Information</Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Full Name"
                placeholder="Your full name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                autoCapitalize="words"
                returnKeyType="next"
                testID="edit-profile-name-input"
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Phone Number (optional)"
                placeholder="+94 77 123 4567"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                keyboardType="phone-pad"
                returnKeyType="done"
                testID="edit-profile-phone-input"
              />
            )}
          />

          {/* Read-only email */}
          <View style={styles.readonlyField}>
            <Text style={styles.readonlyLabel}>Email Address</Text>
            <View style={styles.readonlyValue}>
              <Text style={styles.readonlyText}>{user?.email}</Text>
              <Text style={styles.lockedIcon}>🔒</Text>
            </View>
            <Text style={styles.readonlyHint}>
              Email cannot be changed. Contact support if needed.
            </Text>
          </View>
        </View>

        {/* ── Actions ──────────────────────────── */}
        <View style={styles.actions}>
          <Button
            title={isSaving ? 'Saving…' : 'Save Changes'}
            onPress={handleSubmit(onSubmit)}
            loading={isSaving}
            disabled={!isDirty}
            testID="edit-profile-save-btn"
          />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.cancelBtn}
            testID="edit-profile-cancel-btn"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex:      { flex: 1 },
  screen:    { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: 48 },

  // Header
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingTop:     52,
    paddingBottom:  12,
    paddingHorizontal: 24,
  },
  backBtn:      { width: 36, alignItems: 'flex-start' },
  backIcon:     { fontSize: 30, color: colors.textPrimary, lineHeight: 34 },
  headerTitle:  { ...typography.h2, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  headerSpacer: { width: 36 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.primaryMuted + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 26, fontWeight: '700', color: colors.primary },
  avatarHint:     { ...typography.caption, color: colors.textMuted },

  // Form Card
  formCard: {
    marginHorizontal: 24,
    backgroundColor:  colors.surface,
    borderRadius:     16,
    borderWidth:      1,
    borderColor:      colors.border,
    padding:          20,
    marginBottom:     24,
  },
  formSection: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 16,
  },

  // Read-only field
  readonlyField: { marginBottom: 4 },
  readonlyLabel: { ...typography.label, color: colors.textSecondary, marginBottom: 6 },
  readonlyValue: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    backgroundColor:  colors.surfaceAlt,
    borderRadius:     10,
    borderWidth:      1,
    borderColor:      colors.border,
    paddingHorizontal: 14,
    paddingVertical:  14,
    opacity:          0.7,
  },
  readonlyText: { ...typography.body, color: colors.textMuted },
  lockedIcon:   { fontSize: 16 },
  readonlyHint: { ...typography.caption, color: colors.textMuted, marginTop: 4, marginLeft: 2 },

  // Actions
  actions:    { paddingHorizontal: 24, gap: 8 },
  cancelBtn:  { marginTop: 0 },
});
