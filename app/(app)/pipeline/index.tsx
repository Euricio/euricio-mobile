import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
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
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../constants/theme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

function AccordionStage({
  stage,
  leads,
  allStages,
  locale,
  onMove,
  t,
  expanded,
  onToggle,
}: {
  stage: PipelineStage;
  leads: PipelineLead[];
  allStages: PipelineStage[];
  locale: Locale;
  onMove: (leadId: string, stageKey: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.accordionSection}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.stageColorDot,
            { backgroundColor: stage.color || colors.textTertiary },
          ]}
        />
        <Text style={styles.stageName} numberOfLines={1}>
          {getStageName(stage, locale)}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{leads.length}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={18}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accordionBody}>
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
        </View>
      )}
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
        const firstKey = stages[0].stage_key;
        map[firstKey]?.push(lead);
      }
    }
    return map;
  }, [stages, leads]);

  // Stages with leads start expanded; empty stages start collapsed
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(() => {
    return {};
  });

  // Derive effective expanded state: explicit toggle overrides, otherwise expand if has leads
  const isExpanded = useCallback(
    (stageKey: string) => {
      if (stageKey in expandedStages) return expandedStages[stageKey];
      const stageLeads = leadsByStage[stageKey];
      return stageLeads != null && stageLeads.length > 0;
    },
    [expandedStages, leadsByStage],
  );

  const toggleStage = useCallback((stageKey: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedStages((prev) => ({
      ...prev,
      [stageKey]: prev[stageKey] !== undefined ? !prev[stageKey] : !(leadsByStage[stageKey]?.length > 0),
    }));
  }, [leadsByStage]);

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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {(stages ?? []).map((stage) => (
          <AccordionStage
            key={stage.id}
            stage={stage}
            leads={leadsByStage[stage.stage_key] ?? []}
            allStages={stages ?? []}
            locale={locale}
            onMove={handleMove}
            t={t}
            expanded={isExpanded(stage.stage_key)}
            onToggle={() => toggleStage(stage.stage_key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
    gap: spacing.sm,
  },
  accordionSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadow.sm,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  stageColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stageName: {
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
  accordionBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  emptyStage: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.md,
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
