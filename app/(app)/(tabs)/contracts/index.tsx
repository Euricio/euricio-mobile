import React, { useState } from 'react';
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
import { useContracts, Contract, ContractStatus } from '../../../../lib/api/contracts';
import { CONTRACT_TYPE_CONFIG } from '../../../../lib/contracts/config';
import { SearchBar } from '../../../../components/ui/SearchBar';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  shadow,
} from '../../../../constants/theme';
import { useI18n } from '../../../../lib/i18n';

const STATUS_FILTERS: Array<ContractStatus | 'all'> = ['all', 'draft', 'signed', 'archived'];

function getStatusBadge(status: string, t: (key: string) => string): { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' } {
  switch (status) {
    case 'draft':
      return { label: t('contractStatus_draft'), variant: 'warning' };
    case 'signed':
      return { label: t('contractStatus_signed'), variant: 'success' };
    case 'archived':
      return { label: t('contractStatus_archived'), variant: 'default' };
    default:
      return { label: status, variant: 'default' };
  }
}

function ContractCard({ contract }: { contract: Contract }) {
  const { t, formatDate } = useI18n();
  const badge = getStatusBadge(contract.status, t);
  const typeConfig = CONTRACT_TYPE_CONFIG[contract.contract_type];
  const typeLabel = t(`contractType_${contract.contract_type}`) || typeConfig?.label_de || contract.contract_type;

  const propertyDisplay = contract.property
    ? `${contract.property.street || ''} ${contract.property.city || ''}`.trim()
    : contract.property_address || '';

  return (
    <Card
      style={styles.contractCard}
      onPress={() => router.push(`/(app)/(tabs)/contracts/${contract.id}`)}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardIcon}>
          <Ionicons name="document-text-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardClientName} numberOfLines={1}>
            {contract.client_name}
          </Text>
          <Text style={styles.cardType} numberOfLines={1}>
            {typeLabel}
          </Text>
          {propertyDisplay ? (
            <Text style={styles.cardProperty} numberOfLines={1}>
              {propertyDisplay}
            </Text>
          ) : null}
        </View>
        <View style={styles.cardRight}>
          <Badge label={badge.label} variant={badge.variant} />
          <Text style={styles.cardDate}>
            {formatDate(contract.created_at, {
              day: '2-digit',
              month: '2-digit',
            })}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export default function ContractsListScreen() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const activeStatus = statusFilter === 'all' ? undefined : statusFilter;
  const { data: contracts, isLoading, refetch, isRefetching } = useContracts(activeStatus, search);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('contracts_title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('contracts_search')}
        />
      </View>

      {/* Status filter pills */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => {
          const label = f === 'all' ? t('contracts_filter_all') : t(`contractStatus_${f}`);
          const active = f === statusFilter;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setStatusFilter(f)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ContractCard contract={item} />}
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
              icon="document-text-outline"
              title={t('contracts_empty')}
              message={
                search
                  ? t('contracts_emptySearch')
                  : t('contracts_emptyDefault')
              }
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/(app)/(tabs)/contracts/type-picker')}
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
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  filterPillActive: {
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
  contractCard: {
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardClientName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  cardType: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 1,
  },
  cardProperty: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  cardDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
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
