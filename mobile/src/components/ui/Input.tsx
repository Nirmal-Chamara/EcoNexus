import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radii, typography } from '../../theme';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  valid?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  containerStyle?: StyleProp<ViewStyle>;
  isPassword?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    valid,
    icon,
    containerStyle,
    isPassword,
    style,
    onFocus,
    onBlur,
    editable = true,
    accessibilityLabel,
    ...props
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused && styles.focused,
          !!error && styles.errorBorder,
          !editable && styles.disabled,
        ]}
      >
        {icon && (
          <Ionicons
            accessible={false}
            importantForAccessibility="no"
            name={icon}
            size={20}
            color={colors.textSecondary}
          />
        )}
        <TextInput
          {...props}
          ref={ref}
          editable={editable}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={
            [props.accessibilityHint, error || (valid ? 'Valid' : undefined)]
              .filter(Boolean)
              .join('. ') || undefined
          }
          accessibilityState={{ ...props.accessibilityState, disabled: !editable }}
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword ? !visible : props.secureTextEntry}
          autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
          autoCorrect={isPassword ? false : props.autoCorrect}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {valid && !error && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.success}
            accessibilityLabel="Valid"
          />
        )}
        {isPassword && (
          <Pressable
            disabled={!editable}
            onPress={() => setVisible(!visible)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            accessibilityState={{ disabled: !editable }}
            style={styles.eye}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
});

export const PasswordInput = forwardRef<TextInput, Omit<InputProps, 'isPassword'>>(
  function PasswordInput(props, ref) {
    return <Input {...props} ref={ref} isPassword />;
  }
);

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceAlt,
  },
  input: {
    minHeight: 44,
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.md,
  },
  focused: { borderColor: colors.borderFocus },
  errorBorder: { borderColor: colors.error },
  disabled: { opacity: 0.5 },
  eye: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  error: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
});
