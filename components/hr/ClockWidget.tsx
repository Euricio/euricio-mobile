import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMyActiveTimeEntry, useMyTimeEntriesToday, useClockIn, useClockOut } from '../../lib/api/hr';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

function formatDurationShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function useElapsedTimer(startedAt: string | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const start = new Date(startedAt).getTime();
    const update = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}

export function ClockWidget() {
  const { t } = useI18n();
  const { data: activeEntry, isLoading: loadingActive } = useMyActiveTimeEntry();
  const { data: todayEntries } = useMyTimeEntriesToday();
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  const elapsed = useElapsedTimer(activeEntry?.started_at ?? null);
  const isClockedIn = !!activeEntry;

  // Calculate today's total (in minutes for the summary row)
  const completedMinutes = (todayEntries ?? [])
    .filter((e) => e.status === 'completed' && e.duration_minutes)
    .reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);
  const elapsedMinutes = Math.floor(elapsed / 60);
  const totalMinutes = completedMinutes + (isClockedIn ? elapsedMinutes : 0);

  const handleClockIn = () => {
    clockIn.mutate();
  };

  const handleClockOut = () => {
    if (activeEntry) {
      clockOut.mutate(activeEntry.id);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={20} color={colors.primary} />
        <Text style={styles.headerText}>
          {isClockedIn ? t('hr_clockedInSince') : t('hr_workday')}
        </Text>
      </View>

      {isClockedIn && (
        <View style={styles.timerSection}>
          <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
        </View>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{t('hr_workedToday')}</Text>
        <Text style={styles.totalValue}>{formatDurationShort(totalMinutes)}</Text>
      </View>

      <View style={styles.buttonSection}>
        {isClockedIn ? (
          <Button
            title={t('hr_clockOut')}
            onPress={handleClockOut}
            variant="danger"
            loading={clockOut.isPending}
            disabled={clockOut.isPending}
            icon={<Ionicons name="stop-circle-outline" size={18} color={colors.white} />}
            size="lg"
          />
        ) : (
          <Button
            title={t('hr_clockIn')}
            onPress={handleClockIn}
            loading={clockIn.isPending || loadingActive}
            disabled={clockIn.isPending || loadingActive}
            icon={<Ionicons name="play-circle-outline" size={18} color={colors.white} />}
            size="lg"
          />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timer: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  buttonSection: {
    // full width button
  },
});
