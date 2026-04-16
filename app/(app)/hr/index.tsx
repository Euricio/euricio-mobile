import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/authStore';
import {
  useMyShiftToday,
  useTeamSummary,
  useMyTimeEntriesToday,
  useTimeEntriesForDate,
  TimeEntryWithCategory,
} from '../../../lib/api/hr';
import { useTasks, Task } from '../../../lib/api/tasks';
import { useProfile } from '../../../lib/api/profile';
import { useTimeEntryRealtime } from '../../../lib/realtime/useTimeEntryRealtime';
import { ClockWidget } from '../../../components/hr/ClockWidget';
import { DaySummaryCard } from '../../../components/hr/DaySummaryCard';
import { EditTimeEntryModal } from '../../../components/hr/EditTimeEntryModal';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../constants/theme';

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

export default function HRHomeScreen() {
  const { t, formatDate } = useI18n();
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfile();
  const { data: shiftInfo, refetch: refetchShift } = useMyShiftToday();
  const { data: tasks, refetch: refetchTasks } = useTasks();
  const { data: summary, refetch: refetchSummary } = useTeamSummary();
  const { data: todayEntries = [], refetch: refetchEntries } = useMyTimeEntriesToday();

  // ── Real-time sync: instant updates from web CRM ──
  useTimeEntryRealtime(user?.id);

  const todayStr = useMemo(() => toDateString(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isToday = selectedDate === todayStr;

  // Fetch entries for the selected date (when not today)
  const { data: selectedDateEntries = [] } = useTimeEntriesForDate(
    isToday ? '' : selectedDate,
  );

  const displayEntries = isToday ? todayEntries : selectedDateEntries;

  // Edit modal state
  const [editEntry, setEditEntry] = useState<TimeEntryWithCategory | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const isManager = profile?.role === 'admin' || profile?.role === 'manager_agent';

  // My open tasks
  const myTasks = (tasks ?? [])
    .filter((t: Task) => t.assigned_to === user?.id && t.status !== 'done')
    .slice(0, 5);

  const onRefresh = () => {
    refetchShift();
    refetchTasks();
    refetchSummary();
    refetchEntries();
  };

  const handleDateNav = (direction: -1 | 1) => {
    setSelectedDate((prev) => addDays(prev, direction));
  };

  const handleEntryTap = (entry: TimeEntryWithCategory) => {
    setEditEntry(entry);
    setEditModalVisible(true);
  };

  const selectedDateObj = new Date(selectedDate + 'T12:00:00');

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Stack.Screen options={{ headerTitle: t('hr_myDay') }} />

        {/* Date navigation */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={() => handleDateNav(-1)} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedDate(todayStr)}>
            <Text style={styles.dateNavText}>
              {isToday
                ? t('hr_today')
                : formatDate(selectedDateObj, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'long',
                  })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDateNav(1)}
            hitSlop={8}
            disabled={isToday}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={isToday ? colors.textTertiary : colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Today's date subtitle */}
        <Text style={styles.date}>
          {formatDate(selectedDateObj, { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {/* Clock In/Out Widget — only on today */}
        {isToday && <ClockWidget />}

        {/* Past day summary card */}
        {!isToday && <DaySummaryCard entries={displayEntries} />}

        {/* Activity Timeline */}
        {displayEntries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {isToday ? t('hr_todayTimeline') : t('hr_categoryBreakdown')}
            </Text>
            <Card padded={false} style={styles.timelineCard}>
              {displayEntries.map((entry: TimeEntryWithCategory, index: number) => {
                const catColor = entry.category?.color ?? colors.textTertiary;
                const catName = entry.category?.name ?? '—';
                const startTime = entry.started_at
                  ? new Date(entry.started_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';
                const endTime = entry.ended_at
                  ? new Date(entry.ended_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '...';
                const durationMin = entry.duration_minutes ?? 0;
                const durationLabel =
                  entry.status === 'running'
                    ? '...'
                    : `${Math.floor(durationMin / 60)}h ${(durationMin % 60).toString().padStart(2, '0')}m`;

                return (
                  <TouchableOpacity
                    key={entry.id}
                    style={[
                      styles.timelineItem,
                      index < displayEntries.length - 1 && styles.timelineBorder,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleEntryTap(entry)}
                  >
                    <View style={[styles.timelineBar, { backgroundColor: catColor }]} />
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineCatName, { color: catColor }]}>
                        {catName}
                      </Text>
                      <Text style={styles.timelineTime}>
                        {startTime} – {endTime}
                        {entry.status === 'completed' && `  (${durationLabel})`}
                      </Text>
                      {entry.note ? (
                        <Text style={styles.timelineNote} numberOfLines={1}>
                          {entry.note}
                        </Text>
                      ) : null}
                    </View>
                    {entry.status === 'running' ? (
                      <View style={[styles.runningDot, { backgroundColor: catColor }]} />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.textTertiary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </Card>
          </>
        )}

        {/* Today's Shift Info — only on today */}
        {isToday && shiftInfo && (
          <Card style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.info} />
              <Text style={styles.shiftTitle}>{t('hr_todayShift')}</Text>
            </View>
            <View style={styles.shiftDetails}>
              <View style={styles.shiftRow}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.shiftText}>
                  {shiftInfo.data.start_time?.slice(0, 5)} – {shiftInfo.data.end_time?.slice(0, 5)}
                </Text>
              </View>
              {'location' in shiftInfo.data && shiftInfo.data.location && (
                <View style={styles.shiftRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.shiftText}>{shiftInfo.data.location}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {isToday && !shiftInfo && (
          <Card style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.textTertiary} />
              <Text style={styles.noShiftText}>{t('hr_noShiftToday')}</Text>
            </View>
          </Card>
        )}

        {/* My Tasks — only on today */}
        {isToday && myTasks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('hr_myTasks')}</Text>
            <Card padded={false}>
              {myTasks.map((task: Task, index: number) => (
                <View
                  key={task.id}
                  style={[
                    styles.taskItem,
                    index < myTasks.length - 1 && styles.taskBorder,
                  ]}
                >
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle} numberOfLines={1}>
                      {task.title}
                    </Text>
                    {task.due_date && (
                      <Text
                        style={[
                          styles.taskDue,
                          new Date(task.due_date) < new Date() && styles.taskOverdue,
                        ]}
                      >
                        {formatDate(task.due_date, { day: '2-digit', month: '2-digit' })}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('quickAccess')}</Text>
        <View style={styles.quickActionsRow}>
          <QuickAction
            icon="bar-chart-outline"
            label={t('hr_report')}
            color={colors.info}
            onPress={() => router.push('/(app)/hr/time-report')}
          />
          <QuickAction
            icon="people-outline"
            label={t('hr_teamTitle')}
            color={colors.primary}
            onPress={() => router.push('/(app)/hr/team')}
          />
          <QuickAction
            icon="document-text-outline"
            label={t('hr_requests')}
            color={colors.accent}
            onPress={() => router.push('/(app)/hr/requests')}
          />
          {isManager && (
            <QuickAction
              icon="shield-checkmark-outline"
              label={t('hr_manageRequests')}
              color={colors.success}
              onPress={() => router.push('/(app)/hr/manage-requests')}
              badge={summary?.pendingRequests}
            />
          )}
        </View>
      </ScrollView>

      <EditTimeEntryModal
        visible={editModalVisible}
        entry={editEntry}
        onClose={() => {
          setEditModalVisible(false);
          setEditEntry(null);
        }}
      />
    </>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionLabel} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
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
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  dateNavText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  timelineCard: {
    marginBottom: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  timelineBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  timelineBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: spacing.sm + 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineCatName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  timelineTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timelineNote: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  runningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shiftCard: {
    marginBottom: spacing.md,
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shiftTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  noShiftText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  shiftDetails: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shiftText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  taskItem: {
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  taskBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  taskContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  taskDue: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  taskOverdue: {
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    ...shadow.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});
