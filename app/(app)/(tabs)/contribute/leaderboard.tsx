import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { colors, fontSize, fontWeight, borderRadius, spacing, shadow } from '../../../../constants/theme';
import { RankBadge } from '../../../../components/contributor/RankBadge';
import { apiGet } from '../../../../lib/contributor/api';
import type { LeaderboardBoardType } from '../../../../lib/contributor/types';

type Row = {
  user_id: string;
  display_name: string | null;
  rank_id: number;
  reward_score: number;
  trust_score: number;
  rank_position?: number;
};

const TABS: { id: LeaderboardBoardType; label: string }[] = [
  { id: 'overall', label: 'General' },
  { id: 'bugs', label: 'Top bugs' },
  { id: 'ideas', label: 'Top ideas' },
  { id: 'trust', label: 'Confianza' },
];

export default function Leaderboard() {
  const [tab, setTab] = useState<LeaderboardBoardType>('overall');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGet<{ items?: Row[]; rows?: Row[] }>(`/api/leaderboards?type=${tab}`);
      setRows(d.items ?? d.rows ?? []);
    } catch { setRows([]); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <Stack.Screen options={{ title: 'Tabla' }} />
      <View style={styles.root}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTab(t.id)}
                activeOpacity={0.7}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <FlatList
          contentContainerStyle={{ padding: spacing.md }}
          data={rows}
          keyExtractor={(r) => r.user_id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.pos}>{item.rank_position ?? index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.display_name || '—'}</Text>
                <View style={{ marginTop: 4 }}>
                  <RankBadge rank={item.rank_id} size="sm" />
                </View>
              </View>
              <View style={styles.scores}>
                <Text style={styles.score}>{item.reward_score} pts</Text>
                <Text style={styles.subScore}>Conf. {item.trust_score}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aún no hay entradas.</Text>
              </View>
            ) : null
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabs: { padding: spacing.md, gap: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md, paddingVertical: 7,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.sm, backgroundColor: colors.surface,
  },
  tabActive: { borderColor: colors.primary, backgroundColor: colors.borderLight },
  tabText: { fontSize: 12, color: colors.textSecondary, fontWeight: fontWeight.medium },
  tabTextActive: { color: colors.primary },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, marginBottom: spacing.sm, ...shadow.sm,
  },
  pos: { fontSize: fontSize.md, color: colors.textTertiary, width: 28, fontWeight: fontWeight.semibold },
  name: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  scores: { alignItems: 'flex-end' },
  score: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.semibold },
  subScore: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  empty: {
    padding: spacing.lg, borderWidth: 1, borderStyle: 'dashed',
    borderColor: colors.border, borderRadius: borderRadius.md, alignItems: 'center',
  },
  emptyText: { color: colors.textTertiary, fontSize: fontSize.sm },
});
