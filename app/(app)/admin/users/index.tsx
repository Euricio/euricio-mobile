import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useAllUsers } from '../../../../lib/api/admin-users';
import type { AdminUser } from '../../../../lib/api/admin-users';
import { SearchBar } from '../../../../components/ui/SearchBar';
import { Card } from '../../../../components/ui/Card';
import { Avatar } from '../../../../components/ui/Avatar';
import { Badge } from '../../../../components/ui/Badge';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { useI18n } from '../../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../../constants/theme';

const ROLE_FILTERS = ['all', 'admin', 'agent'] as const;

const ROLE_VARIANT: Record<string, 'primary' | 'info' | 'warning' | 'default'> = {
  admin: 'primary',
  agent: 'info',
};

export default function AdminUsersScreen() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { data: users, isLoading, refetch } = useAllUsers(search, roleFilter);

  const filterLabels: Record<string, string> = {
    all: t('adminUsers_filter_all'),
    admin: t('adminUsers_filter_admin'),
    agent: t('adminUsers_filter_agent'),
  };

  const renderItem = useCallback(
    ({ item }: { item: AdminUser }) => (
      <Card
        onPress={() =>
          router.push({
            pathname: '/(app)/admin/users/[id]',
            params: { id: item.id },
          })
        }
        style={styles.card}
      >
        <View style={styles.cardRow}>
          <Avatar name={item.full_name || item.email || '?'} size={44} />
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.full_name || '—'}
              </Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: item.is_active ? colors.success : colors.textTertiary },
                ]}
              />
            </View>
            <Text style={styles.email} numberOfLines={1}>
              {item.email || '—'}
            </Text>
          </View>
          <Badge
            label={item.role || 'agent'}
            variant={ROLE_VARIANT[item.role || ''] || 'default'}
          />
        </View>
      </Card>
    ),
    [],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: t('adminUsers_title') }} />

      <View style={styles.searchRow}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('adminUsers_search')}
        />
      </View>

      <View style={styles.filterRow}>
        {ROLE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setRoleFilter(f)}
            style={[styles.filterTab, roleFilter === f && styles.filterTabActive]}
          >
            <Text
              style={[
                styles.filterLabel,
                roleFilter === f && styles.filterLabelActive,
              ]}
            >
              {filterLabels[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={t('adminUsers_empty')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  filterLabelActive: { color: colors.white },
  list: { padding: spacing.md, paddingBottom: 100 },
  card: { marginBottom: spacing.sm },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  email: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
