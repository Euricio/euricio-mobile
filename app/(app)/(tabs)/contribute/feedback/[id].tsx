import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { colors, fontSize, fontWeight, borderRadius, spacing, shadow } from '../../../../../constants/theme';
import { StatusPill } from '../../../../../components/contributor/StatusPill';
import { AdminReply } from '../../../../../components/contributor/AdminReply';
import { apiGet } from '../../../../../lib/contributor/api';
import type { Contribution, AdminReply as AdminReplyRow } from '../../../../../lib/contributor/types';

type DetailResponse = {
  contribution: Contribution;
  replies?: AdminReplyRow[];
};

export default function FeedbackDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<DetailResponse>(`/api/contributions/${id}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!data?.contribution) return <View style={styles.center}><Text style={styles.dim}>No encontrado.</Text></View>;

  const c = data.contribution;
  const body = c.body_json as Record<string, string>;

  return (
    <>
      <Stack.Screen options={{ title: 'Detalle' }} />
      <ScrollView style={styles.root} contentContainerStyle={{ padding: spacing.md }}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.type}>{c.type.toUpperCase()}</Text>
            <StatusPill status={c.status} />
          </View>
          <Text style={styles.title}>{c.title}</Text>
          <Text style={styles.date}>{new Date(c.created_at).toLocaleString('es-ES')}</Text>

          {Object.entries(body).map(([k, v]) => (
            <View key={k} style={{ marginTop: spacing.md }}>
              <Text style={styles.fieldLabel}>{k.replace(/_/g, ' ')}</Text>
              <Text style={styles.fieldValue}>{String(v)}</Text>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.meta}>♡ {c.likes_count}</Text>
            <Text style={styles.meta}>· {c.views_count} vistas</Text>
            <Text style={styles.meta}>· Prio {c.priority_score.toFixed(2)}</Text>
          </View>
        </View>

        {data.replies && data.replies.length > 0 && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.section}>Respuestas</Text>
            {data.replies.map((r) => <AdminReply key={r.id} reply={r} />)}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  dim: { color: colors.textTertiary },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, ...shadow.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm, flexWrap: 'wrap' },
  type: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5,
    color: colors.textTertiary, fontWeight: fontWeight.semibold,
  },
  title: { fontSize: fontSize.lg, color: colors.text, fontWeight: fontWeight.semibold, marginBottom: 4 },
  date: { fontSize: 11, color: colors.textTertiary },
  fieldLabel: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5,
    color: colors.textTertiary, marginBottom: 4,
  },
  fieldValue: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  footer: {
    flexDirection: 'row', gap: 6, marginTop: spacing.md,
    paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  meta: { fontSize: 11, color: colors.textTertiary },
  section: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5,
    color: colors.textTertiary, marginBottom: spacing.sm,
  },
});
