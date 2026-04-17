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
import { useLeads, Lead } from '../../../../lib/api/leads';
import { useSubscription } from '../../../../lib/api/subscription';
import { SearchBar } from '../../../../components/ui/SearchBar';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Avatar } from '../../../../components/ui/Avatar';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';
import { useI18n } from '../../../../lib/i18n';

function getStatusConfig(t: (key: string) => string): Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> {
  return {
    new: { label: t('leadStatus_new'), variant: 'info' },
    contacted: { label: t('leadStatus_contacted'), variant: 'primary' },
    qualified: { label: t('leadStatus_qualified'), variant: 'warning' },
    lost: { label: t('leadStatus_lost'), variant: 'error' },
  };
}

function LeadCard({ lead }: { lead: Lead }) {
  const { t, formatDate } = useI18n();
  const statusConfig = getStatusConfig(t);
  const status = statusConfig[lead.status] ?? {
    label: lead.status,
    variant: 'default' as const,
  };

  return (
    <Card
      style={styles.leadCard}
      onPress={() => router.push(`/(app)/(tabs)/leads/${lead.id}`)}
    >
      <View style={styles.leadRow}>
        <Avatar name={lead.full_name || t('unknown')} size={44} />
        <View style={styles.leadInfo}>
          <Text style={styles.leadName} numberOfLines={1}>
            {lead.full_name}
          </Text>
          <View style={styles.leadMeta}>
            {lead.phone && (
              <Text style={styles.leadPhone} numberOfLines={1}>
                {lead.phone}
              </Text>
            )}
            {lead.email && !lead.phone && (
              <Text style={styles.leadPhone} numberOfLines={1}>
                {lead.email}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.leadRight}>
          <Badge label={status.label} variant={status.variant} />
          <Text style={styles.leadDate}>
            {formatDate(lead.created_at, {
              day: '2-digit',
              month: '2-digit',
            })}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export default function LeadsListScreen() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const { data: leads, isLoading, refetch, isRefetching } = useLeads(search);
  const { data: sub } = useSubscription();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('leads_title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('leads_search')}
        />
        <Text style={styles.leadCounter}>
          {t('lead_limitCounter', {
            used: String(leads?.length ?? 0),
            total: String(sub?.limits?.leads ?? '\u221E'),
          })}
        </Text>
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LeadCard lead={item} />}
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
              title={t('leads_empty')}
              message={
                search
                  ? t('leads_emptySearch')
                  : t('leads_emptyDefault')
              }
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/(app)/(tabs)/leads/create')}
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
  leadCounter: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  leadCard: {
    marginBottom: spacing.sm,
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  leadName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  leadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  leadPhone: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  leadRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  leadDate: {
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
