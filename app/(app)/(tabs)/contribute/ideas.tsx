import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../../../constants/theme';
import { IdeaCard } from '../../../../components/contributor/IdeaCard';
import { apiGet } from '../../../../lib/contributor/api';
import type { Contribution } from '../../../../lib/contributor/types';

type Tab = 'popular' | 'new' | 'team' | 'implemented';

const TABS: { id: Tab; label: string }[] = [
  { id: 'popular', label: 'Populares' },
  { id: 'new', label: 'Nuevas' },
  { id: 'team', label: 'Equipo' },
  { id: 'implemented', label: 'Implementadas' },
];

const tabToQS = (t: Tab): string => {
  if (t === 'popular') return 'sort=priority';
  if (t === 'new') return 'sort=recent';
  if (t === 'team') return 'pinned=1';
  if (t === 'implemented') return 'status=implemented';
  return '';
};

export default function IdeasList() {
  const [tab, setTab] = useState<Tab>('popular');
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGet<{ items: Contribution[] }>(`/api/ideas?${tabToQS(tab)}`);
      setItems(d.items ?? []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Ideas',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/contribute/ideas-new' as never)} style={{ marginRight: spacing.md }}>
              <Text style={styles.newBtn}>+ Proponer</Text>
            </TouchableOpacity>
          ),
        }}
      />
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
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => <IdeaCard item={item} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Aún no hay ideas en esta categoría.</Text>
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
  newBtn: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  empty: {
    padding: spacing.lg, borderWidth: 1, borderStyle: 'dashed',
    borderColor: colors.border, borderRadius: borderRadius.md, alignItems: 'center',
  },
  emptyText: { color: colors.textTertiary, fontSize: fontSize.sm },
});
