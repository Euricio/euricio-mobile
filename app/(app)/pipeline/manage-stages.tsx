import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import type { Locale } from '../../../lib/i18n';
import {
  usePipelineStages,
  useCreateStage,
  useUpdateStage,
  useDeleteStage,
  getStageName,
} from '../../../lib/api/pipeline';
import type { PipelineStage } from '../../../lib/api/pipeline';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

const STAGE_COLORS = [
  '#636366', '#0a84ff', '#bf5af2', '#ffd60a',
  '#30d158', '#ff453a', '#ff375f', '#64d2ff',
];

function StageForm({
  initial,
  onSave,
  onCancel,
  t,
}: {
  initial?: Partial<PipelineStage>;
  onSave: (data: Partial<PipelineStage>) => void;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  const [nameDe, setNameDe] = useState(initial?.name_de || '');
  const [nameEn, setNameEn] = useState(initial?.name_en || '');
  const [nameEs, setNameEs] = useState(initial?.name_es || '');
  const [selectedColor, setSelectedColor] = useState(initial?.color || STAGE_COLORS[0]);
  const [isWon, setIsWon] = useState(initial?.is_won || false);
  const [isLost, setIsLost] = useState(initial?.is_lost || false);

  const handleSave = () => {
    if (!nameDe.trim()) return;
    onSave({
      name_de: nameDe.trim(),
      name_en: nameEn.trim() || nameDe.trim(),
      name_es: nameEs.trim() || nameDe.trim(),
      stage_key: initial?.stage_key || nameDe.trim().toLowerCase().replace(/\s+/g, '_'),
      color: selectedColor,
      is_won: isWon,
      is_lost: isLost,
    });
  };

  return (
    <Card style={styles.formCard}>
      <Text style={styles.inputLabel}>{t('pipeline_stageNameDe')} *</Text>
      <TextInput
        style={styles.input}
        value={nameDe}
        onChangeText={setNameDe}
        placeholder="z.B. Qualifiziert"
      />
      <Text style={styles.inputLabel}>{t('pipeline_stageNameEn')}</Text>
      <TextInput
        style={styles.input}
        value={nameEn}
        onChangeText={setNameEn}
        placeholder="e.g. Qualified"
      />
      <Text style={styles.inputLabel}>{t('pipeline_stageNameEs')}</Text>
      <TextInput
        style={styles.input}
        value={nameEs}
        onChangeText={setNameEs}
        placeholder="p.ej. Cualificado"
      />
      <Text style={styles.inputLabel}>{t('pipeline_stageColor')}</Text>
      <View style={styles.colorRow}>
        {STAGE_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              selectedColor === c && styles.colorSwatchActive,
            ]}
            onPress={() => setSelectedColor(c)}
          />
        ))}
      </View>
      <View style={styles.flagRow}>
        <TouchableOpacity
          style={[styles.flagChip, isWon && styles.flagChipActive]}
          onPress={() => { setIsWon(!isWon); if (!isWon) setIsLost(false); }}
        >
          <Ionicons name="trophy-outline" size={16} color={isWon ? colors.white : colors.success} />
          <Text style={[styles.flagText, isWon && styles.flagTextActive]}>
            {t('pipeline_stageWon')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.flagChip, isLost && styles.flagChipLostActive]}
          onPress={() => { setIsLost(!isLost); if (!isLost) setIsWon(false); }}
        >
          <Ionicons name="close-circle-outline" size={16} color={isLost ? colors.white : colors.error} />
          <Text style={[styles.flagText, isLost && styles.flagTextActive]}>
            {t('pipeline_stageLost')}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.formActions}>
        <Button title={t('cancel')} onPress={onCancel} variant="secondary" />
        <Button title={t('save')} onPress={handleSave} />
      </View>
    </Card>
  );
}

export default function ManageStagesScreen() {
  const { t, locale } = useI18n();
  const { data: stages, isLoading } = usePipelineStages();
  const createStage = useCreateStage();
  const updateStage = useUpdateStage();
  const deleteStage = useDeleteStage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleDelete = (stage: PipelineStage) => {
    if (stage.is_default) return;
    Alert.alert(t('pipeline_deleteStage'), t('pipeline_deleteStageConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => deleteStage.mutate(stage.id),
      },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('pipeline_manageStages') }} />

      {(stages ?? []).map((stage) => (
        <React.Fragment key={stage.id}>
          {editingId === stage.id ? (
            <StageForm
              initial={stage}
              onSave={(data) => {
                updateStage.mutate({ id: stage.id, ...data });
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
              t={t}
            />
          ) : (
            <Card style={styles.stageCard}>
              <View style={styles.stageRow}>
                <View style={[styles.stageColorDot, { backgroundColor: stage.color }]} />
                <View style={styles.stageInfo}>
                  <Text style={styles.stageName}>
                    {getStageName(stage, locale)}
                  </Text>
                  <View style={styles.stageFlags}>
                    {stage.is_won && (
                      <View style={[styles.flagBadge, { backgroundColor: colors.successLight }]}>
                        <Text style={[styles.flagBadgeText, { color: colors.success }]}>
                          {t('pipeline_won')}
                        </Text>
                      </View>
                    )}
                    {stage.is_lost && (
                      <View style={[styles.flagBadge, { backgroundColor: colors.errorLight }]}>
                        <Text style={[styles.flagBadgeText, { color: colors.error }]}>
                          {t('pipeline_lost')}
                        </Text>
                      </View>
                    )}
                    {stage.is_default && (
                      <View style={[styles.flagBadge, { backgroundColor: colors.infoLight }]}>
                        <Text style={[styles.flagBadgeText, { color: colors.info }]}>
                          {t('pipeline_stageDefault')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setEditingId(stage.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                {!stage.is_default && (
                  <TouchableOpacity
                    onPress={() => handleDelete(stage)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ marginLeft: spacing.sm }}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          )}
        </React.Fragment>
      ))}

      {showCreate ? (
        <StageForm
          onSave={(data) => {
            createStage.mutate({
              ...data,
              sort_order: (stages?.length ?? 0) + 1,
            });
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
          t={t}
        />
      ) : (
        <Button
          title={t('pipeline_addStage')}
          onPress={() => setShowCreate(true)}
          icon={<Ionicons name="add-outline" size={18} color={colors.white} />}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
    gap: spacing.sm,
  },
  stageCard: {
    marginBottom: 0,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stageColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stageInfo: {
    flex: 1,
  },
  stageName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  stageFlags: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  flagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  flagBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  formCard: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: colors.text,
    borderWidth: 3,
  },
  flagRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  flagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  flagChipActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  flagChipLostActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  flagText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  flagTextActive: {
    color: colors.white,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
