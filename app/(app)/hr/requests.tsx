import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useMyVacationRequests,
  useMyShiftRequests,
  VacationRequest,
  ShiftRequest,
} from '../../../lib/api/hr';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../constants/theme';

const statusVariants: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

const statusKeys: Record<string, string> = {
  pending: 'hr_pending',
  approved: 'hr_approved',
  rejected: 'hr_rejected',
};

export default function RequestsScreen() {
  const { t, formatDate } = useI18n();
  const [activeTab, setActiveTab] = useState<'vacation' | 'shifts'>('vacation');
  const {
    data: vacationRequests,
    isLoading: loadingVac,
    refetch: refetchVac,
    isRefetching: refetchingVac,
  } = useMyVacationRequests();
  const {
    data: shiftRequests,
    isLoading: loadingShift,
    refetch: refetchShift,
    isRefetching: refetchingShift,
  } = useMyShiftRequests();

  const isLoading = activeTab === 'vacation' ? loadingVac : loadingShift;
  const isRefetching = activeTab === 'vacation' ? refetchingVac : refetchingShift;

  const onRefresh = () => {
    if (activeTab === 'vacation') refetchVac();
    else refetchShift();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: t('hr_requests') }} />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vacation' && styles.tabActive]}
          onPress={() => setActiveTab('vacation')}
        >
          <Text style={[styles.tabText, activeTab === 'vacation' && styles.tabTextActive]}>
            {t('hr_vacation')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shifts' && styles.tabActive]}
          onPress={() => setActiveTab('shifts')}
        >
          <Text style={[styles.tabText, activeTab === 'shifts' && styles.tabTextActive]}>
            {t('hr_shiftRequest')}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : activeTab === 'vacation' ? (
        <FlatList
          data={vacationRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: VacationRequest }) => (
            <Card style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestDates}>
                  {formatDate(item.start_date, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  {' – '}
                  {formatDate(item.end_date, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </Text>
                <Badge
                  label={t(statusKeys[item.status] ?? item.status)}
                  variant={statusVariants[item.status] ?? 'default'}
                />
              </View>
              <Text style={styles.requestDays}>
                {t('hr_daysCount')}: {item.days_count}
              </Text>
              {item.notes && (
                <Text style={styles.requestNotes} numberOfLines={2}>{item.notes}</Text>
              )}
              {item.rejection_reason && (
                <Text style={styles.rejectionReason}>
                  {t('hr_rejectionReason')}: {item.rejection_reason}
                </Text>
              )}
            </Card>
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState icon="airplane-outline" title={t('hr_noVacationRequests')} />
          }
        />
      ) : (
        <FlatList
          data={shiftRequests}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }: { item: ShiftRequest }) => (
            <Card style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestDates}>
                  {formatDate(item.shift_date, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </Text>
                <Badge
                  label={t(statusKeys[item.status] ?? item.status)}
                  variant={statusVariants[item.status] ?? 'default'}
                />
              </View>
              <Text style={styles.requestDays}>
                {item.start_time?.slice(0, 5)} – {item.end_time?.slice(0, 5)}
              </Text>
              {item.notes && (
                <Text style={styles.requestNotes} numberOfLines={2}>{item.notes}</Text>
              )}
              {item.rejection_reason && (
                <Text style={styles.rejectionReason}>
                  {t('hr_rejectionReason')}: {item.rejection_reason}
                </Text>
              )}
            </Card>
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState icon="time-outline" title={t('hr_noShiftRequests')} />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() =>
          router.push(
            activeTab === 'vacation'
              ? '/(app)/hr/create-vacation'
              : '/(app)/hr/create-shift-request',
          )
        }
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
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
    marginBottom: spacing.sm,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  requestDates: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  requestDays: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  requestNotes: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rejectionReason: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
});
