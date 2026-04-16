import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchEntities, CallerMatch } from '../../lib/voice/voiceApi';
import { SearchBar } from '../ui/SearchBar';
import { Avatar } from '../ui/Avatar';
import { useI18n } from '../../lib/i18n';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

const ENTITY_LABELS: Record<string, string> = {
  lead: 'Lead',
  property_owner: 'Eigentümer',
  partner: 'Partner',
};

interface EntitySearchPanelProps {
  onSelect: (match: CallerMatch) => void;
}

export default function EntitySearchPanel({ onSelect }: EntitySearchPanelProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CallerMatch[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await searchEntities(q);
      setResults(res.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <SearchBar
        value={query}
        onChangeText={handleSearch}
        placeholder={t('voice_searchContacts')}
      />

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!loading && results.length === 0 && query.length >= 2 && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('voice_noResults')}</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => `${item.entity_type}-${item.entity_id}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <Avatar name={item.name} size={36} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.type}>
                {ENTITY_LABELS[item.entity_type] || item.entity_type}
                {item.property_info ? ` · ${item.property_info}` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  type: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
