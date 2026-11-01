import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import { colors, radii } from '../../theme/wasteTheme';

type Variant = 'primary' | 'lime' | 'soft' | 'dangerText' | 'linkText';
type IconName = keyof typeof Ionicons.glyphMap;

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BG: Record<Variant, string> = {
  primary: colors.primary,
  lime: colors.lime,
  soft: colors.lavender,
  dangerText: 'transparent',
  linkText: 'transparent',
};
const FG: Record<Variant, string> = {
  primary: colors.white,
  lime: colors.ink,
  soft: colors.ink,
  dangerText: colors.danger,
  linkText: colors.primary,
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  loading,
  disabled,
  style,
}: Props) {
  const inactive = !!(disabled || loading);
  const isText = variant === 'dangerText' || variant === 'linkText';
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        isText && styles.textOnly,
        { backgroundColor: BG[variant] },
        pressed && { opacity: 0.85 },
        inactive && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={FG[variant]} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={FG[variant]} />}
          <AppText variant="button" color={FG[variant]}>
            {label}
          </AppText>
          {iconRight && <Ionicons name={iconRight} size={18} color={FG[variant]} />}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
  },
  textOnly: { paddingVertical: 8, paddingHorizontal: 8 },
});
