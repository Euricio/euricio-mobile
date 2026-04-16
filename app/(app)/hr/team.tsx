import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useTeamAvailability, usePendingRequests, TeamMemberStatus } from '../../../lib/api/hr';
import { useProfile } from '../../../lib/api/profile';
import { TeamMemberCard } from '../../../components/hr/TeamMemberCard';
import { SearchBar } from '../../../components/ui/SearchBar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { Badge } from '../../../components/ui/Badge';
import { useI18n } from '../../../lib/i18n';
import { colors, spacing } from '../../../constants/theme';

export default function TeamScreen() {
  const { t } = useI18n();
  const { data: availability, isLoading, refetch, isRefetching } = useTeamAvailability();
  const { data: profile } = useProfile();
  const { data: pending } = usePendingRequests();
  const [search, setSearch] = useState('');

  const isManager = profile?.role === 'admin' || profile?.role === 'manager_agent';
  const pendingCount = (pending?.vacationRequests.length ?? 0) + (pending?.shiftRequests.length ?? 0);

  const filtered = (availability ?? []).filter((item) =>
    !search || item.member.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('hr_teamTitle'),
          headerRight: isManager && pendingCount > 0
            ? () => <Badge label={t('hr_pendingCount', { count: String(pendingCount) })} variant="warning" size="md" />
            : undefined,
        }}
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('search')}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.member.id}
        renderItem={({ item }: { item: TeamMemberStatus }) => (
          <TeamMemberCard
            item={item}
            onPress={() => router.push(`/(app)/hr/member/${item.member.id}`)}
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
            icon="people-outline"
            title={t('hr_teamEmpty')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 120,
  },
});
