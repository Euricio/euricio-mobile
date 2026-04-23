import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../constants/theme';
import type { ContributionStatus } from '../../lib/contributor/types';

const LABEL_ES: Record<ContributionStatus, string> = {
  submitted: 'Enviado', reviewing: 'En revisión', community_backed: 'Apoyo de la comunidad',
  planned: 'Planificado', in_dev: 'En desarrollo', implemented: 'Implementado',
  not_planned: 'No planificado', rejected: 'Rechazado',
};

const TONE: Record<ContributionStatus, { bg: string; fg: string }> = {
  submitted: { bg: colors.borderLight, fg: colors.textSecondary },
  reviewing: { bg: colors.infoLight, fg: colors.info },
  community_backed: { bg: colors.warningLight, fg: colors.warning },
  planned: { bg: colors.infoLight, fg: colors.info },
  in_dev: { bg: colors.warningLight, fg: colors.warning },
  implemented: { bg: colors.successLight, fg: colors.success },
  not_planned: { bg: colors.borderLight, fg: colors.textSecondary },
  rejected: { bg: colors.errorLight, fg: colors.error },
};

export function StatusPill({ status }: { status: ContributionStatus }) {
  const tone = TONE[status];
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{LABEL_ES[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: borderRadius.sm, alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: fontWeight.medium },
});
