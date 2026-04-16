import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFlows, createFlow, VoiceFlow } from '../../../../lib/voice/voiceApi';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { useI18n } from '../../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight } from '../../../../constants/theme';

export default function FlowsListScreen() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['voice-flows'],
    queryFn: fetchFlows,
  });

  const createMut = useMutation({
    mutationFn: () => createFlow({ name: t('voice_newFlow') }),
    onSuccess: (flow) => {
      qc.invalidateQueries({ queryKey: ['voice-flows'] });
      router.push(`/(app)/voice/flows/${flow.id}` as never);
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerTitle: t('voice_flows') }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const flows = data?.flows || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('voice_flows') }} />

      <Button
        title={t('voice_createFlow')}
        onPress={() => createMut.mutate()}
        loading={createMut.isPending}
        icon={<Ionicons name="add" size={18} color={colors.white} />}
        style={{ marginBottom: spacing.md }}
      />

      {flows.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="git-branch-outline" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>{t('voice_noFlows')}</Text>
        </View>
      ) : (
        flows.map((flow) => (
          <Card
            key={flow.id}
            onPress={() => router.push(`/(app)/voice/flows/${flow.id}` as never)}
            style={styles.card}
          >
            <View style={styles.flowRow}>
              <View style={styles.flowIcon}>
                <Ionicons name="git-branch-outline" size={20} color={colors.primaryLight} />
              </View>
              <View style={styles.flowInfo}>
                <Text style={styles.flowName}>{flow.name}</Text>
                {flow.description && (
                  <Text style={styles.flowDesc} numberOfLines={1}>
                    {flow.description}
                  </Text>
                )}
              </View>
              <View style={styles.flowStatus}>
                <Badge
                  label={flow.is_published ? t('voice_published') : t('voice_draft')}
                  color={flow.is_published ? 'success' : 'warning'}
                />
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  card: { marginBottom: spacing.sm },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowInfo: { flex: 1 },
  flowName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  flowDesc: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  flowStatus: {
    marginRight: 4,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
});
