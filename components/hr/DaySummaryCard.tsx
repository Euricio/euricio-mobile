import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TimeEntryWithCategory } from '../../lib/api/hr';
import { Card } from '../ui/Card';
import { CategoryBreakdown } from './CategoryBreakdown';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

interface DaySummaryCardProps {
  entries: TimeEntryWithCategory[];
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function DaySummaryCard({ entries }: DaySummaryCardProps) {
  const { t } = useI18n();

  const completedEntries = entries.filter((e) => e.status === 'completed');
  const totalMinutes = completedEntries.reduce(
    (sum, e) => sum + (e.duration_minutes ?? 0),
    0,
  );
  const totalBreakMinutes = entries.reduce(
    (sum, e) => sum + (e.short_break_minutes ?? 0) + (e.lunch_break_minutes ?? 0),
    0,
  );
  const netMinutes = Math.max(0, totalMinutes - totalBreakMinutes);
  const targetMinutes = 480; // 8h

  const ratio = targetMinutes > 0 ? Math.min(netMinutes / targetMinutes, 1.5) : 0;
  const isOnTarget = netMinutes >= targetMinutes;

  if (entries.length === 0) {
    return (
      <Card style={styles.card}>
        <Text style={styles.emptyText}>{t('hr_noEntriesThisDay')}</Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      {/* Summary stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('hr_actualHours')}</Text>
          <Text style={styles.statValue}>{formatMinutes(totalMinutes)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('hr_totalBreaks')}</Text>
          <Text style={styles.statValue}>{formatMinutes(totalBreakMinutes)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>{t('hr_netWorkTime')}</Text>
          <Text style={[styles.statValue, { color: isOnTarget ? colors.success : colors.error }]}>
            {formatMinutes(netMinutes)}
          </Text>
        </View>
      </View>

      {/* Target bar */}
      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>{t('hr_targetHours')}: 8h</Text>
        <View style={styles.targetBar}>
          <View
            style={[
              styles.targetFill,
              {
                flex: Math.min(ratio, 1),
                backgroundColor: isOnTarget ? colors.success : colors.error,
              },
            ]}
          />
          <View style={{ flex: Math.max(0, 1 - ratio) }} />
        </View>
      </View>

      {/* Category breakdown */}
      <CategoryBreakdown entries={completedEntries} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  targetRow: {
    marginBottom: spacing.sm,
  },
  targetLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  targetBar: {
    flexDirection: 'row',
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  targetFill: {
    borderRadius: borderRadius.sm,
  },
});
