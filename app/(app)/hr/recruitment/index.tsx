import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
import { Card } from '../../../../components/ui/Card';
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

const COLUMN_WIDTH = 260;

function CandidateCard({
  candidate,
  t,
  onMove,
}: {
  candidate: Candidate;
  t: (key: string) => string;
  onMove: (id: string, stage: CandidateStage) => void;
}) {
  const handleLongPress = useCallback(() => {
    Alert.alert(t('recruit_moveToStage'), candidate.full_name, [
      ...RECRUITMENT_STAGES.map((s) => ({
        text: t(`recruit_stage_${s.key}`),
        onPress: () => onMove(candidate.id, s.key),
      })),
      { text: t('cancel'), style: 'cancel' as const },
    ]);
  }, [candidate, onMove, t]);

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(app)/hr/recruitment/[id]', params: { id: candidate.id } })}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      style={styles.candidateCard}
    >
      <Text style={styles.candidateName} numberOfLines={1}>{candidate.full_name}</Text>
      {candidate.region && (
        <Text style={styles.candidateRegion}>{candidate.region}</Text>
      )}
      <View style={styles.candidateMeta}>
        {candidate.experience_years != null && (
          <Badge label={`${candidate.experience_years} yr`} variant="info" size="sm" />
        )}
        {candidate.source && (
          <Text style={styles.candidateSource}>{t(`recruit_source_${candidate.source}`)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function StageColumn({
  stageKey,
  stageColor,
  candidates,
  t,
  onMove,
}: {
  stageKey: CandidateStage;
  stageColor: string;
  candidates: Candidate[];
  t: (key: string) => string;
  onMove: (id: string, stage: CandidateStage) => void;
}) {
  return (
    <View style={styles.column}>
      <View style={styles.columnHeader}>
        <View style={[styles.stageColorDot, { backgroundColor: stageColor }]} />
        <Text style={styles.columnTitle} numberOfLines={1}>
          {t(`recruit_stage_${stageKey}`)}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{candidates.length}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.columnScroll}
        showsVerticalScrollIndicator={false}
      >
        {candidates.length === 0 ? (
          <Text style={styles.emptyStage}>{t('recruit_noCandidates')}</Text>
        ) : (
          candidates.map((c) => (
            <CandidateCard key={c.id} candidate={c} t={t} onMove={onMove} />
          ))
        )}
      </ScrollView>
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
              <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
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
        {RECRUITMENT_STAGES.map((stage) => (
          <StageColumn
            key={stage.key}
            stageKey={stage.key}
            stageColor={stage.color}
            candidates={candidatesByStage[stage.key] ?? []}
            t={t}
            onMove={handleMove}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  boardContent: { padding: spacing.sm, gap: spacing.sm },
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
  stageColorDot: { width: 12, height: 12, borderRadius: 6 },
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
  countText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  columnScroll: { flex: 1, padding: spacing.sm },
  emptyStage: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
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
  },
  candidateSource: { fontSize: fontSize.xs, color: colors.textTertiary },
});
