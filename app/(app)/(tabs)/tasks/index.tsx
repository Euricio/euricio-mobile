import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTasks, useCompleteTask, Task } from '../../../../lib/api/tasks';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../../constants/theme';

const filters = [
  { key: 'alle', label: 'Alle' },
  { key: 'open', label: 'Offen' },
  { key: 'in_progress', label: 'In Arbeit' },
  { key: 'done', label: 'Erledigt' },
];

const priorityConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  urgent: { label: 'Dringend', variant: 'error' },
  high: { label: 'Hoch', variant: 'warning' },
  medium: { label: 'Mittel', variant: 'info' },
  low: { label: 'Niedrig', variant: 'default' },
};

const typeLabels: Record<string, string> = {
  callback: 'Rückruf',
  follow_up: 'Nachfassen',
  meeting: 'Termin',
  general: 'Allgemein',
};

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function TaskCard({
  task,
  onComplete,
}: {
  task: Task;
  onComplete: () => void;
}) {
  const priority = priorityConfig[task.priority] ?? {
    label: task.priority,
    variant: 'default' as const,
  };
  const overdue = isOverdue(task.due_date) && task.status !== 'done';
  const isCallback = task.type === 'callback';
  const isDone = task.status === 'done';

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
                {typeLabels[task.type] ?? task.type}
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
              {overdue ? 'Überfällig: ' : ''}
              {new Date(task.due_date).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              })}
            </Text>
          </View>
        )}
        {task.lead?.name && (
          <View style={styles.linkedContact}>
            <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.linkedContactText}>{task.lead.name}</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

export default function TasksScreen() {
  const [activeFilter, setActiveFilter] = useState('open');
  const { data: tasks, isLoading, refetch, isRefetching } =
    useTasks(activeFilter);
  const completeTask = useCompleteTask();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Aufgaben',
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

      {/* Filter Tabs */}
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

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onComplete={() => completeTask.mutate(item.id)}
            />
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
                  ? 'Keine erledigten Aufgaben'
                  : 'Keine offenen Aufgaben'
              }
              message={
                activeFilter === 'open'
                  ? 'Gut gemacht! Alles erledigt.'
                  : undefined
              }
            />
          }
        />
      )}
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
    paddingBottom: spacing.xxl,
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
});
