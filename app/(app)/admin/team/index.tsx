import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTeamMembers, TeamMember } from '../../../../lib/api/admin-team';
import { useI18n } from '../../../../lib/i18n';
import { SearchBar } from '../../../../components/ui/SearchBar';
import { Card } from '../../../../components/ui/Card';
import { Avatar } from '../../../../components/ui/Avatar';
import { Badge } from '../../../../components/ui/Badge';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';

type StatusFilter = 'all' | 'active' | 'inactive';

function getRoleBadgeVariant(
  role: string | null,
): 'error' | 'warning' | 'info' | 'default' {
  switch (role) {
    case 'admin':
      return 'error';
    case 'manager_agent':
      return 'warning';
    case 'anwalt':
      return 'info';
    default:
      return 'default';
  }
}

function MemberCard({ member }: { member: TeamMember }) {
  const { t } = useI18n();

  const roleLabel =
    member.role
      ? t(`adminTeam_role_${member.role}`) || member.role
      : '—';

  return (
    <Card
      style={styles.memberCard}
      onPress={() => router.push(`/(app)/admin/team/${member.id}`)}
    >
      <View style={styles.memberRow}>
        <Avatar name={member.full_name || t('unknown')} size={44} />
        <View style={styles.memberInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName} numberOfLines={1}>
              {member.full_name || '—'}
            </Text>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: member.is_active
                    ? colors.success
                    : colors.textTertiary,
                },
              ]}
            />
          </View>
          {member.position && (
            <Text style={styles.memberPosition} numberOfLines={1}>
              {member.position}
            </Text>
          )}
        </View>
        <Badge label={roleLabel} variant={getRoleBadgeVariant(member.role)} />
      </View>
    </Card>
  );
}

export default function AdminTeamListScreen() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const apiStatus = statusFilter === 'all' ? undefined : statusFilter;
  const {
    data: members,
    isLoading,
    refetch,
    isRefetching,
  } = useTeamMembers(apiStatus, search);

  const activeCount = useMemo(
    () => (members ?? []).filter((m) => m.is_active).length,
    [members],
  );

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: t('adminTeam_filter_all') },
    { key: 'active', label: t('adminTeam_filter_active') },
    { key: 'inactive', label: t('adminTeam_filter_inactive') },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('adminTeam_title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('adminTeam_search')}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filterTabs.map((tab) => {
          const active = statusFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, active && styles.filterTabActive]}
              activeOpacity={0.7}
              onPress={() => setStatusFilter(tab.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  active && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Seat Counter */}
      <View style={styles.seatContainer}>
        <Text style={styles.seatText}>
          {t('adminTeam_seats', {
            used: String(activeCount),
            total: '10',
          })}
        </Text>
      </View>

      {/* List */}
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MemberCard member={item} />}
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
              icon="people-outline"
              title={t('adminTeam_empty')}
              message={
                search
                  ? t('adminTeam_emptySearch')
                  : t('adminTeam_emptyDefault')
              }
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/(app)/admin/team/create')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  filterTab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.white,
  },
  seatContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  seatText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  memberCard: {
    marginBottom: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flexShrink: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  memberPosition: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
});
