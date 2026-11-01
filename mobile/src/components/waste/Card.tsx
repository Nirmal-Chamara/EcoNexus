import { StyleSheet, StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { colors, radii, shadows } from '../../theme/wasteTheme';

interface Props extends ViewProps {
  tone?: 'white' | 'mint' | 'lavender' | 'amber';
  style?: StyleProp<ViewStyle>;
}

const BG = {
  white: colors.surface,
  mint: colors.mint,
  lavender: colors.lavenderSoft,
  amber: colors.amberSoft,
};

export default function Card({ tone = 'white', style, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[styles.card, { backgroundColor: BG[tone] }, tone === 'white' && shadows.card, style]}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, padding: 16 },
});
