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
import { useSearchRequests } from '../../../lib/api/search-requests';
import type { SearchRequest } from '../../../lib/api/search-requests';
import { SearchBar } from '../../../components/ui/SearchBar';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

const FILTERS = ['all', 'new', 'assigned', 'matched', 'closed'] as const;

const STATUS_VARIANT: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  new: 'info',
  assigned: 'warning',
  matched: 'success',
  closed: 'default',
};

export default function SearchRequestsScreen() {
  const { t, formatPrice, formatDate } = useI18n();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const { data: requests, isLoading, refetch } = useSearchRequests(status, search);

  const filterLabels: Record<string, string> = {
    all: t('searchReq_filter_all'),
    new: t('searchReq_filter_new'),
    assigned: t('searchReq_filter_assigned'),
    matched: t('searchReq_filter_matched'),
    closed: t('searchReq_filter_closed'),
  };

  const renderItem = useCallback(
    ({ item }: { item: SearchRequest }) => (
      <Card
        onPress={() =>
          router.push({
            pathname: '/(app)/search-requests/[id]',
            params: { id: item.id },
          })
        }
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.intentRow}>
            <Badge
              label={
                item.intent === 'buy'
                  ? t('searchReq_intent_buy')
                  : t('searchReq_intent_rent')
              }
              variant={item.intent === 'buy' ? 'info' : 'warning'}
            />
            {item.property_type && (
              <Text style={styles.propertyType}>
                {t(`propType_${item.property_type}`)}
              </Text>
            )}
          </View>
          <Badge
            label={t(`searchReq_status_${item.status}`)}
            variant={STATUS_VARIANT[item.status] || 'default'}
          />
        </View>

        {(item.min_budget || item.max_budget) && (
          <Text style={styles.budget}>
            {t('searchReq_budget')}:{' '}
            {item.min_budget && item.max_budget
              ? `${formatPrice(item.min_budget)} – ${formatPrice(item.max_budget)}`
              : item.max_budget
                ? `${t('valuation_result_max')} ${formatPrice(item.max_budget)}`
                : `${t('valuation_result_min')} ${formatPrice(item.min_budget!)}`}
          </Text>
        )}

        {item.location_preference && (
          <Text style={styles.location} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color={colors.textTertiary} />{' '}
            {item.location_preference}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.contactName}>
            {item.contact_name || '—'}
          </Text>
          <Text style={styles.date}>
            {formatDate(item.created_at, {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            })}
          </Text>
        </View>
      </Card>
    ),
    [t, formatPrice, formatDate],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: t('searchReq_title') }} />

      <View style={styles.searchRow}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('searchReq_search')}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setStatus(f)}
            style={[styles.filterTab, status === f && styles.filterTabActive]}
          >
            <Text
              style={[
                styles.filterLabel,
                status === f && styles.filterLabelActive,
              ]}
            >
              {filterLabels[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            title={
              search ? t('searchReq_empty') : t('searchReq_emptyDefault')
            }
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  intentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  propertyType: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  budget: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  location: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  date: { fontSize: fontSize.xs, color: colors.textTertiary },
});
