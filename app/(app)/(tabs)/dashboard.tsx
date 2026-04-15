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
import { useAuthStore } from '../../../store/authStore';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../constants/theme';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

function formatDate(): string {
  return new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
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

const typeLabels: Record<string, string> = {
  callback: 'Rückruf',
  follow_up: 'Nachfassen',
  meeting: 'Termin',
  general: 'Aufgabe',
};

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfile();
  const stats = useDashboardStats();
  const activity = useRecentActivity();

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
          {getGreeting()}, {userName}
        </Text>
        <Text style={styles.date}>{formatDate()}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <StatCard
          icon="checkbox-outline"
          label="Offene Aufgaben"
          value={stats.data?.openTasks ?? 0}
          color={colors.primary}
          onPress={() => router.push('/(app)/(tabs)/tasks')}
        />
        <StatCard
          icon="person-add-outline"
          label="Neue Leads"
          value={stats.data?.newLeadsToday ?? 0}
          color={colors.success}
          onPress={() => router.push('/(app)/(tabs)/leads')}
        />
        <StatCard
          icon="call-outline"
          label="Verpasste Anrufe"
          value={stats.data?.missedCalls ?? 0}
          color={colors.error}
        />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Schnellzugriff</Text>
      <View style={styles.quickActionsRow}>
        <QuickAction
          icon="call-outline"
          label="Anrufen"
          color={colors.success}
        />
        <QuickAction
          icon="person-add-outline"
          label="Lead anlegen"
          color={colors.primary}
          onPress={() => router.push('/(app)/(tabs)/leads')}
        />
        <QuickAction
          icon="add-circle-outline"
          label="Aufgabe"
          color={colors.accent}
          onPress={() => router.push('/(app)/(tabs)/tasks')}
        />
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Letzte Aktivitäten</Text>
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
                {new Date(item.created_at).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </Text>
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <Text style={styles.emptyText}>Noch keine Aktivitäten</Text>
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
});
