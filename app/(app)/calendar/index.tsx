import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import { useAppointments } from '../../../lib/api/calendar';
import type { Appointment } from '../../../lib/api/calendar';
import { Card } from '../../../components/ui/Card';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FocusBanner } from '../../../components/calendar/FocusBanner';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

const TYPE_COLORS: Record<string, string> = {
  visit: '#0a84ff',
  call: '#30d158',
  meeting: '#bf5af2',
  other: '#636366',
};

const WEEKDAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getWeekdays(locale: string) {
  if (locale === 'es') return WEEKDAYS_ES;
  if (locale === 'en') return WEEKDAYS_EN;
  return WEEKDAYS_DE;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Monday=0, Sunday=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function formatMonthYear(year: number, month: number, locale: string) {
  const d = new Date(year, month, 1);
  const localeCode = locale === 'de' ? 'de-DE' : locale === 'es' ? 'es-ES' : 'en-GB';
  return d.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' });
}

function AppointmentItem({
  appt,
  t,
  formatDate,
}: {
  appt: Appointment;
  t: (key: string) => string;
  formatDate: (d: string | Date, opts?: Intl.DateTimeFormatOptions) => string;
}) {
  const typeColor = TYPE_COLORS[appt.type] || TYPE_COLORS.other;
  const startAt = appt.start_at;
  const time = startAt
    ? new Date(startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Card
      onPress={() =>
        router.push({
          pathname: '/(app)/calendar/appointment',
          params: { id: appt.id },
        })
      }
      style={styles.apptCard}
    >
      <View style={styles.apptRow}>
        <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
        <View style={styles.apptInfo}>
          <Text style={styles.apptTitle} numberOfLines={1}>
            {appt.title}
          </Text>
          <View style={styles.apptMeta}>
            {time ? <Text style={styles.apptTime}>{time}</Text> : null}
            <Text style={styles.apptType}>{t(`calendar_type_${appt.type}`)}</Text>
          </View>
          {appt.location ? (
            <Text style={styles.apptLocation} numberOfLines={1}>
              {appt.location}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Card>
  );
}

export default function CalendarScreen() {
  const { t, locale, formatDate } = useI18n();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const { data: appointments, isLoading } = useAppointments(monthStr);

  // Map day number → appointments
  const dayAppointments = useMemo(() => {
    const map: Record<number, Appointment[]> = {};
    for (const appt of appointments ?? []) {
      const dateStr = appt.start_at || appt.date;
      if (!dateStr) continue;
      const d = new Date(dateStr);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(appt);
      }
    }
    return map;
  }, [appointments, year, month]);

  const days = useMemo(() => getMonthDays(year, month), [year, month]);
  const weekdays = getWeekdays(locale);
  const selectedAppointments = dayAppointments[selectedDay] ?? [];

  const goToPrevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
    setSelectedDay(1);
  };

  const goToNextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
    setSelectedDay(1);
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(today.getDate());
  };

  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          headerTitle: t('calendar_title'),
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(app)/calendar/appointment',
                  params: { date: `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}` },
                })
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add-outline" size={26} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Active focus / deep-work banner */}
      <FocusBanner appointments={appointments} />

      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPrevMonth}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday}>
          <Text style={styles.monthTitle}>
            {formatMonthYear(year, month, locale)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextMonth}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Calendar grid */}
      <Card style={styles.calendarCard}>
        <View style={styles.weekdayRow}>
          {weekdays.map((wd) => (
            <Text key={wd} style={styles.weekdayText}>{wd}</Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {days.map((day, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayCell,
                day === selectedDay && styles.dayCellSelected,
                day !== null && isToday(day) && styles.dayCellToday,
              ]}
              onPress={() => day && setSelectedDay(day)}
              disabled={!day}
            >
              {day ? (
                <>
                  <Text
                    style={[
                      styles.dayText,
                      day === selectedDay && styles.dayTextSelected,
                      isToday(day) && day !== selectedDay && styles.dayTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                  {dayAppointments[day] && (
                    <View style={styles.dotRow}>
                      {dayAppointments[day].slice(0, 3).map((a, j) => (
                        <View
                          key={j}
                          style={[
                            styles.apptDot,
                            { backgroundColor: TYPE_COLORS[a.type] || TYPE_COLORS.other },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Appointments for selected day */}
      <Text style={styles.sectionHeader}>
        {formatDate(new Date(year, month, selectedDay), {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </Text>

      {isLoading ? (
        <LoadingScreen />
      ) : selectedAppointments.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={t('calendar_noAppointments')}
        />
      ) : (
        selectedAppointments.map((appt) => (
          <AppointmentItem
            key={appt.id}
            appt={appt}
            t={t}
            formatDate={formatDate}
          />
        ))
      )}
    </ScrollView>
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  monthTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textTransform: 'capitalize',
  },
  calendarCard: {
    marginBottom: spacing.md,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textTertiary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  apptDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionHeader: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  apptCard: {
    marginBottom: spacing.sm,
  },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  apptInfo: {
    flex: 1,
  },
  apptTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  apptMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  apptTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  apptType: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  apptLocation: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
