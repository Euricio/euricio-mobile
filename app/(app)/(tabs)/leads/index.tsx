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

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
  new: { label: 'Neu', variant: 'info' },
  contacted: { label: 'Kontaktiert', variant: 'primary' },
  qualified: { label: 'Qualifiziert', variant: 'warning' },
  proposal: { label: 'Angebot', variant: 'primary' },
  won: { label: 'Gewonnen', variant: 'success' },
  lost: { label: 'Verloren', variant: 'error' },
};

function LeadCard({ lead }: { lead: Lead }) {
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
        <Avatar name={lead.full_name || 'Unbekannt'} size={44} />
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
            {new Date(lead.created_at).toLocaleDateString('de-DE', {
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
  const [search, setSearch] = useState('');
  const { data: leads, isLoading, refetch, isRefetching } = useLeads(search);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Leads',
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Lead suchen..."
        />
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
              title="Keine Leads gefunden"
              message={
                search
                  ? 'Versuchen Sie eine andere Suche'
                  : 'Noch keine Leads vorhanden'
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
  list: {
    padding: spacing.md,
    paddingBottom: 100,
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
