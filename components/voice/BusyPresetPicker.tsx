import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { BUSY_PRESETS, BusyPresetKey, buildBusyAnnouncement } from '../../lib/busyPresets';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

const DURATION_MINUTES = [15, 30, 45, 60, 90, 120] as const;

function formatCallbackFromMinutes(minutes: number): string {
  const d = new Date(Date.now() + minutes * 60_000);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function isDurationActive(currentValue: string, minutes: number): boolean {
  if (!currentValue || !/^\d{1,2}:\d{2}$/.test(currentValue)) return false;
  const [hh, mm] = currentValue.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hh, mm, 0, 0);
  if (target.getTime() < now.getTime() - 60_000) {
    // User picked a past time today → probably means tomorrow; no match
    return false;
  }
  const diffMin = Math.round((target.getTime() - now.getTime()) / 60_000);
  return Math.abs(diffMin - minutes) <= 2;
}

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

      <Text style={[styles.label, { marginTop: spacing.md }]}>{t('busy_duration_label')}</Text>
      <View style={styles.durationRow}>
        {DURATION_MINUTES.map(min => {
          const active = isDurationActive(values.busy_callback_time, min);
          return (
            <TouchableOpacity
              key={min}
              style={[styles.durationChip, active && styles.durationChipActive]}
              onPress={() => set({ busy_callback_time: formatCallbackFromMinutes(min) })}
              activeOpacity={0.7}
            >
              <Text style={[styles.durationChipLabel, active && styles.durationChipLabelActive]}>
                {min < 60 ? `${min}m` : `${min / 60}h`}
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
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  durationChip: {
    flexBasis: '15%',
    flexGrow: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.successLight,
  },
  durationChipLabel: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  durationChipLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
