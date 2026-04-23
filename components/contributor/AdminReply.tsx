import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../constants/theme';
import type { AdminReply as AdminReplyRow, ReplyLabel } from '../../lib/contributor/types';

const LABEL_ES: Record<ReplyLabel, string> = {
  product_team: 'Equipo de producto',
  official_answer: 'Respuesta oficial',
  response_from_euricio: 'Respuesta de Euricio',
};

export function AdminReply({ reply }: { reply: AdminReplyRow }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{LABEL_ES[reply.label] ?? reply.label}</Text>
        <Text style={styles.date}>{new Date(reply.created_at).toLocaleString('es-ES')}</Text>
      </View>
      <Text style={styles.body}>{reply.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.borderLight, borderRadius: borderRadius.sm,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5,
    color: colors.primary, fontWeight: fontWeight.bold,
  },
  date: { fontSize: 10, color: colors.textTertiary },
  body: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },
});
