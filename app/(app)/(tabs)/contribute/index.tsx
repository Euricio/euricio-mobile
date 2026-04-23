import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, fontSize, fontWeight, borderRadius, spacing, shadow } from '../../../../constants/theme';
import { ScoreCard } from '../../../../components/contributor/ScoreCard';
import { apiGet } from '../../../../lib/contributor/api';
import type { ContributorScore, ContributorProfile, RewardGrant } from '../../../../lib/contributor/types';

type MeResponse = {
  user_id: string;
  profile: ContributorProfile;
  score: ContributorScore;
  rank: { id: number; name: string };
  grants: RewardGrant[];
};

export default function ContributeHome() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      const d = await apiGet<MeResponse>('/api/contributor/me');
      setMe(d); setErr(null);
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Participar' }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {err && <Text style={styles.err}>{err}</Text>}
        {me && (
          <>
            <ScoreCard score={me.score} />
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push('/contribute/feedback-new' as never)}
              >
                <Text style={styles.cardLabel}>Feedback</Text>
                <Text style={styles.cardTitle}>Reportar bug o mejora</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push('/contribute/ideas-new' as never)}
              >
                <Text style={styles.cardLabel}>Idea</Text>
                <Text style={styles.cardTitle}>Proponer una idea</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push('/contribute/feedback' as never)}
              >
                <Text style={styles.cardLabel}>Feedback</Text>
                <Text style={styles.cardTitle}>Ver contribuciones</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push('/contribute/ideas' as never)}
              >
                <Text style={styles.cardLabel}>Ideas</Text>
                <Text style={styles.cardTitle}>Ver tablero</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push('/contribute/leaderboard' as never)}
              >
                <Text style={styles.cardLabel}>Ranking</Text>
                <Text style={styles.cardTitle}>Ver tabla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push('/contribute/profile' as never)}
              >
                <Text style={styles.cardLabel}>Perfil</Text>
                <Text style={styles.cardTitle}>Mi perfil</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  err: { color: colors.error, marginBottom: spacing.md },
  actions: { marginTop: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, ...shadow.sm,
  },
  cardLabel: { fontSize: fontSize.xs, color: colors.textTertiary, marginBottom: 4 },
  cardTitle: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
});
