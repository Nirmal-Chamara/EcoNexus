import React, { forwardRef, useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { TextInputProps, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export const FormInput = forwardRef<TextInput, FormInputProps>(
  ({ label, error, containerStyle, isPassword = false, ...rest }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={styles.label}>{label}</Text>
        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputFocused,
            !!error && styles.inputError,
          ]}
        >
          <TextInput
            ref={ref}
            style={styles.input}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={isPassword && !isVisible}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize={isPassword ? 'none' : rest.autoCapitalize}
            autoCorrect={isPassword ? false : rest.autoCorrect}
            {...rest}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={() => setIsVisible((v) => !v)}
              style={styles.eyeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.eyeText}>{isVisible ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          )}
        </View>
        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

FormInput.displayName = 'FormInput';

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputFocused: { borderColor: colors.borderFocus },
  inputError: { borderColor: colors.error },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  eyeButton: { paddingLeft: 8 },
  eyeText: { fontSize: 16 },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: 4,
    marginLeft: 2,
  },
});
