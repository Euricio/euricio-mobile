import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useI18n } from '../../../../lib/i18n';
import { useTimecheckData } from '../../../../lib/api/manager-timecheck';
import type { TimecheckShift, TimeEntry, TimecheckMember } from '../../../../lib/api/manager-timecheck';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../../constants/theme';

function formatDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function calcHoursFromShift(shift: TimecheckShift): number {
  const [sh, sm] = shift.start_time.split(':').map(Number);
  const [eh, em] = shift.end_time.split(':').map(Number);
  const totalMin = eh * 60 + em - (sh * 60 + sm) - (shift.break_minutes || 0);
  return totalMin / 60;
}

function calcHoursFromEntries(entries: TimeEntry[]): number {
  let total = 0;
  for (const e of entries) {
    if (e.duration_minutes) {
      total += e.duration_minutes - (e.break_minutes || 0);
    } else if (e.started_at && e.ended_at) {
      const start = new Date(e.started_at).getTime();
      const end = new Date(e.ended_at).getTime();
      total += (end - start) / 60000 - (e.break_minutes || 0);
    }
  }
  return total / 60;
}

function getDeltaColor(delta: number): string {
  const abs = Math.abs(delta);
  if (abs <= 0.25) return colors.success;
  if (abs <= 1) return colors.warning;
  return colors.error;
}

function formatHours(h: number): string {
  return h.toFixed(1);
}

export default function TimecheckScreen() {
  const { t } = useI18n();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = formatDateStr(selectedDate);

  const { data, isLoading } = useTimecheckData(dateStr);

  const memberData = useMemo(() => {
    if (!data) return [];
    return data.members.map((member) => {
      const memberShifts = data.shifts.filter((s) => s.user_id === member.id);
      const memberEntries = data.entries.filter((e) => e.user_id === member.id);
      const plannedHours = memberShifts.reduce((sum, s) => sum + calcHoursFromShift(s), 0);
      const actualHours = calcHoursFromEntries(memberEntries);
      const delta = actualHours - plannedHours;
      return { member, shifts: memberShifts, entries: memberEntries, plannedHours, actualHours, delta };
    });
  }, [data]);

  const dateLabel = selectedDate.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: t('timecheck_title'), headerShown: true }} />

      {/* Date navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => setSelectedDate((prev) => addDays(prev, -1))}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
        <TouchableOpacity onPress={() => setSelectedDate((prev) => addDays(prev, 1))}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {memberData.length === 0 ? (
          <Text style={styles.emptyText}>{t('timecheck_noData')}</Text>
        ) : (
          memberData.map(({ member, shifts, entries, plannedHours, actualHours, delta }) => (
            <Card key={member.id} style={styles.memberCard}>
              {/* Header */}
              <View style={styles.memberHeader}>
                <Text style={styles.memberName}>{member.full_name}</Text>
                <Badge label={member.position || member.role} variant="info" size="sm" />
              </View>

              {/* Planned */}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('timecheck_planned')}</Text>
                <View style={styles.rowValue}>
                  {shifts.length > 0 ? (
                    <>
                      <Text style={styles.timeText}>
                        {shifts.map((s) => `${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`).join(', ')}
                      </Text>
                      <Text style={styles.hoursText}>
                        {formatHours(plannedHours)} {t('timecheck_hours')}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.emptyLabel}>{t('timecheck_noShift')}</Text>
                  )}
                </View>
              </View>

              {/* Actual */}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('timecheck_actual')}</Text>
                <View style={styles.rowValue}>
                  {entries.length > 0 ? (
                    <>
                      <View style={styles.entriesRow}>
                        {entries.map((e) => (
                          <View key={e.id} style={styles.entryDot}>
                            <View
                              style={[
                                styles.categoryDot,
                                { backgroundColor: e.category?.color || colors.textTertiary },
                              ]}
                            />
                            <Text style={styles.entryTime}>
                              {e.started_at ? new Date(e.started_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}
                              {e.ended_at ? `–${new Date(e.ended_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.hoursText}>
                        {formatHours(actualHours)} {t('timecheck_hours')}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.emptyLabel}>{t('timecheck_noEntries')}</Text>
                  )}
                </View>
              </View>

              {/* Delta */}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>{t('timecheck_delta')}</Text>
                <Text style={[styles.deltaText, { color: getDeltaColor(delta) }]}>
                  {delta >= 0 ? '+' : ''}{formatHours(delta)} {t('timecheck_hours')}
                </Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  listContent: { padding: spacing.md, paddingTop: 0, paddingBottom: 120 },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  memberCard: { marginBottom: spacing.md },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  memberName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  rowLabel: {
    width: 80,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    paddingTop: 2,
  },
  rowValue: { flex: 1 },
  timeText: { fontSize: fontSize.sm, color: colors.text },
  hoursText: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  emptyLabel: { fontSize: fontSize.sm, color: colors.textTertiary, fontStyle: 'italic' },
  entriesRow: { gap: 4 },
  entryDot: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  entryTime: { fontSize: fontSize.xs, color: colors.text },
  deltaText: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
});
