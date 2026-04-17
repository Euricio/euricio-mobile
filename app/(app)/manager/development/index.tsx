import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useI18n } from '../../../../lib/i18n';
import { useDevelopmentPlans } from '../../../../lib/api/development';
import type { DevelopmentPlan } from '../../../../lib/api/development';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { SearchBar } from '../../../../components/ui/SearchBar';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../../constants/theme';

const STATUS_FILTERS = ['all', 'draft', 'active', 'completed', 'blocked'] as const;

const STATUS_VARIANT: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  active: 'info',
  completed: 'success',
  blocked: 'error',
};

export default function DevelopmentListScreen() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: plans, isLoading } = useDevelopmentPlans(statusFilter, search);

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('dev_title'),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(app)/manager/development/create')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.searchRow}>
        <SearchBar value={search} onChangeText={setSearch} placeholder={t('dev_search')} />
      </View>

      {/* Status filter tabs */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
            onPress={() => setStatusFilter(f)}
          >
            <Text
              style={[styles.filterChipText, statusFilter === f && styles.filterChipTextActive]}
            >
              {f === 'all' ? t('dev_filter_all') : t(`dev_status_${f}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{search ? t('dev_empty') : t('dev_emptyDefault')}</Text>
        }
        renderItem={({ item }) => <PlanCard plan={item} t={t} />}
      />
    </View>
  );
}

function PlanCard({ plan, t }: { plan: DevelopmentPlan; t: (key: string) => string }) {
  const profileName = (plan.profile as any)?.full_name || '—';

  return (
    <Card
      style={styles.planCard}
      onPress={() => router.push({ pathname: '/(app)/manager/development/[id]', params: { id: plan.id } })}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planEmployee} numberOfLines={1}>{profileName}</Text>
        <Badge
          label={t(`dev_status_${plan.status}`)}
          variant={STATUS_VARIANT[plan.status] || 'default'}
          size="sm"
        />
      </View>
      <Text style={styles.planArea}>{t(`dev_area_${plan.area}`)}</Text>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${plan.progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{plan.progress}%</Text>
      </View>

      {/* Dates */}
      <View style={styles.datesRow}>
        {plan.start_date && (
          <Text style={styles.dateText}>{plan.start_date}</Text>
        )}
        {plan.target_date && (
          <Text style={styles.dateText}>→ {plan.target_date}</Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderLight,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
  filterChipTextActive: { color: colors.white },
  listContent: { padding: spacing.md, paddingTop: 0, paddingBottom: 120 },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  planCard: { marginBottom: spacing.sm },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  planEmployee: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text, flex: 1, marginRight: spacing.sm },
  planArea: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary, width: 36, textAlign: 'right' },
  datesRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  dateText: { fontSize: fontSize.xs, color: colors.textTertiary },
});
