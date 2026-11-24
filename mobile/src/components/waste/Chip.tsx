import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import AppText from './AppText';
import { colors, radii } from '../../theme/wasteTheme';

interface Props {
  label: string;
  selected?: boolean;
  count?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function Chip({ label, selected, count, onPress, style }: Props) {
  const fg = selected ? colors.white : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.lavender }, style]}
    >
      <AppText variant="bodyStrong" color={fg}>
        {label}
      </AppText>
      {count !== undefined && (
        <View style={[styles.count, { backgroundColor: selected ? colors.white : colors.white }]}>
          <AppText variant="caption" color={colors.ink}>
            {count}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
  },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
