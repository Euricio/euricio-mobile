import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import type { Locale } from '../../../lib/i18n';
import {
  usePipelineStages,
  usePipelineLeads,
  useMoveLeadToStage,
  getStageName,
} from '../../../lib/api/pipeline';
import type { PipelineStage, PipelineLead } from '../../../lib/api/pipeline';
import { Card } from '../../../components/ui/Card';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../constants/theme';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: colors.error,
  high: colors.warning,
  medium: colors.info,
  low: colors.textTertiary,
};

function LeadCard({
  lead,
  stages,
  locale,
  onMove,
  t,
}: {
  lead: PipelineLead;
  stages: PipelineStage[];
  locale: Locale;
  onMove: (leadId: string, stageKey: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const handleCall = useCallback(() => {
    if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    }
  }, [lead.phone]);

  const handleLongPress = useCallback(() => {
    const options = stages.map((s) => getStageName(s, locale));
    options.push(t('cancel'));

    Alert.alert(t('pipeline_moveToStage'), lead.full_name, [
      ...stages.map((s) => ({
        text: getStageName(s, locale),
        onPress: () => onMove(lead.id, s.stage_key),
      })),
      { text: t('cancel'), style: 'cancel' as const },
    ]);
  }, [stages, locale, lead, onMove, t]);

  const budget = lead.budget ?? lead.properties?.[0]?.price ?? null;

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      style={styles.leadCard}
    >
      <View style={styles.leadHeader}>
        <View style={styles.leadNameRow}>
          {lead.priority && (
            <View
              style={[
                styles.priorityDot,
                { backgroundColor: PRIORITY_COLORS[lead.priority] || colors.textTertiary },
              ]}
            />
          )}
          <Text style={styles.leadName} numberOfLines={1}>
            {lead.full_name}
          </Text>
        </View>
        {lead.phone && (
          <TouchableOpacity onPress={handleCall} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="call-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      {budget != null && (
        <Text style={styles.leadBudget}>
          {new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
          }).format(budget)}
        </Text>
      )}
      {lead.source && (
        <Text style={styles.leadSource}>{lead.source}</Text>
      )}
    </TouchableOpacity>
  );
}

function StageColumn({
  stage,
  leads,
  allStages,
  locale,
  onMove,
  t,
}: {
  stage: PipelineStage;
  leads: PipelineLead[];
  allStages: PipelineStage[];
  locale: Locale;
  onMove: (leadId: string, stageKey: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <View style={styles.column}>
      <View style={styles.columnHeader}>
        <View style={[styles.stageColorDot, { backgroundColor: stage.color || colors.textTertiary }]} />
        <Text style={styles.columnTitle} numberOfLines={1}>
          {getStageName(stage, locale)}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{leads.length}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.columnScroll}
        showsVerticalScrollIndicator={false}
      >
        {leads.length === 0 ? (
          <Text style={styles.emptyStage}>{t('pipeline_noLeads')}</Text>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              stages={allStages}
              locale={locale}
              onMove={onMove}
              t={t}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default function PipelineScreen() {
  const { t, locale } = useI18n();
  const { data: stages, isLoading: stagesLoading } = usePipelineStages();
  const { data: leads, isLoading: leadsLoading } = usePipelineLeads();
  const moveLead = useMoveLeadToStage();

  const leadsByStage = useMemo(() => {
    if (!stages || !leads) return {};
    const map: Record<string, PipelineLead[]> = {};
    for (const stage of stages) {
      map[stage.stage_key] = [];
    }
    for (const lead of leads) {
      const key = lead.pipeline_stage || '';
      if (map[key]) {
        map[key].push(lead);
      } else if (stages.length > 0) {
        // Put into first stage if unknown
        const firstKey = stages[0].stage_key;
        map[firstKey]?.push(lead);
      }
    }
    return map;
  }, [stages, leads]);

  const handleMove = useCallback(
    (leadId: string, stageKey: string) => {
      moveLead.mutate({ leadId, stageKey });
    },
    [moveLead],
  );

  if (stagesLoading || leadsLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('pipeline_title'),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(app)/pipeline/manage-stages')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="settings-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.boardContent}
      >
        {(stages ?? []).map((stage) => (
          <StageColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStage[stage.stage_key] ?? []}
            allStages={stages ?? []}
            locale={locale}
            onMove={handleMove}
            t={t}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const COLUMN_WIDTH = 280;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  boardContent: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  column: {
    width: COLUMN_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadow.sm,
    maxHeight: '100%',
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  stageColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  columnTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  countText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  columnScroll: {
    flex: 1,
    padding: spacing.sm,
  },
  emptyStage: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  leadCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leadNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leadName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  leadBudget: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginTop: 4,
  },
  leadSource: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
