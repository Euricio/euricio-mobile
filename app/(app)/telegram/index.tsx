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
import { useTelegramConversations } from '../../../lib/api/telegram';
import type { TelegramConversation } from '../../../lib/api/telegram';
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

const TELEGRAM_BLUE = '#0088cc';
const FILTERS = ['all', 'mine', 'unassigned'] as const;

export default function TelegramInboxScreen() {
  const { t, formatDate } = useI18n();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const { data: conversations, isLoading, refetch } = useTelegramConversations(filter, search);

  const filterLabels: Record<string, string> = {
    all: t('telegram_filter_all'),
    mine: t('telegram_filter_mine'),
    unassigned: t('telegram_filter_unassigned'),
  };

  const renderItem = useCallback(
    ({ item }: { item: TelegramConversation }) => (
      <Card
        onPress={() =>
          router.push({
            pathname: '/(app)/telegram/[id]',
            params: { id: item.id },
          })
        }
        style={styles.card}
      >
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Ionicons name="paper-plane" size={22} color={TELEGRAM_BLUE} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.contactName} numberOfLines={1}>
                {item.contact_name || item.chat_id}
              </Text>
              {item.last_message_at && (
                <Text style={styles.timestamp}>
                  {formatDate(item.last_message_at, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.last_message || '—'}
              </Text>
              {item.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread_count}</Text>
                </View>
              )}
            </View>
            {item.entity_type && (
              <Badge label={`${item.entity_type}`} variant="info" />
            )}
          </View>
        </View>
      </Card>
    ),
    [formatDate, t],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: t('telegram_title') }} />

      <View style={styles.searchRow}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('telegram_search')}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
          >
            <Text
              style={[
                styles.filterLabel,
                filter === f && styles.filterLabelActive,
              ]}
            >
              {filterLabels[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            title={search ? t('telegram_empty') : t('telegram_emptyDefault')}
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
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: TELEGRAM_BLUE,
    borderColor: TELEGRAM_BLUE,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  filterLabelActive: { color: colors.white },
  list: { padding: spacing.md, paddingBottom: 100 },
  card: { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: TELEGRAM_BLUE + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  timestamp: { fontSize: fontSize.xs, color: colors.textTertiary },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  lastMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadBadge: {
    backgroundColor: TELEGRAM_BLUE,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});
