import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useI18n } from '../../../../lib/i18n';
import {
  useCandidates,
  useUpdateCandidate,
  RECRUITMENT_STAGES,
} from '../../../../lib/api/recruitment';
import type { Candidate, CandidateStage } from '../../../../lib/api/recruitment';
import { Badge } from '../../../../components/ui/Badge';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Normalise stored source values (e.g. "Website", "LINKEDIN") to the canonical
// lowercase slug used in our i18n keys (recruit_source_website, _linkedin, …).
// Unknown values fall through to the raw label.
function resolveSourceLabel(
  source: string | null | undefined,
  t: (key: string) => string,
): string | null {
  if (!source) return null;
  const slug = source.toLowerCase().trim().replace(/[\s-]+/g, '_');
  const key = `recruit_source_${slug}`;
  const translated = t(key);
  // If the i18n layer returns the raw key back, it means there was no match.
  if (translated === key) return source;
  return translated;
}

function CandidateCard({
  candidate,
  stages,
  t,
  onMove,
}: {
  candidate: Candidate;
  stages: typeof RECRUITMENT_STAGES;
  t: (key: string) => string;
  onMove: (id: string, stage: CandidateStage) => void;
}) {
  const handleLongPress = useCallback(() => {
    Alert.alert(t('recruit_moveToStage'), candidate.full_name, [
      ...stages.map((s) => ({
        text: t(`recruit_stage_${s.key}`),
        onPress: () => onMove(candidate.id, s.key),
      })),
      { text: t('cancel'), style: 'cancel' as const },
    ]);
  }, [candidate, onMove, t, stages]);

  const sourceLabel = resolveSourceLabel(candidate.source, t);

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/(app)/hr/recruitment/[id]',
          params: { id: candidate.id },
        })
      }
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      style={styles.candidateCard}
    >
      <Text style={styles.candidateName} numberOfLines={1}>
        {candidate.full_name}
      </Text>
      {candidate.region && (
        <Text style={styles.candidateRegion}>{candidate.region}</Text>
      )}
      {(candidate.experience_years != null || sourceLabel) && (
        <View style={styles.candidateMeta}>
          {candidate.experience_years != null && (
            <Badge
              label={`${candidate.experience_years} ${t('recruit_experienceYearsShort')}`}
              variant="info"
              size="sm"
            />
          )}
          {sourceLabel && (
            <Text style={styles.candidateSource} numberOfLines={1}>
              {sourceLabel}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function AccordionStage({
  stageKey,
  stageColor,
  candidates,
  allStages,
  t,
  onMove,
  expanded,
  onToggle,
}: {
  stageKey: CandidateStage;
  stageColor: string;
  candidates: Candidate[];
  allStages: typeof RECRUITMENT_STAGES;
  t: (key: string) => string;
  onMove: (id: string, stage: CandidateStage) => void;
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
        <View style={[styles.stageColorDot, { backgroundColor: stageColor }]} />
        <Text style={styles.stageName} numberOfLines={1}>
          {t(`recruit_stage_${stageKey}`)}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{candidates.length}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={18}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accordionBody}>
          {candidates.length === 0 ? (
            <Text style={styles.emptyStage}>{t('recruit_noCandidates')}</Text>
          ) : (
            candidates.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                stages={allStages}
                t={t}
                onMove={onMove}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function RecruitmentScreen() {
  const { t } = useI18n();
  const { data: candidates, isLoading } = useCandidates();
  const updateCandidate = useUpdateCandidate();

  const candidatesByStage = useMemo(() => {
    const map: Record<string, Candidate[]> = {};
    for (const stage of RECRUITMENT_STAGES) {
      map[stage.key] = [];
    }
    for (const c of candidates ?? []) {
      if (map[c.stage]) {
        map[c.stage].push(c);
      } else {
        map['applied']?.push(c);
      }
    }
    return map;
  }, [candidates]);

  // Explicit toggle overrides auto-expansion.
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(
    {},
  );

  const isExpanded = useCallback(
    (stageKey: string) => {
      if (stageKey in expandedStages) return expandedStages[stageKey];
      const stageCandidates = candidatesByStage[stageKey];
      return stageCandidates != null && stageCandidates.length > 0;
    },
    [expandedStages, candidatesByStage],
  );

  const toggleStage = useCallback(
    (stageKey: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedStages((prev) => ({
        ...prev,
        [stageKey]:
          prev[stageKey] !== undefined
            ? !prev[stageKey]
            : !(candidatesByStage[stageKey]?.length > 0),
      }));
    },
    [candidatesByStage],
  );

  const handleMove = useCallback(
    (id: string, stage: CandidateStage) => {
      updateCandidate.mutate({ id, stage });
    },
    [updateCandidate],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('recruit_title'),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(app)/hr/recruitment/create')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="add-circle-outline"
                size={26}
                color={colors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {RECRUITMENT_STAGES.map((stage) => (
          <AccordionStage
            key={stage.key}
            stageKey={stage.key}
            stageColor={stage.color}
            candidates={candidatesByStage[stage.key] ?? []}
            allStages={RECRUITMENT_STAGES}
            t={t}
            onMove={handleMove}
            expanded={isExpanded(stage.key)}
            onToggle={() => toggleStage(stage.key)}
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
  candidateCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  candidateName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  candidateRegion: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  candidateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  candidateSource: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    flexShrink: 1,
  },
});
