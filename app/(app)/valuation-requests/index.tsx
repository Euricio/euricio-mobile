import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useValuationRequests } from '../../../lib/api/valuation-requests';
import type { ValuationRequest } from '../../../lib/api/valuation-requests';
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
} from '../../../constants/theme';

export default function ValuationRequestsScreen() {
  const { t, formatDate } = useI18n();
  const [search, setSearch] = useState('');
  const { data: requests, isLoading, refetch } = useValuationRequests(search);

  const renderItem = useCallback(
    ({ item }: { item: ValuationRequest }) => {
      const isImported = item.status === 'imported';
      return (
        <Card
          onPress={() =>
            router.push({
              pathname: '/(app)/valuation-requests/[id]',
              params: { id: item.id },
            })
          }
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons
                name="home-outline"
                size={18}
                color={colors.accent}
              />
              <Text style={styles.propertyType}>
                {item.property_type
                  ? t(`propType_${item.property_type}`)
                  : t('unknown')}
              </Text>
            </View>
            <Badge
              label={isImported ? t('valReq_imported') : t('valReq_pending')}
              variant={isImported ? 'success' : 'warning'}
            />
          </View>
          {item.address && (
            <Text style={styles.address} numberOfLines={1}>
              {item.address}
              {item.postal_code ? `, ${item.postal_code}` : ''}
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
          {item.area_m2 && (
            <Text style={styles.details}>
              {item.area_m2} m\u00b2{item.rooms ? ` \u00b7 ${item.rooms} ${t('properties_rooms')}` : ''}
            </Text>
          )}
        </Card>
      );
    },
    [t, formatDate],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: t('valReq_title') }} />

      <View style={styles.searchRow}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('valReq_search')}
        />
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
            title={search ? t('valReq_empty') : t('valReq_emptyDefault')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  list: { padding: spacing.md, paddingBottom: 100 },
  card: { marginBottom: spacing.sm },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  propertyType: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  address: {
    fontSize: fontSize.sm,
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
  details: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
