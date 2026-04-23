import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../constants/theme';

const MARK: Record<number, string> = { 1: '·', 2: '◦', 3: '★', 4: '★★', 5: '★★★' };
const NAME: Record<number, string> = {
  1: 'Explorer', 2: 'Contributor', 3: 'Verified Pro', 4: 'Expert Guide', 5: 'Master Partner',
};

export function RankBadge({ rank, size = 'md' }: { rank: number; size?: 'sm' | 'md' }) {
  const small = size === 'sm';
  return (
    <View style={[styles.wrap, small && styles.wrapSm]}>
      <Text style={[styles.mark, small && styles.markSm]}>{MARK[rank] ?? '·'}</Text>
      <Text style={[styles.name, small && styles.nameSm]}>{NAME[rank] ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    backgroundColor: colors.borderLight, borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  wrapSm: { paddingHorizontal: 6, paddingVertical: 2 },
  mark: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
  markSm: { fontSize: fontSize.xs },
  name: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
  nameSm: { fontSize: 10 },
});
