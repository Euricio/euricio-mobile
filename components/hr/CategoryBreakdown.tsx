import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TimeEntryWithCategory } from '../../lib/api/hr';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

interface CategoryBreakdownProps {
  entries: TimeEntryWithCategory[];
}

interface CategoryTotal {
  id: string;
  name: string;
  color: string;
  minutes: number;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function CategoryBreakdown({ entries }: CategoryBreakdownProps) {
  const { t } = useI18n();

  const categoryMap = new Map<string, CategoryTotal>();

  for (const entry of entries) {
    if (!entry.category_id || !entry.duration_minutes) continue;
    const existing = categoryMap.get(entry.category_id);
    if (existing) {
      existing.minutes += entry.duration_minutes;
    } else {
      categoryMap.set(entry.category_id, {
        id: entry.category_id,
        name: entry.category?.name ?? '—',
        color: entry.category?.color ?? colors.textTertiary,
        minutes: entry.duration_minutes,
      });
    }
  }

  const totals = Array.from(categoryMap.values()).sort(
    (a, b) => b.minutes - a.minutes,
  );
  const totalMinutes = totals.reduce((sum, c) => sum + c.minutes, 0);

  if (totals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('hr_categoryBreakdown')}</Text>

      {/* Stacked bar */}
      <View style={styles.stackedBar}>
        {totals.map((cat) => (
          <View
            key={cat.id}
            style={[
              styles.barSegment,
              {
                flex: cat.minutes,
                backgroundColor: cat.color,
              },
            ]}
          />
        ))}
      </View>

      {/* Legend */}
      {totals.map((cat) => {
        const pct = totalMinutes > 0 ? Math.round((cat.minutes / totalMinutes) * 100) : 0;
        return (
          <View key={cat.id} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
            <Text style={styles.legendName} numberOfLines={1}>
              {cat.name}
            </Text>
            <Text style={styles.legendValue}>
              {formatMinutes(cat.minutes)} ({pct}%)
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  barSegment: {
    minWidth: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: spacing.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  legendValue: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
});
