import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { colors, fontSize, fontWeight, borderRadius, spacing, shadow } from '../../../../../constants/theme';
import { StatusPill } from '../../../../../components/contributor/StatusPill';
import { AdminReply } from '../../../../../components/contributor/AdminReply';
import { apiGet, apiPost, apiDelete } from '../../../../../lib/contributor/api';
import type { Contribution, AdminReply as AdminReplyRow } from '../../../../../lib/contributor/types';

type DetailResponse = {
  contribution: Contribution;
  replies?: AdminReplyRow[];
  voted?: boolean;
};

export default function IdeaDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState(0);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    apiGet<DetailResponse>(`/api/contributions/${id}`)
      .then((d) => {
        setData(d);
        setVoted(d.voted ?? false);
        setVotes(d.contribution?.likes_count ?? 0);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleVote = async () => {
    if (voting) return;
    setVoting(true);
    const prev = voted;
    setVoted(!prev); setVotes((n) => n + (prev ? -1 : 1));
    try {
      if (prev) await apiDelete(`/api/ideas/${id}/vote`);
      else await apiPost(`/api/ideas/${id}/vote`);
    } catch {
      setVoted(prev); setVotes((n) => n + (prev ? 1 : -1));
    } finally { setVoting(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!data?.contribution) return <View style={styles.center}><Text style={styles.dim}>No encontrada.</Text></View>;

  const c = data.contribution;
  const body = c.body_json as Record<string, string>;

  return (
    <>
      <Stack.Screen options={{ title: 'Idea' }} />
      <ScrollView style={styles.root} contentContainerStyle={{ padding: spacing.md }}>
        <View style={styles.card}>
          <TouchableOpacity
            onPress={toggleVote}
            activeOpacity={0.7}
            disabled={voting}
            style={[styles.vote, voted && styles.voteActive]}
          >
            <Text style={[styles.voteArrow, voted && styles.voteActiveText]}>▲</Text>
            <Text style={[styles.voteCount, voted && styles.voteActiveText]}>{votes}</Text>
            <Text style={[styles.voteLabel, voted && styles.voteActiveText]}>VOTOS</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <Text style={styles.type}>{c.type.toUpperCase()}</Text>
              <StatusPill status={c.status} />
            </View>
            <Text style={styles.title}>{c.title}</Text>
            <Text style={styles.prio}>Prio {c.priority_score.toFixed(2)}</Text>

            {Object.entries(body).map(([k, v]) => (
              <View key={k} style={{ marginTop: spacing.sm }}>
                <Text style={styles.fieldLabel}>{k.replace(/_/g, ' ')}</Text>
                <Text style={styles.fieldValue}>{String(v)}</Text>
              </View>
            ))}
          </View>
        </View>

        {data.replies && data.replies.length > 0 && (
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.section}>Respuestas del equipo</Text>
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
    padding: spacing.md, ...shadow.sm, flexDirection: 'row', gap: spacing.md,
  },
  vote: {
    width: 64, backgroundColor: colors.borderLight,
    borderRadius: borderRadius.sm, paddingVertical: spacing.md,
    alignItems: 'center', justifyContent: 'flex-start',
    borderWidth: 1, borderColor: colors.border,
  },
  voteActive: { borderColor: colors.primary, backgroundColor: colors.infoLight },
  voteArrow: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.bold },
  voteCount: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.semibold, marginTop: 4 },
  voteLabel: { fontSize: 10, color: colors.textTertiary, marginTop: 2, letterSpacing: 0.5 },
  voteActiveText: { color: colors.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  type: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5,
    color: colors.textTertiary, fontWeight: fontWeight.semibold,
  },
  title: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.semibold },
  prio: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  fieldLabel: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5,
    color: colors.textTertiary, marginBottom: 3,
  },
  fieldValue: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
  section: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5,
    color: colors.textTertiary, marginBottom: spacing.sm,
  },
});
