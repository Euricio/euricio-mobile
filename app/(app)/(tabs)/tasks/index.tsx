import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTasks, useCompleteTask, Task } from '../../../../lib/api/tasks';
import { useAuthStore } from '../../../../store/authStore';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Avatar } from '../../../../components/ui/Avatar';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { useI18n } from '../../../../lib/i18n';
import { useCallChoice } from '../../../../lib/call/useCallChoice';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';

const priorityVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  urgent: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const priorityKeys: Record<string, string> = {
  urgent: 'priority_urgent',
  high: 'priority_high',
  medium: 'priority_medium',
  low: 'priority_low',
};

const typeKeys: Record<string, string> = {
  callback: 'task_type_callback',
  follow_up: 'task_type_follow_up',
  meeting: 'task_type_meeting',
  general: 'task_type_general',
};

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function TaskCard({
  task,
  onComplete,
  onCall,
}: {
  task: Task;
  onComplete: () => void;
  onCall: (phone: string) => void;
}) {
  const { t, formatDate } = useI18n();
  const priorityKey = priorityKeys[task.priority];
  const priority = {
    label: priorityKey ? t(priorityKey) : task.priority,
    variant: priorityVariants[task.priority] ?? ('default' as const),
  };
  const overdue = isOverdue(task.due_date) && task.status !== 'done';
  const isCallback = task.task_type === 'callback';
  const isMeeting = task.task_type === 'meeting';
  const isDone = task.status === 'done';
  const leadPhone = (task.lead as any)?.phone;

  return (
    <Card style={isDone ? { ...styles.taskCard, ...styles.taskDone } : styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskLeft}>
          {/* Completion checkbox */}
          <TouchableOpacity
            onPress={onComplete}
            disabled={isDone}
            style={[
              styles.checkbox,
              isDone && styles.checkboxDone,
            ]}
          >
            {isDone && (
              <Ionicons name="checkmark" size={14} color={colors.white} />
            )}
          </TouchableOpacity>
          <View style={styles.taskContent}>
            <View style={styles.taskTitleRow}>
              {isCallback && (
                <Ionicons name="call-outline" size={14} color={colors.error} style={{ marginRight: 4 }} />
              )}
              {isMeeting && (
                <Ionicons name="calendar-outline" size={14} color="#bf5af2" style={{ marginRight: 4 }} />
              )}
              <Text
                style={[
                  styles.taskTitle,
                  isDone && styles.taskTitleDone,
                ]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
            </View>
            <View style={styles.taskMeta}>
              <Badge label={priority.label} variant={priority.variant} />
              <Text style={styles.taskType}>
                {typeKeys[task.task_type] ? t(typeKeys[task.task_type]) : task.task_type}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Due date & linked contact */}
      <View style={styles.taskFooter}>
        {task.due_date && (
          <View style={styles.dueDateRow}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={overdue ? colors.error : colors.textSecondary}
            />
            <Text
              style={[
                styles.dueDate,
                overdue && styles.dueDateOverdue,
              ]}
            >
              {overdue ? t('tasks_overdue') : ''}
              {formatDate(task.due_date, {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              })}
            </Text>
          </View>
        )}
        {task.lead?.full_name && (
          <View style={styles.linkedContact}>
            <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.linkedContactText}>{task.lead.full_name}</Text>
          </View>
        )}
        {leadPhone && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => onCall(leadPhone)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="call-outline" size={14} color={colors.success} />
            <Text style={styles.callButtonText}>{t('task_callLead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Assignee */}
      {task.assigned?.full_name && (
        <View style={styles.assigneeRow}>
          <Avatar name={task.assigned.full_name} size={20} />
          <Text style={styles.assigneeText}>{task.assigned.full_name}</Text>
        </View>
      )}
    </Card>
  );
}

export default function TasksScreen() {
  const [activeFilter, setActiveFilter] = useState('open');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'mine' | 'unassigned'>('all');
  const { data: tasks, isLoading, refetch, isRefetching } =
    useTasks(activeFilter);
  const completeTask = useCompleteTask();
  const user = useAuthStore((s) => s.user);
  const { t } = useI18n();
  const { promptCall, CallChoiceSheet } = useCallChoice();
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (highlight && tasks) {
      setHighlightedId(highlight);
      const index = tasks.findIndex((task) => task.id === highlight);
      if (index >= 0 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index, animated: true, viewOffset: 50 });
      }
      const timer = setTimeout(() => setHighlightedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlight, tasks]);

  const filters = [
    { key: 'alle', label: t('tasks_filter_all') },
    { key: 'open', label: t('tasks_filter_open') },
    { key: 'in_progress', label: t('tasks_filter_inProgress') },
    { key: 'done', label: t('tasks_filter_done') },
  ];

  const assigneeFilters = [
    { key: 'all' as const, label: t('hr_allTasks') },
    { key: 'mine' as const, label: t('hr_myTasks') },
    { key: 'unassigned' as const, label: t('hr_unassigned') },
  ];

  const filteredTasks = (tasks ?? []).filter((task) => {
    if (assigneeFilter === 'mine') return task.assigned_to === user?.id;
    if (assigneeFilter === 'unassigned') return !task.assigned_to;
    return true;
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('tasks_title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

      {/* Status Filter Tabs */}
      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab,
              activeFilter === f.key && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Assignee Filter */}
      <View style={styles.assigneeFilterContainer}>
        {assigneeFilters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.assigneeFilterTab,
              assigneeFilter === f.key && styles.assigneeFilterTabActive,
            ]}
            onPress={() => setAssigneeFilter(f.key)}
          >
            <Text
              style={[
                styles.assigneeFilterText,
                assigneeFilter === f.key && styles.assigneeFilterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: highlightedId === item.id ? '#FEF9C3' : 'transparent', borderRadius: borderRadius.md }}>
              <TaskCard
                task={item}
                onComplete={() => completeTask.mutate(item.id)}
                onCall={promptCall}
              />
            </View>
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="checkbox-outline"
              title={
                activeFilter === 'done'
                  ? t('tasks_emptyDone')
                  : t('tasks_emptyOpen')
              }
              message={
                activeFilter === 'open'
                  ? t('tasks_allDone')
                  : undefined
              }
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/(app)/(tabs)/tasks/create')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
      <CallChoiceSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.borderLight,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  taskCard: {
    marginBottom: spacing.sm,
  },
  taskDone: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  taskContent: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  taskType: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingLeft: 40,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dueDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  dueDateOverdue: {
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
  linkedContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  linkedContactText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingLeft: 40,
  },
  assigneeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  assigneeFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.xs,
  },
  assigneeFilterTab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: 'transparent',
  },
  assigneeFilterTabActive: {
    backgroundColor: colors.primary + '15',
  },
  assigneeFilterText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textTertiary,
  },
  assigneeFilterTextActive: {
    color: colors.primary,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.success + '15',
  },
  callButtonText: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: fontWeight.medium,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
});
