import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import { FormToggle } from '../ui/FormToggle';
import type { PropertyValuationFields } from '../../lib/valuation/types';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

interface VpoSectionProps {
  vpo: PropertyValuationFields;
  onChange: (key: string, val: unknown) => void;
  visible: boolean;
}

const STATUS_OPTIONS = [
  { value: 'no', label: 'No es VPO' },
  { value: 'si', label: 'Sí, vigente' },
  { value: 'dudosa', label: 'Dudosa' },
  { value: 'descalificada', label: 'Descalificada' },
];

const TIPO_OPTIONS = [
  { value: 'regimen_general', label: 'Régimen general' },
  { value: 'regimen_especial', label: 'Régimen especial' },
  { value: 'precio_tasado', label: 'Precio tasado' },
  { value: 'otro', label: 'Otro' },
];

const REGIMEN_OPTIONS = [
  { value: 'compraventa', label: 'Compraventa' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'alquiler_con_opcion', label: 'Alquiler con opción' },
];

export function VpoSection({ vpo, onChange, visible }: VpoSectionProps) {
  if (!visible) return null;

  const status = (vpo.vpo_status as string) || 'no';
  const showExtra = status !== 'no';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{/* TODO i18n */ 'Vivienda de Protección Oficial (VPO)'}</Text>

      <FormSelect
        label="Estado VPO" /* TODO i18n */
        options={STATUS_OPTIONS}
        value={status}
        onChange={(v) => onChange('vpo_status', v)}
      />

      {showExtra && (
        <>
          <FormSelect
            label="Tipo" /* TODO i18n */
            options={TIPO_OPTIONS}
            value={(vpo.vpo_tipo as string) || ''}
            onChange={(v) => onChange('vpo_tipo', v)}
          />
          <FormSelect
            label="Régimen" /* TODO i18n */
            options={REGIMEN_OPTIONS}
            value={(vpo.vpo_regimen as string) || ''}
            onChange={(v) => onChange('vpo_regimen', v)}
          />
          <FormInput
            label="Precio máximo (€/m²)" /* TODO i18n */
            keyboardType="numeric"
            value={vpo.vpo_precio_maximo != null ? String(vpo.vpo_precio_maximo) : ''}
            onChangeText={(t) =>
              onChange('vpo_precio_maximo', t === '' ? undefined : Number(t))
            }
          />
          <FormInput
            label="Fecha calificación" /* TODO i18n */
            placeholder="YYYY-MM-DD"
            value={(vpo.vpo_fecha_calificacion as string) || ''}
            onChangeText={(t) => onChange('vpo_fecha_calificacion', t)}
          />
          <FormToggle
            label="Limitaciones de transmisión" /* TODO i18n */
            value={Boolean(vpo.vpo_limitaciones_transmision)}
            onChange={(v) => onChange('vpo_limitaciones_transmision', v)}
          />
          <FormToggle
            label="Autorización necesaria" /* TODO i18n */
            value={Boolean(vpo.vpo_autorizacion_necesaria)}
            onChange={(v) => onChange('vpo_autorizacion_necesaria', v)}
          />
          <FormInput
            label="Observaciones" /* TODO i18n */
            value={(vpo.vpo_observaciones as string) || ''}
            onChangeText={(t) => onChange('vpo_observaciones', t)}
            multiline
            numberOfLines={3}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
});
