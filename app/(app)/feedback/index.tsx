import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useFeedbackTickets } from '../../../lib/api/feedback';
import type { FeedbackTicket } from '../../../lib/api/feedback';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../constants/theme';

const STATUS_FILTERS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const;

const CATEGORY_VARIANT: Record<string, 'error' | 'info' | 'warning' | 'default'> = {
  bug: 'error',
  feature: 'info',
  question: 'warning',
  other: 'default',
};

const PRIORITY_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  urgent: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'default',
};

export default function FeedbackScreen() {
  const { t, formatDate } = useI18n();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: tickets, isLoading, refetch } = useFeedbackTickets(statusFilter);

  const filterLabels: Record<string, string> = {
    all: t('feedback_filter_all'),
    open: t('feedback_filter_open'),
    in_progress: t('feedback_filter_inProgress'),
    resolved: t('feedback_filter_resolved'),
    closed: t('feedback_filter_closed'),
  };

  const renderItem = useCallback(
    ({ item }: { item: FeedbackTicket }) => (
      <Card
        onPress={() =>
          router.push({
            pathname: '/(app)/feedback/[id]',
            params: { id: item.id },
          })
        }
        style={styles.card}
      >
        <Text style={styles.subject} numberOfLines={1}>
          {item.subject}
        </Text>
        <View style={styles.badgeRow}>
          <Badge
            label={t(`feedback_category_${item.category}`)}
            variant={CATEGORY_VARIANT[item.category] || 'default'}
          />
          <Badge
            label={t(`priority_${item.priority}`)}
            variant={PRIORITY_VARIANT[item.priority] || 'default'}
          />
          <Badge
            label={t(`feedback_status_${item.status}`)}
            variant={STATUS_VARIANT[item.status] || 'default'}
          />
        </View>
        <Text style={styles.date}>
          {formatDate(item.created_at, {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })}
        </Text>
      </Card>
    ),
    [t, formatDate],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: t('feedback_title') }} />

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setStatusFilter(f)}
            style={[styles.filterTab, statusFilter === f && styles.filterTabActive]}
          >
            <Text
              style={[
                styles.filterLabel,
                statusFilter === f && styles.filterLabelActive,
              ]}
            >
              {filterLabels[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title={t('feedback_empty')}
          />
        }
      />

      {/* FAB to create ticket */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/(app)/feedback/create')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  filterLabelActive: { color: colors.white },
  list: { padding: spacing.md, paddingBottom: 100 },
  card: { marginBottom: spacing.sm },
  subject: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
});
