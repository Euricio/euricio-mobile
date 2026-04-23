import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../../../constants/theme';
import { ContributionCard } from '../../../../components/contributor/ContributionCard';
import { apiGet } from '../../../../lib/contributor/api';
import type { Contribution, ContributionTypeId } from '../../../../lib/contributor/types';

const FEEDBACK_TYPES: ContributionTypeId[] = ['bug', 'improvement', 'data_contribution', 'confirmation'];

export default function FeedbackList() {
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGet<{ items: Contribution[] }>('/api/contributions?sort=recent');
      setItems((d.items ?? []).filter((i) => FEEDBACK_TYPES.includes(i.type)));
    } catch {
      setItems([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Feedback y bugs',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/contribute/feedback-new' as never)} style={{ marginRight: spacing.md }}>
              <Text style={styles.newBtn}>+ Nuevo</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <FlatList
        style={styles.root}
        contentContainerStyle={{ padding: spacing.md }}
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => <ContributionCard item={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aún no hay contribuciones. Sé el primero.</Text>
            </View>
          ) : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  newBtn: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  empty: {
    padding: spacing.lg, borderWidth: 1, borderStyle: 'dashed',
    borderColor: colors.border, borderRadius: borderRadius.md, alignItems: 'center',
  },
  emptyText: { color: colors.textTertiary, fontSize: fontSize.sm },
});
