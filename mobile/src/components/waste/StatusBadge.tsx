import { StyleSheet, View } from 'react-native';
import AppText from './AppText';
import { colors, radii } from '../../theme/wasteTheme';

const MAP: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: 'Draft / Unlisted', bg: '#E8EAF3', fg: '#565E70' },
  active: { label: 'Awaiting Hauler', bg: colors.amberBg, fg: colors.amberText },
  requested: { label: 'Finding Hauler', bg: colors.amberBg, fg: colors.amberText },
  scheduled: { label: 'Hauler Assigned', bg: colors.mint, fg: colors.primary },
  collected: { label: 'Completed', bg: colors.mint, fg: colors.primary },
  cancelled: { label: 'Cancelled', bg: colors.dangerSoft, fg: colors.danger },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status, bg: colors.lavender, fg: colors.ink };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.fg }]} />
      <AppText variant="caption" color={s.fg} style={{ fontFamily: 'Inter_600SemiBold' }}>
        {s.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
