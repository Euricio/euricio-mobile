import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../constants/theme';
import type { ProfileVisibility } from '../../lib/contributor/types';

const OPTIONS: { id: ProfileVisibility; label: string; desc: string }[] = [
  { id: 'private', label: 'Privado', desc: 'Solo tú ves tu perfil.' },
  { id: 'registered', label: 'Registrados', desc: 'Otros usuarios pueden ver tu perfil.' },
  { id: 'leaderboard', label: 'Tabla pública', desc: 'Apareces en rankings globales.' },
];

export function VisibilityToggle({
  value, onChange,
}: { value: ProfileVisibility; onChange: (v: ProfileVisibility) => void }) {
  return (
    <View>
      {OPTIONS.map((o) => {
        const active = value === o.id;
        return (
          <TouchableOpacity
            key={o.id}
            onPress={() => onChange(o.id)}
            activeOpacity={0.7}
            style={[styles.opt, active && styles.optActive]}
          >
            <View style={[styles.radio, active && styles.radioActive]}>
              {active && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{o.label}</Text>
              <Text style={styles.desc}>{o.desc}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  opt: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm,
    padding: spacing.md, marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  optActive: { borderColor: colors.primary, backgroundColor: colors.borderLight },
  radio: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 1.5, borderColor: colors.border,
    marginTop: 2, alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  label: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  desc: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
});
