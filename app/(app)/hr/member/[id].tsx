import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTeamMember, useVacationBalance, useTeamTasks } from '../../../../lib/api/hr';
import { useProfile } from '../../../../lib/api/profile';
import { Task } from '../../../../lib/api/tasks';
import { Card } from '../../../../components/ui/Card';
import { Avatar } from '../../../../components/ui/Avatar';
import { Badge } from '../../../../components/ui/Badge';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { useI18n } from '../../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
} from '../../../../constants/theme';

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, formatDate } = useI18n();
  const { data: member, isLoading } = useTeamMember(id!);
  const { data: currentProfile } = useProfile();
  const isManager = currentProfile?.role === 'admin' || currentProfile?.role === 'manager_agent';
  const { data: vacBalance } = useVacationBalance(isManager ? id : undefined);
  const { data: tasks, refetch } = useTeamTasks(id);

  if (isLoading || !member) return <LoadingScreen />;

  const openTasks = (tasks ?? []).filter((t: Task) => t.status !== 'done');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.primary} />
      }
    >
      <Stack.Screen options={{ headerTitle: member.full_name }} />

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar name={member.full_name} size={80} />
        <Text style={styles.name}>{member.full_name}</Text>
        {member.position && <Text style={styles.position}>{member.position}</Text>}
        <Badge
          label={member.role === 'admin' ? 'Admin' : member.role === 'manager_agent' ? 'Manager' : 'Agent'}
          variant="primary"
          size="md"
        />
      </View>

      {/* Contact Info */}
      <Card style={styles.section}>
        {member.phone && (
          <InfoRow
            icon="call-outline"
            label={t('hr_phone')}
            value={member.phone}
            onPress={() => Linking.openURL(`tel:${member.phone}`)}
          />
        )}
        {member.email && (
          <InfoRow
            icon="mail-outline"
            label={t('hr_email')}
            value={member.email}
            showBorder={!!member.phone}
            onPress={() => Linking.openURL(`mailto:${member.email}`)}
          />
        )}
        <InfoRow
          icon="briefcase-outline"
          label={t('hr_role')}
          value={member.role}
          showBorder
        />
      </Card>

      {/* Vacation Balance (Manager only) */}
      {isManager && vacBalance && (
        <>
          <Text style={styles.sectionTitle}>{t('hr_vacationBalance')}</Text>
          <Card>
            <View style={styles.vacRow}>
              <View style={styles.vacItem}>
                <Text style={styles.vacValue}>{vacBalance.totalDays}</Text>
                <Text style={styles.vacLabel}>{t('hr_daysTotal')}</Text>
              </View>
              <View style={styles.vacItem}>
                <Text style={[styles.vacValue, { color: colors.warning }]}>{vacBalance.usedDays}</Text>
                <Text style={styles.vacLabel}>{t('hr_daysUsed')}</Text>
              </View>
              <View style={styles.vacItem}>
                <Text style={[styles.vacValue, { color: colors.success }]}>{vacBalance.remainingDays}</Text>
                <Text style={styles.vacLabel}>{t('hr_daysRemaining')}</Text>
              </View>
            </View>
          </Card>
        </>
      )}

      {/* Assigned Tasks */}
      {openTasks.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('hr_assignedTasks')}</Text>
          <Card padded={false}>
            {openTasks.slice(0, 10).map((task: Task, index: number) => (
              <View
                key={task.id}
                style={[
                  styles.taskItem,
                  index < openTasks.length - 1 && index < 9 && styles.taskBorder,
                ]}
              >
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
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  showBorder,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  showBorder?: boolean;
  onPress?: () => void;
}) {
  const row = (
    <View style={[styles.infoRow, showBorder && styles.infoBorder]}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {row}
      </TouchableOpacity>
    );
  }
  return row;
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  position: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: spacing.md,
  },
  infoBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  vacRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  vacItem: {
    alignItems: 'center',
  },
  vacValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  vacLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  taskBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
});
