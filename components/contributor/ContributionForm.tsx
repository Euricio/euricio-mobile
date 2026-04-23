import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../constants/theme';
import { apiPost } from '../../lib/contributor/api';
import type { ContributionTypeId } from '../../lib/contributor/types';

type Mode = 'feedback' | 'idea';

const FEEDBACK_TYPES: { id: ContributionTypeId; label: string; desc: string }[] = [
  { id: 'bug', label: 'Bug', desc: 'Algo que no funciona.' },
  { id: 'improvement', label: 'Mejora', desc: 'Hacer algo mejor.' },
  { id: 'data_contribution', label: 'Datos', desc: 'Información útil.' },
  { id: 'confirmation', label: 'Confirmación', desc: 'Corroborar bug o idea.' },
];

const IDEA_TYPES: { id: ContributionTypeId; label: string; desc: string }[] = [
  { id: 'feature_idea', label: 'Función', desc: 'Nueva capacidad.' },
  { id: 'workflow_idea', label: 'Flujo', desc: 'Flujo optimizado.' },
  { id: 'improvement', label: 'Mejora', desc: 'Refinamiento.' },
];

const MIN_BUG_DESC = 40;
const MIN_IDEA_COMBINED = 80;

export function ContributionForm({
  mode, onSubmitted,
}: { mode: Mode; onSubmitted: (id: number) => void }) {
  const types = mode === 'feedback' ? FEEDBACK_TYPES : IDEA_TYPES;
  const [type, setType] = useState<ContributionTypeId>(types[0].id);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (k: string, v: string) => setBody((b) => ({ ...b, [k]: v }));

  const renderField = (key: string, label: string, ph: string, multi = true) => (
    <View style={styles.field} key={key}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multi && styles.textarea]}
        placeholder={ph}
        placeholderTextColor={colors.textTertiary}
        value={body[key] ?? ''}
        onChangeText={(v) => setField(key, v)}
        multiline={multi}
        textAlignVertical={multi ? 'top' : 'center'}
      />
    </View>
  );

  const renderFields = () => {
    if (type === 'bug') {
      return (
        <>
          {renderField('description', 'Descripción', 'Qué ha pasado')}
          {renderField('reproduction_steps', 'Pasos para reproducir', '1. Abrir...')}
          {renderField('expected_behavior', 'Comportamiento esperado', 'Qué debería pasar')}
          {renderField('actual_behavior', 'Comportamiento actual', 'Qué pasa')}
          {renderField('affected_area', 'Zona afectada', 'Ej. Cartera', false)}
        </>
      );
    }
    if (type === 'improvement') {
      return (
        <>
          {renderField('problem', 'Problema', 'Qué resulta molesto hoy')}
          {renderField('solution', 'Solución propuesta', 'Cómo lo mejorarías')}
          {renderField('why_helpful', 'Por qué ayudaría', 'Quién se beneficia')}
          {renderField('affected_area', 'Zona afectada', 'Ej. Valoraciones', false)}
        </>
      );
    }
    if (type === 'feature_idea' || type === 'workflow_idea') {
      return (
        <>
          {renderField('problem', 'Problema', 'Qué necesidad no está cubierta')}
          {renderField('solution', 'Solución propuesta', 'Describe la función o flujo')}
          {renderField('why_helpful', 'Por qué ayudaría', 'Valor para usuario')}
          {renderField('target_audience', 'Para quién', 'Roles o tipos de usuario', false)}
          {type === 'workflow_idea' && renderField('affected_workflow', 'Flujo afectado', 'Qué proceso cambia', false)}
        </>
      );
    }
    if (type === 'data_contribution') {
      return (
        <>
          {renderField('context', 'Contexto', 'De qué se trata')}
          {renderField('data', 'Datos', 'Detalles, cifras')}
          {renderField('source', 'Fuente', 'URL o referencia', false)}
        </>
      );
    }
    if (type === 'confirmation') {
      return (
        <>
          {renderField('reference_id', 'ID del Bug/Idea', 'Número de la contribución', false)}
          {renderField('note', 'Tu observación', 'Qué has verificado')}
        </>
      );
    }
    return null;
  };

  const validate = (): string | null => {
    if (title.trim().length < 6) return 'El título es demasiado corto.';
    if (type === 'bug' && (body.description ?? '').trim().length < MIN_BUG_DESC)
      return `La descripción debe tener al menos ${MIN_BUG_DESC} caracteres.`;
    if (type === 'improvement' || type === 'feature_idea' || type === 'workflow_idea') {
      const combined = ((body.problem ?? '') + (body.solution ?? '') + (body.why_helpful ?? '')).trim().length;
      if (combined < MIN_IDEA_COMBINED)
        return `Problema + solución + justificación: al menos ${MIN_IDEA_COMBINED} caracteres.`;
    }
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) { Alert.alert('Revisa el formulario', v); return; }
    setSubmitting(true);
    try {
      const json = await apiPost<{ contribution?: { id: number }; id?: number }>('/api/contributions', {
        type, title: title.trim(), body,
      });
      const id = json.contribution?.id ?? json.id ?? 0;
      onSubmitted(id);
    } catch (e) {
      const status = (e as Error & { status?: number }).status;
      if (status === 429) Alert.alert('Límite', 'Has alcanzado el límite diario.');
      else if (status === 403) Alert.alert('Rango', 'Tu rango no permite este tipo.');
      else Alert.alert('Error', (e as Error).message);
    } finally { setSubmitting(false); }
  };

  return (
    <ScrollView>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Tipo</Text>
        <View style={styles.typeGrid}>
          {types.map((o) => {
            const active = type === o.id;
            return (
              <TouchableOpacity
                key={o.id}
                activeOpacity={0.7}
                onPress={() => setType(o.id)}
                style={[styles.typeCard, active && styles.typeCardActive]}
              >
                <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{o.label}</Text>
                <Text style={styles.typeDesc}>{o.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Resumen en una frase"
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {renderFields()}

      <TouchableOpacity
        activeOpacity={0.7}
        disabled={submitting}
        onPress={submit}
        style={[styles.submit, submitting && styles.submitDisabled]}
      >
        <Text style={styles.submitText}>{submitting ? 'Enviando…' : 'Enviar contribución'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.sm, padding: spacing.sm, fontSize: fontSize.sm,
    color: colors.text,
  },
  textarea: { minHeight: 80 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeCard: {
    flexGrow: 1, flexBasis: '45%', padding: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  typeCardActive: { borderColor: colors.primary, backgroundColor: colors.borderLight },
  typeLabel: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  typeLabelActive: { color: colors.primary },
  typeDesc: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  submit: {
    backgroundColor: colors.primary, borderRadius: borderRadius.sm,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.md,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
