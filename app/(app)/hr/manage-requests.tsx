import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  usePendingRequests,
  useReviewVacationRequest,
  useReviewShiftRequest,
  VacationRequest,
  ShiftRequest,
} from '../../../lib/api/hr';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

export default function ManageRequestsScreen() {
  const { t, formatDate } = useI18n();
  const [activeTab, setActiveTab] = useState<'vacation' | 'shifts'>('vacation');
  const { data: pending, isLoading, refetch, isRefetching } = usePendingRequests();
  const reviewVacation = useReviewVacationRequest();
  const reviewShift = useReviewShiftRequest();

  const handleApproveVacation = (id: string) => {
    reviewVacation.mutate({ id, status: 'approved' });
  };

  const handleRejectVacation = (id: string) => {
    Alert.prompt?.(
      t('hr_reject'),
      t('hr_enterRejectionReason'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('hr_reject'),
          style: 'destructive',
          onPress: (reason?: string) => {
            reviewVacation.mutate({ id, status: 'rejected', rejection_reason: reason || undefined });
          },
        },
      ],
      'plain-text',
    ) ?? reviewVacation.mutate({ id, status: 'rejected' });
  };

  const handleApproveShift = (id: number) => {
    reviewShift.mutate({ id, status: 'approved' });
  };

  const handleRejectShift = (id: number) => {
    Alert.prompt?.(
      t('hr_reject'),
      t('hr_enterRejectionReason'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('hr_reject'),
          style: 'destructive',
          onPress: (reason?: string) => {
            reviewShift.mutate({ id, status: 'rejected', rejection_reason: reason || undefined });
          },
        },
      ],
      'plain-text',
    ) ?? reviewShift.mutate({ id, status: 'rejected' });
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: t('hr_manageRequests') }} />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vacation' && styles.tabActive]}
          onPress={() => setActiveTab('vacation')}
        >
          <Text style={[styles.tabText, activeTab === 'vacation' && styles.tabTextActive]}>
            {t('hr_vacation')} ({pending?.vacationRequests.length ?? 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shifts' && styles.tabActive]}
          onPress={() => setActiveTab('shifts')}
        >
          <Text style={[styles.tabText, activeTab === 'shifts' && styles.tabTextActive]}>
            {t('hr_shiftRequest')} ({pending?.shiftRequests.length ?? 0})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'vacation' ? (
        <FlatList
          data={pending?.vacationRequests ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: VacationRequest }) => (
            <Card style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.employeeName}>
                  {item.employee?.full_name ?? t('unknown')}
                </Text>
                <Badge label={t('hr_pending')} variant="warning" />
              </View>
              <Text style={styles.requestDates}>
                {formatDate(item.start_date, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                {' – '}
                {formatDate(item.end_date, { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Text>
              <Text style={styles.requestDays}>
                {item.days_count} {t('hr_daysCount')}
              </Text>
              {item.notes && (
                <Text style={styles.requestNotes}>{item.notes}</Text>
              )}
              <View style={styles.actionRow}>
                <Button
                  title={t('hr_approve')}
                  onPress={() => handleApproveVacation(item.id)}
                  size="sm"
                  loading={reviewVacation.isPending}
                  icon={<Ionicons name="checkmark" size={16} color={colors.white} />}
                  style={{ flex: 1, backgroundColor: colors.success }}
                />
                <Button
                  title={t('hr_reject')}
                  onPress={() => handleRejectVacation(item.id)}
                  variant="danger"
                  size="sm"
                  loading={reviewVacation.isPending}
                  icon={<Ionicons name="close" size={16} color={colors.white} />}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState icon="checkmark-done-outline" title={t('hr_noPendingRequests')} />
          }
        />
      ) : (
        <FlatList
          data={pending?.shiftRequests ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }: { item: ShiftRequest }) => (
            <Card style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.employeeName}>
                  {item.employee?.full_name ?? t('unknown')}
                </Text>
                <Badge label={t('hr_pending')} variant="warning" />
              </View>
              <Text style={styles.requestDates}>
                {formatDate(item.shift_date, { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Text>
              <Text style={styles.requestDays}>
                {item.start_time?.slice(0, 5)} – {item.end_time?.slice(0, 5)}
              </Text>
              {item.notes && (
                <Text style={styles.requestNotes}>{item.notes}</Text>
              )}
              <View style={styles.actionRow}>
                <Button
                  title={t('hr_approve')}
                  onPress={() => handleApproveShift(item.id)}
                  size="sm"
                  loading={reviewShift.isPending}
                  icon={<Ionicons name="checkmark" size={16} color={colors.white} />}
                  style={{ flex: 1, backgroundColor: colors.success }}
                />
                <Button
                  title={t('hr_reject')}
                  onPress={() => handleRejectShift(item.id)}
                  variant="danger"
                  size="sm"
                  loading={reviewShift.isPending}
                  icon={<Ionicons name="close" size={16} color={colors.white} />}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState icon="checkmark-done-outline" title={t('hr_noPendingRequests')} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  requestCard: {
    marginBottom: spacing.md,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  employeeName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  requestDates: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  requestDays: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  requestNotes: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
