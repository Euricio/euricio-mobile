import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, fontSize, borderRadius, spacing } from '../../../../constants/theme';
import { ContributionForm } from '../../../../components/contributor/ContributionForm';
import { apiGet } from '../../../../lib/contributor/api';

type MeResponse = { rank: { id: number }; score: { rank_id: number } };

export default function IdeasNew() {
  const [rankId, setRankId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<MeResponse>('/api/contributor/me')
      .then((d) => setRankId(d.rank?.id ?? d.score?.rank_id ?? 1))
      .catch(() => setRankId(1))
      .finally(() => setLoading(false));
  }, []);

  const canSubmit = (rankId ?? 0) >= 2;

  return (
    <>
      <Stack.Screen options={{ title: 'Proponer idea' }} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          {loading ? (
            <ActivityIndicator />
          ) : !canSubmit ? (
            <View style={styles.gate}>
              <Text style={styles.gateText}>
                La creación de ideas se desbloquea a partir del rango{' '}
                <Text style={styles.gateBold}>Contributor</Text>. Sigue reportando bugs
                y participando para ganar reputación.
              </Text>
            </View>
          ) : (
            <ContributionForm
              mode="idea"
              onSubmitted={(id) => router.replace(`/contribute/ideas/${id}` as never)}
            />
          )}
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  gate: {
    padding: spacing.md, borderWidth: 1, borderStyle: 'dashed',
    borderColor: colors.border, borderRadius: borderRadius.md,
  },
  gateText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  gateBold: { fontWeight: '600', color: colors.text },
});
