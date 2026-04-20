import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Avatar } from '../ui/Avatar';
import { useI18n } from '../../lib/i18n';
import type { CallerContextMatch } from '../../lib/api/callerContext';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

interface Props {
  match: CallerContextMatch;
  /** Render compactly — for IncomingCallOverlay header area where vertical
   *  space is limited. Default: full. */
  compact?: boolean;
}

const ENTITY_LABEL_KEYS: Record<CallerContextMatch['entity_type'], string> = {
  lead: 'caller_entity_lead',
  property_owner: 'caller_entity_owner',
  partner: 'caller_entity_partner',
};

/**
 * Structured caller context: used both in the IncomingCallOverlay (compact)
 * and later in the full Call Workspace. Taps navigate via expo-router.
 */
export function CallerContextCard({ match, compact = false }: Props) {
  const { t } = useI18n();

  const warmthDots = match.warmth
    ? '●'.repeat(match.warmth) + '○'.repeat(Math.max(0, 5 - match.warmth))
    : null;

  const subtitleParts: string[] = [t(ENTITY_LABEL_KEYS[match.entity_type])];
  if (match.is_cold_callback) subtitleParts.push(t('caller_cold_callback'));
  if (match.status) subtitleParts.push(match.status);
  const subtitle = subtitleParts.join(' · ');

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {/* Name row */}
      <View style={styles.nameRow}>
        <Avatar name={match.name} size={compact ? 44 : 52} />
        <View style={styles.nameInfo}>
          <Text style={styles.name} numberOfLines={1}>{match.name}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
            {warmthDots ? `  ${warmthDots}` : ''}
          </Text>
        </View>
      </View>

      {/* Next action — the single hero CTA */}
      {match.next_action && (
        <View style={styles.nextAction}>
          <Text style={styles.nextActionLabel}>{t('call_ws_next_action')}</Text>
          <Text style={styles.nextActionText} numberOfLines={2}>{match.next_action}</Text>
        </View>
      )}

      {/* Property */}
      {match.property && match.property.title && (
        <Pressable
          onPress={() => router.push(`/(app)/(tabs)/properties/${match.property!.id}` as any)}
          style={styles.row}
        >
          <Ionicons name="home-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.rowText} numberOfLines={1}>{match.property.title}</Text>
        </Pressable>
      )}

      {/* Last interaction */}
      {match.last_interaction && (
        <View style={styles.row}>
          <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.rowText, styles.rowTextMuted]} numberOfLines={compact ? 1 : 2}>
            {match.last_interaction.summary}
          </Text>
        </View>
      )}

      {/* Last agent */}
      {match.last_agent && (
        <View style={styles.row}>
          <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.rowText} numberOfLines={1}>
            {t('call_ws_last_agent')}: {match.last_agent.name}
          </Text>
        </View>
      )}

      {/* Relationship owner (who on the team knows them) */}
      {match.relationship_owner && (
        <View style={styles.row}>
          <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.rowText} numberOfLines={1}>
            {t('call_ws_knows_customer')}: {match.relationship_owner.name}
          </Text>
        </View>
      )}

      {/* Open tasks */}
      {match.open_tasks_count > 0 && (
        <View style={styles.row}>
          <Ionicons name="checkbox-outline" size={18} color={colors.warning} />
          <Text style={[styles.rowText, { color: colors.warning, fontWeight: fontWeight.semibold }]}>
            {t('call_ws_open_tasks')}: {match.open_tasks_count}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardCompact: {
    padding: spacing.sm,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameInfo: { flex: 1 },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  nextAction: {
    backgroundColor: colors.primary + '14', // ~8% opacity on primary
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 2,
  },
  nextActionLabel: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  nextActionText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  rowTextMuted: {
    color: colors.textSecondary,
  },
});
