import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { BUSY_PRESETS, BusyPresetKey, buildBusyAnnouncement } from '../../lib/busyPresets';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

export interface BusyPresetValues {
  busy_preset: BusyPresetKey;
  busy_callback_time: string;
  busy_reason: string;
  announcement: string;
}

interface Props {
  values: BusyPresetValues;
  displayName: string;
  onChange: (v: BusyPresetValues) => void;
}

export function BusyPresetPicker({ values, displayName, onChange }: Props) {
  const { t } = useI18n();

  const set = (partial: Partial<BusyPresetValues>) => {
    const next = { ...values, ...partial };
    if (next.busy_preset !== 'custom') {
      next.announcement = buildBusyAnnouncement(
        next.busy_preset,
        displayName,
        next.busy_callback_time,
        t,
      );
    }
    onChange(next);
  };

  const preview =
    values.busy_preset === 'custom'
      ? values.announcement
      : buildBusyAnnouncement(values.busy_preset, displayName, values.busy_callback_time, t);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('busy.preset_label')}</Text>
      <View style={styles.grid}>
        {BUSY_PRESETS.map(p => {
          const active = values.busy_preset === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => set({ busy_preset: p.key })}
              activeOpacity={0.7}
            >
              <Text style={styles.chipIcon}>{p.icon}</Text>
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]} numberOfLines={1}>
                {t(`busy.presets.${p.key}.label`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.label, { marginTop: spacing.md }]}>{t('busy.callback_time_label')}</Text>
      <TextInput
        value={values.busy_callback_time}
        onChangeText={text => set({ busy_callback_time: text })}
        placeholder="14:00"
        style={styles.input}
        placeholderTextColor={colors.textTertiary}
      />

      {values.busy_preset === 'custom' ? (
        <>
          <Text style={[styles.label, { marginTop: spacing.md }]}>{t('busy.custom_reason_label')}</Text>
          <TextInput
            value={values.busy_reason}
            onChangeText={text => set({ busy_reason: text })}
            style={styles.input}
            placeholderTextColor={colors.textTertiary}
          />
          <Text style={[styles.label, { marginTop: spacing.md }]}>{t('busy.custom_announcement_label')}</Text>
          <TextInput
            value={values.announcement}
            onChangeText={text => onChange({ ...values, announcement: text })}
            multiline
            numberOfLines={3}
            style={styles.textarea}
            placeholderTextColor={colors.textTertiary}
          />
        </>
      ) : (
        <>
          <Text style={[styles.label, { marginTop: spacing.md }]}>{t('busy.announcement_preview')}</Text>
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>{preview}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium, marginBottom: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexBasis: '31%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.successLight },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: fontSize.xs, color: colors.text, flexShrink: 1 },
  chipLabelActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.sm, fontSize: fontSize.sm, color: colors.text, backgroundColor: colors.surface,
  },
  textarea: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.sm, fontSize: fontSize.sm, color: colors.text,
    backgroundColor: colors.surface, textAlignVertical: 'top', minHeight: 72,
  },
  previewBox: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  previewText: { fontSize: fontSize.sm, color: colors.textSecondary, fontStyle: 'italic' },
});
