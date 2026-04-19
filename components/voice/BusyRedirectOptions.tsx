import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { useVoiceTeamMembers, RedirectMode, TeamMember } from '../../lib/api/busyStatus';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

interface BusyRedirectValues {
  announcement: string;
  redirect_mode: RedirectMode;
  redirect_agent_id: string | null;
  redirect_number: string;
}

interface Props {
  values: BusyRedirectValues;
  onChange: (v: BusyRedirectValues) => void;
  hideAnnouncement?: boolean;
}

export function BusyRedirectOptions({ values, onChange, hideAnnouncement }: Props) {
  const { t } = useI18n();
  const { data: teamMembers = [] } = useVoiceTeamMembers();

  const set = (partial: Partial<BusyRedirectValues>) =>
    onChange({ ...values, ...partial });

  const modes: Array<{ key: RedirectMode; label: string }> = [
    { key: 'next_in_flow', label: t('busy_redirect_next_in_flow') },
    { key: 'specific_agent', label: t('busy_redirect_specific_agent') },
    { key: 'external_number', label: t('busy_redirect_external_number') },
  ];

  return (
    <View style={styles.container}>
      {!hideAnnouncement && (
        <>
          <Text style={styles.label}>{t('busy_announcement_label')}</Text>
          <TextInput
            value={values.announcement}
            onChangeText={text => set({ announcement: text })}
            placeholder={t('busy_announcement_placeholder')}
            multiline
            numberOfLines={3}
            style={styles.textarea}
            placeholderTextColor={colors.textTertiary}
          />
        </>
      )}

      {/* Redirect mode */}
      <Text style={[styles.label, hideAnnouncement ? undefined : { marginTop: spacing.md }]}>{t('busy_redirect_label')}</Text>
      {modes.map(mode => (
        <TouchableOpacity
          key={mode.key}
          style={[styles.radioRow, values.redirect_mode === mode.key && styles.radioRowActive]}
          onPress={() => set({ redirect_mode: mode.key, redirect_agent_id: null, redirect_number: '' })}
          activeOpacity={0.7}
        >
          <View style={[styles.radioCircle, values.redirect_mode === mode.key && styles.radioCircleActive]} />
          <Text style={[styles.radioLabel, values.redirect_mode === mode.key && styles.radioLabelActive]}>
            {mode.label}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Specific agent dropdown (native scroll list) */}
      {values.redirect_mode === 'specific_agent' && (
        <View style={styles.agentList}>
          {teamMembers.length === 0 ? (
            <Text style={styles.emptyText}>{t('busy_redirect_select_agent')}</Text>
          ) : (
            teamMembers.map((m: TeamMember) => (
              <TouchableOpacity
                key={m.user_id}
                style={[styles.agentRow, values.redirect_agent_id === m.user_id && styles.agentRowActive]}
                onPress={() => set({ redirect_agent_id: m.user_id })}
              >
                <Text style={[styles.agentName, values.redirect_agent_id === m.user_id && styles.agentNameActive]}>
                  {m.full_name || m.email || m.user_id}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* External number input */}
      {values.redirect_mode === 'external_number' && (
        <TextInput
          value={values.redirect_number}
          onChangeText={text => set({ redirect_number: text })}
          placeholder={t('busy_redirect_external_placeholder')}
          keyboardType="phone-pad"
          style={styles.input}
          placeholderTextColor={colors.textTertiary}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium, marginBottom: 2 },
  textarea: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.sm, fontSize: fontSize.sm, color: colors.text,
    backgroundColor: colors.surface, textAlignVertical: 'top', minHeight: 72,
  },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    padding: spacing.sm, fontSize: fontSize.sm, color: colors.text,
    backgroundColor: colors.surface, marginTop: spacing.xs,
  },
  radioRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  radioRowActive: { borderColor: colors.primary, backgroundColor: colors.successLight },
  radioCircle: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: colors.border, backgroundColor: 'transparent',
  },
  radioCircleActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioLabel: { fontSize: fontSize.sm, color: colors.text },
  radioLabelActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  agentList: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md,
    overflow: 'hidden', marginTop: spacing.xs,
  },
  agentRow: { padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  agentRowActive: { backgroundColor: colors.successLight },
  agentName: { fontSize: fontSize.sm, color: colors.text },
  agentNameActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  emptyText: { padding: spacing.sm, color: colors.textTertiary, fontSize: fontSize.sm },
});
