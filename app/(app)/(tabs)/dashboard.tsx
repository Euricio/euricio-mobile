import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboardStats, useRecentActivity } from '../../../lib/api/dashboard';
import { useProfile } from '../../../lib/api/profile';
import { useTeamSummary, useTeamAvailability } from '../../../lib/api/hr';
import { useBusyStatus } from '../../../lib/api/busyStatus';
import { useAuthStore } from '../../../store/authStore';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../constants/theme';
import { useI18n } from '../../../lib/i18n';

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('greeting_morning');
  if (hour < 18) return t('greeting_afternoon');
  return t('greeting_evening');
}

function getActivityIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'callback':
      return 'call-outline';
    case 'follow_up':
      return 'arrow-redo-outline';
    case 'meeting':
      return 'calendar-outline';
    default:
      return 'checkmark-circle-outline';
  }
}

export default function DashboardScreen() {
  const { t, formatDate: fmtDate } = useI18n();
  const user = useAuthStore((s) => s.user);

  const typeLabels: Record<string, string> = {
    callback: t('taskType_callback'),
    follow_up: t('taskType_follow_up'),
    meeting: t('taskType_meeting'),
    general: t('taskType_general'),
  };
  const { data: profile } = useProfile();
  const stats = useDashboardStats();
  const activity = useRecentActivity();
  const { data: teamSummary } = useTeamSummary();
  const { data: teamAvailability } = useTeamAvailability();
  const { data: busyStatus } = useBusyStatus();
  const isBusy = busyStatus?.is_busy ?? false;
  const isManager = profile?.role === 'admin' || profile?.role === 'manager_agent';
  const onShiftMembers = (teamAvailability ?? []).filter((m) => m.status === 'on_shift');

  const isRefreshing = stats.isRefetching || activity.isRefetching;

  const onRefresh = () => {
    stats.refetch();
    activity.refetch();
  };

  const userName = profile?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>
          {getGreeting(t)}, {userName}
        </Text>
        <Text style={styles.date}>{fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      </View>

      {/* Busy / Focus Mode Card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/(app)/busy-mode/' as any)}
        style={[
          styles.busyCard,
          isBusy ? styles.busyCardActive : styles.busyCardIdle,
        ]}
      >
        <View
          style={[
            styles.busyIcon,
            { backgroundColor: isBusy ? 'rgba(255,255,255,0.2)' : colors.primary + '15' },
          ]}
        >
          <Ionicons
            name={isBusy ? 'moon' : 'moon-outline'}
            size={22}
            color={isBusy ? colors.white : colors.primary}
          />
        </View>
        <View style={styles.busyTextBox}>
          <Text style={[styles.busyTitle, isBusy && { color: colors.white }]}>
            {isBusy
              ? t('busy_toggle_busy') || 'Besetzt'
              : t('busy_toggle_available') || 'Verfügbar'}
          </Text>
          <Text style={[styles.busySubtitle, isBusy && { color: 'rgba(255,255,255,0.85)' }]} numberOfLines={1}>
            {isBusy
              ? busyStatus?.busy_reason || t('busy_dashboard_tap_to_edit') || 'Tippen zum Bearbeiten'
              : t('busy_dashboard_tap_to_enable') || 'Tippen, um Anrufe zu pausieren'}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isBusy ? 'rgba(255,255,255,0.85)' : colors.textTertiary}
        />
      </TouchableOpacity>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <StatCard
          icon="checkbox-outline"
          label={t('stat_openTasks')}
          value={stats.data?.openTasks ?? 0}
          color={colors.primary}
          onPress={() => router.push('/(app)/(tabs)/tasks')}
        />
        <StatCard
          icon="person-add-outline"
          label={t('stat_newLeads')}
          value={stats.data?.newLeadsToday ?? 0}
          color={colors.success}
          onPress={() => router.push('/(app)/(tabs)/leads')}
        />
        <StatCard
          icon="call-outline"
          label={t('stat_missedCalls')}
          value={stats.data?.missedCalls ?? 0}
          color={colors.error}
        />
      </View>

      {/* Stats Cards Row 2 */}
      <View style={styles.statsRow}>
        <StatCard
          icon="business-outline"
          label={t('stat_properties')}
          value={stats.data?.propertyCount ?? 0}
          color={colors.accent}
          onPress={() => router.push('/(app)/(tabs)/properties')}
        />
        <StatCard
          icon="calendar-outline"
          label={t('stat_appointmentsToday')}
          value={stats.data?.appointmentsToday ?? 0}
          color="#bf5af2"
          onPress={() => router.push('/(app)/calendar/')}
        />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>{t('quickAccess')}</Text>
      <View style={styles.quickActionsRow}>
        <QuickAction
          icon="call-outline"
          label={t('quick_call')}
          color={colors.success}
        />
        <QuickAction
          icon="person-add-outline"
          label={t('quick_newLead')}
          color={colors.primary}
          onPress={() => router.push('/(app)/(tabs)/leads')}
        />
        <QuickAction
          icon="add-circle-outline"
          label={t('quick_newTask')}
          color={colors.accent}
          onPress={() => router.push('/(app)/(tabs)/tasks')}
        />
      </View>

      {/* Module Grid */}
      <Text style={styles.sectionTitle}>{t('dashboard_modules')}</Text>
      <View style={styles.moduleGrid}>
        {([
          { icon: 'people-outline' as const, label: t('module_leads'), color: colors.primary, route: '/(app)/(tabs)/leads' },
          { icon: 'business-outline' as const, label: t('module_properties'), color: colors.accent, route: '/(app)/(tabs)/properties' },
          { icon: 'git-branch-outline' as const, label: t('module_pipeline'), color: '#E8A838', route: '/(app)/pipeline/' },
          { icon: 'calendar-outline' as const, label: t('module_calendar'), color: '#bf5af2', route: '/(app)/calendar/' },
          { icon: 'checkbox-outline' as const, label: t('module_tasks'), color: colors.info, route: '/(app)/(tabs)/tasks' },
          { icon: 'logo-whatsapp' as const, label: t('module_whatsapp'), color: '#25D366', route: '/(app)/whatsapp/' },
          { icon: 'paper-plane-outline' as const, label: t('module_telegram'), color: '#0088cc', route: '/(app)/telegram/' },
          { icon: 'calculator-outline' as const, label: t('module_mortgage'), color: colors.warning, route: '/(app)/mortgage/' },
          { icon: 'people-circle-outline' as const, label: t('module_partners'), color: '#30d158', route: '/(app)/partners/' },
          { icon: 'stats-chart-outline' as const, label: t('module_valuations'), color: '#F59E0B', route: '/(app)/valuations/' },
          { icon: 'briefcase-outline' as const, label: t('module_hr'), color: '#6366F1', route: '/(app)/hr/' },
          { icon: 'scan-outline' as const, label: t('module_scanner'), color: '#EC4899', route: '/(app)/scanner/' },
        ]).map((mod) => (
          <TouchableOpacity
            key={mod.route}
            style={styles.moduleItem}
            activeOpacity={0.7}
            onPress={() => router.push(mod.route as any)}
          >
            <View style={[styles.moduleIconCircle, { backgroundColor: mod.color + '15' }]}>
              <Ionicons name={mod.icon} size={24} color={mod.color} />
            </View>
            <Text style={styles.moduleLabel} numberOfLines={1}>{mod.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Team Summary */}
      {teamSummary && (
        <>
          <Text style={styles.sectionTitle}>{t('hr_teamSummary')}</Text>
          <Card
            onPress={() => router.push('/(app)/hr/team')}
            style={styles.teamCard}
          >
            <View style={styles.teamRow}>
              <View style={styles.teamStat}>
                <Text style={[styles.teamStatValue, { color: colors.info }]}>
                  {teamSummary.onShiftToday}
                </Text>
                <Text style={styles.teamStatLabel}>{t('hr_teamOnShift')}</Text>
              </View>
              {isManager && (
                <View style={styles.teamStat}>
                  <Text style={[styles.teamStatValue, { color: colors.warning }]}>
                    {teamSummary.pendingRequests}
                  </Text>
                  <Text style={styles.teamStatLabel}>{t('hr_pendingApprovals')}</Text>
                </View>
              )}
            </View>
            {onShiftMembers.length > 0 && (
              <View style={styles.avatarRow}>
                {onShiftMembers.slice(0, 6).map((m) => (
                  <Avatar key={m.member.id} name={m.member.full_name} size={32} />
                ))}
                {onShiftMembers.length > 6 && (
                  <View style={styles.avatarMore}>
                    <Text style={styles.avatarMoreText}>+{onShiftMembers.length - 6}</Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        </>
      )}

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>{t('recentActivity')}</Text>
      {activity.data && activity.data.length > 0 ? (
        <Card padded={false}>
          {activity.data.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.activityItem,
                index < activity.data.length - 1 && styles.activityBorder,
              ]}
            >
              <View style={styles.activityIcon}>
                <Ionicons
                  name={getActivityIcon(item.task_type)}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.activityMeta}>
                  {item.lead_name && (
                    <Text style={styles.activityLead}>{item.lead_name}</Text>
                  )}
                  <Badge
                    label={typeLabels[item.task_type] ?? item.task_type}
                    variant="default"
                  />
                </View>
              </View>
              <Text style={styles.activityTime}>
                {fmtDate(item.created_at, {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </Text>
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <Text style={styles.emptyText}>{t('noActivity')}</Text>
        </Card>
      )}
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  onPress?: () => void;
}) {
  return (
    <Card style={styles.statCard} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.quickAction}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
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
  greetingSection: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  moduleItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  moduleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  moduleLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
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
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  activityLead: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  activityTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  teamCard: {
    marginBottom: spacing.lg,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  teamStat: {
    alignItems: 'center',
  },
  teamStatValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  teamStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  avatarMore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMoreText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  busyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  busyCardIdle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  busyCardActive: {
    backgroundColor: colors.primary,
  },
  busyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busyTextBox: {
    flex: 1,
  },
  busyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  busySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
