import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPermissions,
  updatePermissions,
  TeamMemberPermission,
} from '../../../lib/voice/voiceApi';
import { Card } from '../../../components/ui/Card';
import { FormInput } from '../../../components/ui/FormInput';
import { Button } from '../../../components/ui/Button';
import { useI18n } from '../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme';

export default function RoutingScreen() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['voice-permissions'],
    queryFn: fetchPermissions,
  });

  const updateMut = useMutation({
    mutationFn: (params: { user_id: string; enabled: boolean; mobile_number?: string }) =>
      updatePermissions(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice-permissions'] }),
    onError: () => Alert.alert(t('voice_error'), t('voice_updateFailed')),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerTitle: t('voice_routing') }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const members = data?.members || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('voice_routing') }} />

      <Text style={styles.description}>{t('voice_routingDescription')}</Text>

      {members.map((member, index) => (
        <Card key={member.id} style={styles.card}>
          <View style={styles.memberHeader}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>{index + 1}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {member.full_name || member.email}
              </Text>
              {member.routing_mode && (
                <Text style={styles.routingMode}>{member.routing_mode}</Text>
              )}
            </View>
            <Switch
              value={member.voice_enabled}
              onValueChange={() =>
                updateMut.mutate({
                  user_id: member.id,
                  enabled: !member.voice_enabled,
                })
              }
              trackColor={{ true: colors.success }}
            />
          </View>

          {member.voice_enabled && (
            <View style={styles.memberDetails}>
              {member.mobile_number !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('voice_mobileNumber')}</Text>
                  <Text style={styles.detailValue}>
                    {member.mobile_number || '—'}
                  </Text>
                </View>
              )}
              {member.timeout_seconds !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Timeout</Text>
                  <Text style={styles.detailValue}>
                    {member.timeout_seconds}s
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>
      ))}

      {members.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="git-network-outline" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>{t('voice_noRoutingMembers')}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  card: { marginBottom: spacing.sm },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  routingMode: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  memberDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
});
