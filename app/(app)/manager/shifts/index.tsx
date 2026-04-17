import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useI18n } from '../../../../lib/i18n';
import { useTeamShifts, useTeamMembers } from '../../../../lib/api/manager-shifts';
import type { Shift, TeamMember } from '../../../../lib/api/manager-shifts';
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

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getMonday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = r.getDate() - day + (day === 0 ? -6 : 1);
  r.setDate(diff);
  return r;
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'error'> = {
  planned: 'default',
  appeared: 'success',
  absent: 'error',
};

function calcNetHours(start: string, end: string, breakMin: number | null): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const totalMin = eh * 60 + em - (sh * 60 + sm) - (breakMin || 0);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

export default function ShiftPlanningScreen() {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [employeeFilter, setEmployeeFilter] = useState('');

  const monday = getMonday(selectedDate);
  const dateFrom = viewMode === 'day' ? formatDate(selectedDate) : formatDate(monday);
  const dateTo = viewMode === 'day' ? formatDate(selectedDate) : formatDate(addDays(monday, 6));

  const { data: shifts, isLoading: shiftsLoading } = useTeamShifts(dateFrom, dateTo);
  const { data: members, isLoading: membersLoading } = useTeamMembers();

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (!employeeFilter) return members;
    const q = employeeFilter.toLowerCase();
    return members.filter((m) => m.full_name.toLowerCase().includes(q));
  }, [members, employeeFilter]);

  const shiftsByUserDate = useMemo(() => {
    const map: Record<string, Shift> = {};
    for (const s of shifts ?? []) {
      map[`${s.user_id}_${s.date}`] = s;
    }
    return map;
  }, [shifts]);

  const weekDays = useMemo(() => {
    const days: { date: Date; label: string; key: string }[] = [];
    const dayKeys = ['shifts_mon', 'shifts_tue', 'shifts_wed', 'shifts_thu', 'shifts_fri', 'shifts_sat', 'shifts_sun'];
    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i);
      days.push({ date: d, label: t(dayKeys[i]), key: formatDate(d) });
    }
    return days;
  }, [monday, t]);

  const navigate = useCallback(
    (dir: number) => {
      setSelectedDate((prev) => addDays(prev, viewMode === 'day' ? dir : dir * 7));
    },
    [viewMode],
  );

  if (shiftsLoading || membersLoading) return <LoadingScreen />;

  const dateLabel = viewMode === 'day'
    ? selectedDate.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
    : `${monday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} – ${addDays(monday, 6).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('shifts_title'),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(app)/manager/shifts/create')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* View toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'day' && styles.toggleActive]}
          onPress={() => setViewMode('day')}
        >
          <Text style={[styles.toggleText, viewMode === 'day' && styles.toggleTextActive]}>
            {t('shifts_dayView')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'week' && styles.toggleActive]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>
            {t('shifts_weekView')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => navigate(-1)}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
        <TouchableOpacity onPress={() => navigate(1)}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Employee filter */}
      <View style={styles.filterRow}>
        <SearchBar
          value={employeeFilter}
          onChangeText={setEmployeeFilter}
          placeholder={t('shifts_filterEmployees')}
        />
      </View>

      {viewMode === 'day' ? (
        <DayView
          members={filteredMembers}
          shiftsByUserDate={shiftsByUserDate}
          date={formatDate(selectedDate)}
          t={t}
        />
      ) : (
        <WeekView
          members={filteredMembers}
          shiftsByUserDate={shiftsByUserDate}
          weekDays={weekDays}
          t={t}
        />
      )}
    </View>
  );
}

function DayView({
  members,
  shiftsByUserDate,
  date,
  t,
}: {
  members: TeamMember[];
  shiftsByUserDate: Record<string, Shift>;
  date: string;
  t: (key: string) => string;
}) {
  return (
    <FlatList
      data={members}
      keyExtractor={(m) => m.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item: member }) => {
        const shift = shiftsByUserDate[`${member.id}_${date}`];
        return (
          <Card
            style={styles.shiftCard}
            onPress={() =>
              shift
                ? router.push({ pathname: '/(app)/manager/shifts/edit', params: { id: shift.id, date, userId: member.id } })
                : router.push({ pathname: '/(app)/manager/shifts/create', params: { date, userId: member.id } })
            }
          >
            <View style={styles.shiftRow}>
              <View style={styles.shiftInfo}>
                <Text style={styles.memberName}>{member.full_name}</Text>
                <Text style={styles.memberRole}>{member.position || member.role}</Text>
              </View>
              {shift ? (
                <View style={styles.shiftDetails}>
                  <Text style={styles.shiftTime}>
                    {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)}
                  </Text>
                  <View style={styles.shiftMeta}>
                    <Badge
                      label={t(`shifts_status_${shift.status}`)}
                      variant={STATUS_VARIANT[shift.status] || 'default'}
                      size="sm"
                    />
                    <Text style={styles.netHours}>
                      {calcNetHours(shift.start_time, shift.end_time, shift.break_minutes)} {t('shifts_netHours')}
                    </Text>
                  </View>
                  {shift.location && (
                    <Text style={styles.shiftLocation}>{shift.location}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.noShift}>{t('shifts_noShift')}</Text>
              )}
            </View>
          </Card>
        );
      }}
    />
  );
}

function WeekView({
  members,
  shiftsByUserDate,
  weekDays,
  t,
}: {
  members: TeamMember[];
  shiftsByUserDate: Record<string, Shift>;
  weekDays: { date: Date; label: string; key: string }[];
  t: (key: string) => string;
}) {
  const COL_WIDTH = 100;
  const NAME_COL = 120;

  return (
    <ScrollView style={styles.weekContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header row */}
          <View style={styles.weekHeaderRow}>
            <View style={[styles.weekNameCell, { width: NAME_COL }]}>
              <Text style={styles.weekHeaderText}>{t('shifts_employee')}</Text>
            </View>
            {weekDays.map((d) => (
              <View key={d.key} style={[styles.weekDayCell, { width: COL_WIDTH }]}>
                <Text style={styles.weekDayLabel}>{d.label}</Text>
                <Text style={styles.weekDayDate}>{d.date.getDate()}</Text>
              </View>
            ))}
          </View>

          {/* Employee rows */}
          {members.map((member) => (
            <View key={member.id} style={styles.weekRow}>
              <View style={[styles.weekNameCell, { width: NAME_COL }]}>
                <Text style={styles.weekMemberName} numberOfLines={1}>{member.full_name}</Text>
              </View>
              {weekDays.map((d) => {
                const shift = shiftsByUserDate[`${member.id}_${d.key}`];
                return (
                  <TouchableOpacity
                    key={d.key}
                    style={[styles.weekShiftCell, { width: COL_WIDTH }]}
                    onPress={() =>
                      shift
                        ? router.push({ pathname: '/(app)/manager/shifts/edit', params: { id: shift.id, date: d.key, userId: member.id } })
                        : router.push({ pathname: '/(app)/manager/shifts/create', params: { date: d.key, userId: member.id } })
                    }
                  >
                    {shift ? (
                      <View style={[styles.weekShiftPill, { backgroundColor: shift.status === 'absent' ? colors.errorLight : colors.infoLight }]}>
                        <Text style={styles.weekShiftTime} numberOfLines={1}>
                          {shift.start_time?.slice(0, 5)}
                        </Text>
                        <Text style={styles.weekShiftTime} numberOfLines={1}>
                          {shift.end_time?.slice(0, 5)}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.weekEmpty}>—</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toggleRow: {
    flexDirection: 'row',
    margin: spacing.md,
    marginBottom: 0,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: 2,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  toggleActive: { backgroundColor: colors.surface },
  toggleText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  toggleTextActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  filterRow: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  listContent: { padding: spacing.md, paddingTop: 0 },
  shiftCard: { marginBottom: spacing.sm },
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  shiftInfo: { flex: 1 },
  memberName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  memberRole: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  shiftDetails: { alignItems: 'flex-end' },
  shiftTime: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.primary },
  shiftMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  netHours: { fontSize: fontSize.xs, color: colors.textSecondary },
  shiftLocation: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  noShift: { fontSize: fontSize.sm, color: colors.textTertiary, fontStyle: 'italic' },
  // Week view
  weekContainer: { flex: 1 },
  weekHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  weekNameCell: {
    padding: spacing.sm,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  weekHeaderText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  weekDayCell: {
    padding: spacing.sm,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  weekDayLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  weekDayDate: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  weekRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    minHeight: 56,
  },
  weekMemberName: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.text },
  weekShiftCell: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  weekShiftPill: {
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    alignItems: 'center',
    width: '100%',
  },
  weekShiftTime: { fontSize: 10, fontWeight: fontWeight.medium, color: colors.primary },
  weekEmpty: { fontSize: fontSize.xs, color: colors.textTertiary },
});
