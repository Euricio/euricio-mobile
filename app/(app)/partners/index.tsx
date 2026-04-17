import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import { usePartners } from '../../../lib/api/partners';
import type { Partner } from '../../../lib/api/partners';
import { Card } from '../../../components/ui/Card';
import { SearchBar } from '../../../components/ui/SearchBar';
import { Badge } from '../../../components/ui/Badge';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

const STATUS_COLORS: Record<string, string> = {
  active: colors.success,
  inactive: colors.textTertiary,
  blocked: colors.error,
};

const CATEGORY_COLORS: Record<string, string> = {
  private: colors.textSecondary,
  agent: colors.primary,
  lawyer: colors.info,
  notary: '#bf5af2',
  bank_advisor: colors.warning,
  developer: '#30d158',
  architect: '#ff9500',
  other: colors.textTertiary,
};

// Map legacy/German category values from the database to canonical English keys
const CATEGORY_ALIAS: Record<string, string> = {
  privat: 'private',
  makler: 'agent',
  anwalt: 'lawyer',
  notar: 'notary',
  bankberater: 'bank_advisor',
  'bauträger': 'developer',
  architekt: 'architect',
  sonstige: 'other',
};

function normalizeCategory(raw: string): string {
  if (CATEGORY_COLORS[raw]) return raw;
  const lower = raw.toLowerCase();
  if (CATEGORY_COLORS[lower]) return lower;
  return CATEGORY_ALIAS[lower] ?? raw;
}

function PartnerCard({ partner, t }: { partner: Partner; t: (key: string) => string }) {
  const fullName = [partner.first_name, partner.last_name].filter(Boolean).join(' ');
  const category = normalizeCategory(partner.category);

  return (
    <Card
      onPress={() =>
        router.push({
          pathname: '/(app)/partners/[id]',
          params: { id: partner.id },
        })
      }
      style={styles.partnerCard}
    >
      <View style={styles.cardRow}>
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: (CATEGORY_COLORS[category] || colors.textTertiary) + '15' },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={CATEGORY_COLORS[category] || colors.textTertiary}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.partnerName} numberOfLines={1}>{fullName}</Text>
          <View style={styles.metaRow}>
            <Badge
              label={t(`partner_category_${category}`)}
              variant="primary"
            />
            {partner.organization && (
              <Text style={styles.orgText} numberOfLines={1}>{partner.organization}</Text>
            )}
          </View>
        </View>
        <View style={styles.cardRight}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: STATUS_COLORS[partner.status] || colors.textTertiary },
            ]}
          />
          {partner.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${partner.phone}`)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="call-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}

export default function PartnersScreen() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const { data: partners, isLoading } = usePartners(search);

  const stats = useMemo(() => {
    const all = partners ?? [];
    return {
      total: all.length,
      active: all.filter((p) => p.status === 'active').length,
      inactive: all.filter((p) => p.status !== 'active').length,
    };
  }, [partners]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('partners_title'),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(app)/partners/create')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add-outline" size={26} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.active}</Text>
          <Text style={styles.statLabel}>{t('partners_active')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>{t('partners_total')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.inactive}</Text>
          <Text style={styles.statLabel}>{t('partners_inactive')}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('partners_search')}
        />
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={partners}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PartnerCard partner={item} t={t} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={search ? t('partners_empty') : t('partners_emptyDefault')}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsRow: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: 0,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    padding: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  partnerCard: {
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  orgText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
