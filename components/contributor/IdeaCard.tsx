import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors, fontSize, fontWeight, borderRadius, spacing, shadow } from '../../constants/theme';
import { StatusPill } from './StatusPill';
import type { Contribution } from '../../lib/contributor/types';

export function IdeaCard({ item }: { item: Contribution }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/contribute/ideas/${item.id}` as never)}
      style={styles.card}
    >
      <View style={styles.vote}>
        <Text style={styles.voteArrow}>▲</Text>
        <Text style={styles.voteCount}>{item.likes_count}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.row}>
          <StatusPill status={item.status} />
          <Text style={styles.prio}>Prio {item.priority_score.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', gap: spacing.md, backgroundColor: colors.surface,
    borderRadius: borderRadius.md, padding: spacing.md, ...shadow.sm,
    marginBottom: spacing.sm,
  },
  vote: {
    alignItems: 'center', justifyContent: 'center',
    width: 54, backgroundColor: colors.borderLight,
    borderRadius: borderRadius.sm, paddingVertical: spacing.sm,
  },
  voteArrow: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.bold },
  voteCount: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.semibold, marginTop: 2 },
  body: { flex: 1, justifyContent: 'space-between' },
  title: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm, flexWrap: 'wrap' },
  prio: { fontSize: 11, color: colors.textTertiary },
});
