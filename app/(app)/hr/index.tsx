import React from 'react';
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
import { useMyShiftToday, useTeamSummary, useMyTimeEntriesToday, TimeEntryWithCategory } from '../../../lib/api/hr';
import { useTasks, Task } from '../../../lib/api/tasks';
import { useProfile } from '../../../lib/api/profile';
import { ClockWidget } from '../../../components/hr/ClockWidget';
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

export default function HRHomeScreen() {
  const { t, formatDate } = useI18n();
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfile();
  const { data: shiftInfo, refetch: refetchShift } = useMyShiftToday();
  const { data: tasks, refetch: refetchTasks } = useTasks();
  const { data: summary, refetch: refetchSummary } = useTeamSummary();
  const { data: todayEntries = [], refetch: refetchEntries } = useMyTimeEntriesToday();

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <Stack.Screen options={{ headerTitle: t('hr_myDay') }} />

      {/* Today's date */}
      <Text style={styles.date}>
        {formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>

      {/* Clock In/Out Widget */}
      <ClockWidget />

      {/* Today's Activity Timeline */}
      {todayEntries.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('hr_todayTimeline')}</Text>
          <Card padded={false} style={styles.timelineCard}>
            {todayEntries.map((entry: TimeEntryWithCategory, index: number) => {
              const catColor = entry.category?.color ?? colors.textTertiary;
              const catName = entry.category?.name ?? '—';
              const startTime = entry.started_at
                ? new Date(entry.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
              const endTime = entry.ended_at
                ? new Date(entry.ended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '...';
              const durationMin = entry.duration_minutes ?? 0;
              const durationLabel = entry.status === 'running'
                ? '...'
                : `${Math.floor(durationMin / 60)}h ${(durationMin % 60).toString().padStart(2, '0')}m`;

              return (
                <View
                  key={entry.id}
                  style={[
                    styles.timelineItem,
                    index < todayEntries.length - 1 && styles.timelineBorder,
                  ]}
                >
                  <View style={[styles.timelineBar, { backgroundColor: catColor }]} />
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineCatName, { color: catColor }]}>{catName}</Text>
                    <Text style={styles.timelineTime}>
                      {startTime} – {endTime}
                      {entry.status === 'completed' && `  (${durationLabel})`}
                    </Text>
                  </View>
                  {entry.status === 'running' && (
                    <View style={[styles.runningDot, { backgroundColor: catColor }]} />
                  )}
                </View>
              );
            })}
          </Card>
        </>
      )}

      {/* Today's Shift Info */}
      {shiftInfo && (
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

      {!shiftInfo && (
        <Card style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <Ionicons name="calendar-outline" size={18} color={colors.textTertiary} />
            <Text style={styles.noShiftText}>{t('hr_noShiftToday')}</Text>
          </View>
        </Card>
      )}

      {/* My Tasks */}
      {myTasks.length > 0 && (
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
                  <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                  {task.due_date && (
                    <Text style={[
                      styles.taskDue,
                      new Date(task.due_date) < new Date() && styles.taskOverdue,
                    ]}>
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
      <Text style={styles.quickActionLabel} numberOfLines={2}>{label}</Text>
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
