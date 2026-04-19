import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../../lib/i18n';
import { useBusyMissedCalls, useMarkMissedCallRead, BusyMissedCall } from '../../../lib/api/busyStatus';
import { Card } from '../../../components/ui/Card';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import { StyleSheet as RNStyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../constants/theme';

export default function MissedCallsScreen() {
  const { t } = useI18n();
  const { data, isLoading, refetch } = useBusyMissedCalls();
  const markRead = useMarkMissedCallRead();
  const [refreshing, setRefreshing] = useState(false);

  const calls = data?.items ?? [];
  const unreadCount = data?.unread_count ?? 0;

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleMarkRead(id: string) {
    try {
      await markRead.mutateAsync(id);
    } catch (err) {
      Alert.alert(t('error'), err instanceof Error ? err.message : 'Error');
    }
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('missed_calls_title'),
          headerBackTitle: t('back'),
          headerShown: true,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {unreadCount > 0 && (
          <View style={styles.countBanner}>
            <Ionicons name="call-outline" size={16} color={colors.error} />
            <Text style={styles.countText}>
              {t('missed_calls_count').replace('{count}', String(unreadCount))}
            </Text>
          </View>
        )}

        {calls.length === 0 ? (
          <EmptyState
            icon="call-outline"
            title={t('missed_calls_empty')}
            message=""
          />
        ) : (
          calls.map(call => (
            <MissedCallCard
              key={call.id}
              call={call}
              t={t}
              onMarkRead={handleMarkRead}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function MissedCallCard({
  call,
  t,
  onMarkRead,
}: {
  call: BusyMissedCall;
  t: (k: string) => string;
  onMarkRead: (id: string) => void;
}) {
  const isUnread = !call.read_at;
  const callTime = new Date(call.received_at);
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

  return (
    <Card style={RNStyleSheet.flatten([styles.callCard, isUnread && styles.callCardUnread]) as ViewStyle}>
      <View style={styles.callHeader}>
        <View style={styles.callLeft}>
          <View style={[styles.callIcon, isUnread && styles.callIconUnread]}>
            <Ionicons
              name="call-outline"
              size={16}
              color={isUnread ? colors.error : colors.textSecondary}
            />
          </View>
          <View style={styles.callInfo}>
            <Text style={[styles.callerNumber, isUnread && styles.callerNumberUnread]}>
              {call.caller_number || t('unknown')}
            </Text>
            <Text style={styles.callMeta}>
              {t('missed_call_at').replace('{time}', fmt(callTime))}
            </Text>
          </View>
        </View>
        {isUnread && (
          <View style={styles.unreadDot} />
        )}
      </View>

      {call.busy_source && (
        <View style={styles.sourceRow}>
          <Ionicons
            name={call.busy_source === 'manual_toggle' ? 'toggle-outline' : 'calendar-outline'}
            size={12}
            color={colors.textTertiary}
          />
          <Text style={styles.sourceText}>
            {call.busy_source === 'manual_toggle'
              ? t('missed_call_source_toggle')
              : t('missed_call_source_event')}
          </Text>
        </View>
      )}

      {isUnread && (
        <TouchableOpacity style={styles.readBtn} onPress={() => onMarkRead(call.id)}>
          <Ionicons name="checkmark-outline" size={14} color={colors.primary} />
          <Text style={styles.readBtnText}>{t('mark_read')}</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg * 2 },
  countBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.errorLight, padding: spacing.sm,
    borderRadius: borderRadius.md, marginBottom: spacing.xs,
  },
  countText: { fontSize: fontSize.sm, color: colors.error, fontWeight: fontWeight.semibold },
  callCard: { padding: spacing.md },
  callCardUnread: { borderLeftWidth: 3, borderLeftColor: colors.error },
  callHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  callLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  callIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  callIconUnread: { backgroundColor: colors.errorLight },
  callInfo: { flex: 1 },
  callerNumber: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  callerNumberUnread: { fontWeight: fontWeight.bold, color: colors.text },
  callMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error,
  },
  sourceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: spacing.xs,
  },
  sourceText: { fontSize: fontSize.xs, color: colors.textTertiary },
  readBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: spacing.sm, alignSelf: 'flex-end',
  },
  readBtnText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.medium },
});
