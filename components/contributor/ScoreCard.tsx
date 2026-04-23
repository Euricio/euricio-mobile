import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, borderRadius, spacing, shadow } from '../../constants/theme';
import { RankBadge } from './RankBadge';
import type { ContributorScore } from '../../lib/contributor/types';

const RANKS = [
  { id: 1, min: 0 }, { id: 2, min: 50 }, { id: 3, min: 200 },
  { id: 4, min: 500 }, { id: 5, min: 1500 },
];

export function ScoreCard({ score }: { score: ContributorScore }) {
  const r = RANKS.find((x) => x.id === score.rank_id) ?? RANKS[0];
  const next = RANKS.find((x) => x.id === score.rank_id + 1);
  const progress = next
    ? Math.min(1, Math.max(0, (score.reward_score - r.min) / (next.min - r.min)))
    : 1;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <RankBadge rank={score.rank_id} />
        <Text style={styles.points}>{score.reward_score} pts</Text>
      </View>
      {next ? (
        <>
          <View style={styles.barBg}>
            <View style={[styles.barFg, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.hint}>
            {next.min - score.reward_score} pts hasta siguiente rango
          </Text>
        </>
      ) : (
        <Text style={styles.hint}>Rango máximo</Text>
      )}
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Contribución</Text>
          <Text style={styles.colValue}>{score.contribution_score}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Confianza</Text>
          <Text style={styles.colValue}>{score.trust_score}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Recompensa</Text>
          <Text style={styles.colValue}>{score.reward_score}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, ...shadow.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  points: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  barBg: {
    height: 6, backgroundColor: colors.borderLight, borderRadius: 3,
    marginTop: spacing.md, overflow: 'hidden',
  },
  barFg: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  hint: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 6 },
  row: {
    flexDirection: 'row', marginTop: spacing.md,
    paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  col: { flex: 1 },
  colLabel: { fontSize: 10, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  colValue: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text, marginTop: 2 },
});
