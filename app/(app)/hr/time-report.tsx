import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useTimeEntriesForDate,
  useTimeEntriesForWeek,
  TimeEntryWithCategory,
} from '../../../lib/api/hr';
import { CategoryBreakdown } from '../../../components/hr/CategoryBreakdown';
import { Card } from '../../../components/ui/Card';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../constants/theme';

type ViewMode = 'day' | 'week';

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

function getMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return toDateString(d);
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

const DAY_NAMES_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const TARGET_HOURS_PER_DAY = 8;
const TARGET_MINUTES_PER_DAY = TARGET_HOURS_PER_DAY * 60;

export default function TimeReportScreen() {
  const { t, formatDate } = useI18n();
  const todayStr = useMemo(() => toDateString(new Date()), []);

  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [weekStart, setWeekStart] = useState(() => getMonday(todayStr));

  // Day view data
  const { data: dayEntries = [] } = useTimeEntriesForDate(
    viewMode === 'day' ? selectedDate : '',
  );

  // Week view data
  const { data: weekEntries = [] } = useTimeEntriesForWeek(
    viewMode === 'week' ? weekStart : '',
  );

  // Day stats
  const dayStats = useMemo(() => {
    const completed = dayEntries.filter((e) => e.status === 'completed');
    const totalMinutes = completed.reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
    const totalBreaks = dayEntries.reduce(
      (s, e) => s + (e.short_break_minutes ?? 0) + (e.lunch_break_minutes ?? 0),
      0,
    );
    const net = Math.max(0, totalMinutes - totalBreaks);
    return { totalMinutes, totalBreaks, net, completed };
  }, [dayEntries]);

  // Week stats (group entries by day)
  const weekStats = useMemo(() => {
    const dayMap = new Map<string, TimeEntryWithCategory[]>();
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      dayMap.set(d, []);
    }
    for (const entry of weekEntries) {
      const existing = dayMap.get(entry.date);
      if (existing) {
        existing.push(entry);
      }
    }

    let weekTotal = 0;
    let weekBreaks = 0;
    const days = Array.from(dayMap.entries()).map(([date, entries]) => {
      const completed = entries.filter((e) => e.status === 'completed');
      const minutes = completed.reduce((s, e) => s + (e.duration_minutes ?? 0), 0);
      const breaks = entries.reduce(
        (s, e) => s + (e.short_break_minutes ?? 0) + (e.lunch_break_minutes ?? 0),
        0,
      );
      const net = Math.max(0, minutes - breaks);
      weekTotal += net;
      weekBreaks += breaks;
      return { date, minutes, breaks, net, entries };
    });

    const weekTarget = 5 * TARGET_MINUTES_PER_DAY; // Mon-Fri
    return { days, weekTotal, weekBreaks, weekTarget };
  }, [weekEntries, weekStart]);

  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const weekEndStr = addDays(weekStart, 6);
  const weekStartObj = new Date(weekStart + 'T12:00:00');
  const weekEndObj = new Date(weekEndStr + 'T12:00:00');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('hr_report') }} />

      {/* View mode toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'day' && styles.toggleActive]}
          onPress={() => setViewMode('day')}
        >
          <Text
            style={[styles.toggleText, viewMode === 'day' && styles.toggleTextActive]}
          >
            {t('hr_dayView')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'week' && styles.toggleActive]}
          onPress={() => setViewMode('week')}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === 'week' && styles.toggleTextActive,
            ]}
          >
            {t('hr_weekView')}
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'day' ? (
        <>
          {/* Day date navigation */}
          <View style={styles.dateNav}>
            <TouchableOpacity onPress={() => setSelectedDate(addDays(selectedDate, -1))}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedDate(todayStr)}>
              <Text style={styles.dateNavText}>
                {selectedDate === todayStr
                  ? t('hr_today')
                  : formatDate(selectedDateObj, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                    })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedDate(addDays(selectedDate, 1))}
              disabled={selectedDate === todayStr}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={selectedDate === todayStr ? colors.textTertiary : colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Day stats card */}
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <StatBox label={t('hr_actualHours')} value={formatMinutes(dayStats.totalMinutes)} />
              <StatBox label={t('hr_totalBreaks')} value={formatMinutes(dayStats.totalBreaks)} />
              <StatBox
                label={t('hr_netWorkTime')}
                value={formatMinutes(dayStats.net)}
                color={dayStats.net >= TARGET_MINUTES_PER_DAY ? colors.success : colors.error}
              />
            </View>

            {/* Target bar */}
            <View style={styles.targetSection}>
              <View style={styles.targetLabelRow}>
                <Text style={styles.targetLabel}>{t('hr_targetHours')}</Text>
                <Text style={styles.targetLabel}>
                  {TARGET_HOURS_PER_DAY}h
                </Text>
              </View>
              <View style={styles.targetBar}>
                <View
                  style={[
                    styles.targetFill,
                    {
                      flex: Math.min(dayStats.net / TARGET_MINUTES_PER_DAY, 1.5) || 0,
                      backgroundColor:
                        dayStats.net >= TARGET_MINUTES_PER_DAY
                          ? colors.success
                          : colors.error,
                    },
                  ]}
                />
                <View
                  style={{
                    flex: Math.max(
                      0,
                      1 - Math.min(dayStats.net / TARGET_MINUTES_PER_DAY, 1),
                    ),
                  }}
                />
              </View>
            </View>

            {/* Category breakdown */}
            <CategoryBreakdown entries={dayStats.completed} />
          </Card>

          {/* Day entries list */}
          {dayEntries.length > 0 ? (
            <Card padded={false} style={styles.entriesCard}>
              {dayEntries.map((entry, index) => (
                <View
                  key={entry.id}
                  style={[
                    styles.entryItem,
                    index < dayEntries.length - 1 && styles.entryBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.entryBar,
                      { backgroundColor: entry.category?.color ?? colors.textTertiary },
                    ]}
                  />
                  <View style={styles.entryContent}>
                    <Text
                      style={[
                        styles.entryCatName,
                        { color: entry.category?.color ?? colors.textTertiary },
                      ]}
                    >
                      {entry.category?.name ?? '—'}
                    </Text>
                    <Text style={styles.entryTime}>
                      {entry.started_at
                        ? new Date(entry.started_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}{' '}
                      –{' '}
                      {entry.ended_at
                        ? new Date(entry.ended_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '...'}
                    </Text>
                    {entry.note ? (
                      <Text style={styles.entryNote} numberOfLines={1}>
                        {entry.note}
                      </Text>
                    ) : null}
                  </View>
                  {entry.duration_minutes != null && (
                    <Text style={styles.entryDuration}>
                      {formatMinutes(entry.duration_minutes)}
                    </Text>
                  )}
                </View>
              ))}
            </Card>
          ) : (
            <Text style={styles.noEntries}>{t('hr_noEntriesThisDay')}</Text>
          )}
        </>
      ) : (
        <>
          {/* Week date navigation */}
          <View style={styles.dateNav}>
            <TouchableOpacity onPress={() => setWeekStart(addDays(weekStart, -7))}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.dateNavText}>
              {formatDate(weekStartObj, { day: 'numeric', month: 'short' })} –{' '}
              {formatDate(weekEndObj, { day: 'numeric', month: 'short' })}
            </Text>
            <TouchableOpacity
              onPress={() => setWeekStart(addDays(weekStart, 7))}
              disabled={weekStart === getMonday(todayStr)}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={
                  weekStart === getMonday(todayStr) ? colors.textTertiary : colors.primary
                }
              />
            </TouchableOpacity>
          </View>

          {/* Weekly summary */}
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <StatBox
                label={t('hr_weekTotal')}
                value={formatMinutes(weekStats.weekTotal)}
              />
              <StatBox
                label={t('hr_totalBreaks')}
                value={formatMinutes(weekStats.weekBreaks)}
              />
              <StatBox
                label={t('hr_targetHours')}
                value="40h"
                color={
                  weekStats.weekTotal >= weekStats.weekTarget
                    ? colors.success
                    : colors.textSecondary
                }
              />
            </View>

            {/* Weekly target bar */}
            <View style={styles.targetSection}>
              <View style={styles.targetLabelRow}>
                <Text style={styles.targetLabel}>
                  {t('hr_actualHours')} / {t('hr_targetHours')}
                </Text>
                <Text style={styles.targetLabel}>
                  {formatMinutes(weekStats.weekTotal)} / 40h
                </Text>
              </View>
              <View style={styles.targetBar}>
                <View
                  style={[
                    styles.targetFill,
                    {
                      flex:
                        Math.min(
                          weekStats.weekTotal / weekStats.weekTarget,
                          1.5,
                        ) || 0,
                      backgroundColor:
                        weekStats.weekTotal >= weekStats.weekTarget
                          ? colors.success
                          : colors.error,
                    },
                  ]}
                />
                <View
                  style={{
                    flex: Math.max(
                      0,
                      1 -
                        Math.min(weekStats.weekTotal / weekStats.weekTarget, 1),
                    ),
                  }}
                />
              </View>
            </View>

            {/* Category breakdown for entire week */}
            <CategoryBreakdown
              entries={weekEntries.filter((e) => e.status === 'completed')}
            />
          </Card>

          {/* Daily bars */}
          <Card style={styles.weekDaysCard}>
            {weekStats.days.map(({ date, net }, i) => {
              const isWeekend = i >= 5;
              const target = isWeekend ? 0 : TARGET_MINUTES_PER_DAY;
              const ratio = target > 0 ? Math.min(net / target, 1.5) : net > 0 ? 1 : 0;
              const isOnTarget = net >= target && target > 0;
              const dateObj = new Date(date + 'T12:00:00');

              return (
                <View key={date} style={styles.weekDayRow}>
                  <Text style={styles.weekDayLabel}>{DAY_NAMES_SHORT[i]}</Text>
                  <Text style={styles.weekDayDate}>
                    {dateObj.getDate().toString().padStart(2, '0')}
                  </Text>
                  <View style={styles.weekDayBarContainer}>
                    {ratio > 0 ? (
                      <View
                        style={[
                          styles.weekDayBarFill,
                          {
                            flex: Math.min(ratio, 1),
                            backgroundColor: isOnTarget
                              ? colors.success
                              : isWeekend
                                ? colors.info
                                : colors.error,
                          },
                        ]}
                      />
                    ) : null}
                    <View style={{ flex: Math.max(0, 1 - Math.min(ratio, 1)) }} />
                  </View>
                  <Text style={styles.weekDayHours}>
                    {net > 0 ? formatMinutes(net) : '—'}
                  </Text>
                </View>
              );
            })}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  toggleActive: {
    backgroundColor: colors.surface,
    ...shadow.sm,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateNavText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  statsCard: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statBox: {
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
  targetSection: {
    marginBottom: spacing.sm,
  },
  targetLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  targetLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
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
  entriesCard: {
    marginBottom: spacing.md,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  entryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  entryBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: spacing.sm + 4,
  },
  entryContent: {
    flex: 1,
  },
  entryCatName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  entryTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  entryNote: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  entryDuration: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  noEntries: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    paddingVertical: spacing.xl,
  },
  weekDaysCard: {
    marginBottom: spacing.md,
  },
  weekDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  weekDayLabel: {
    width: 24,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  weekDayDate: {
    width: 24,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  weekDayBarContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 10,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  weekDayBarFill: {
    borderRadius: borderRadius.sm,
  },
  weekDayHours: {
    width: 60,
    textAlign: 'right',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
});
