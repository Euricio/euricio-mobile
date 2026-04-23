import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { colors, fontSize, fontWeight, borderRadius, spacing, shadow } from '../../constants/theme';
import { StatusPill } from './StatusPill';
import type { Contribution } from '../../lib/contributor/types';

export function ContributionCard({ item, basePath = '/contribute/feedback' }: { item: Contribution; basePath?: string }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`${basePath}/${item.id}` as never)}
      style={styles.card}
    >
      <View style={styles.row}>
        <Text style={styles.type}>{item.type.toUpperCase()}</Text>
        <StatusPill status={item.status} />
        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('es-ES')}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>♡ {item.likes_count}</Text>
        <Text style={styles.meta}>· {item.views_count} vistas</Text>
        <Text style={styles.meta}>· Prio {item.priority_score.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, ...shadow.sm, marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 },
  type: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5,
    color: colors.textTertiary, fontWeight: fontWeight.semibold,
  },
  date: { fontSize: 11, color: colors.textTertiary, marginLeft: 'auto' },
  title: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium, lineHeight: 20 },
  footer: { flexDirection: 'row', gap: 6, marginTop: spacing.sm },
  meta: { fontSize: 11, color: colors.textTertiary },
});
