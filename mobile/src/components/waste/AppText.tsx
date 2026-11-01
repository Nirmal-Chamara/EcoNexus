/* eslint-disable @typescript-eslint/consistent-type-imports */
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme/wasteTheme';

export type TextVariant =
  'title' | 'section' | 'number' | 'button' | 'body' | 'bodyStrong' | 'muted' | 'caption' | 'label';

interface Props extends TextProps {
  variant?: TextVariant;
  color?: string;
}

export default function AppText({ variant = 'body', color, style, ...rest }: Props) {
  return <Text {...rest} style={[styles[variant], color ? { color } : null, style]} />;
}

const styles = StyleSheet.create({
  // Poppins
  title: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 32, color: colors.ink },
  section: { fontFamily: fonts.headingSemi, fontSize: 17, lineHeight: 24, color: colors.ink },
  number: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.ink },
  button: { fontFamily: fonts.headingSemi, fontSize: 15, lineHeight: 20, color: colors.ink },
  // Inter
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.ink },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  // eslint-disable-next-line react-native/no-unused-styles
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, color: colors.textMuted },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.primary,
  },
});
