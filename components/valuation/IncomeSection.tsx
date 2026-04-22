import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FormInput } from '../ui/FormInput';
import { FormToggle } from '../ui/FormToggle';
import type { PropertyValuationFields, ValuationProfile } from '../../lib/valuation/types';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

interface IncomeSectionProps {
  fields: PropertyValuationFields;
  onChange: (key: string, val: unknown) => void;
  profile: ValuationProfile;
}

export function IncomeSection({ fields, onChange, profile }: IncomeSectionProps) {
  const hasRendimiento = profile.methods.some((m) => m.method === 'rendimiento');
  if (!hasRendimiento) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{/* TODO i18n */ 'Rendimiento / Alquiler'}</Text>
      <FormToggle
        label="¿Actualmente alquilado?" /* TODO i18n */
        value={Boolean(fields.is_rented)}
        onChange={(v) => onChange('is_rented', v)}
      />
      <FormInput
        label="Alquiler mensual (€)" /* TODO i18n */
        keyboardType="numeric"
        value={fields.monthly_rent != null ? String(fields.monthly_rent) : ''}
        onChangeText={(t) =>
          onChange('monthly_rent', t === '' ? undefined : Number(t))
        }
      />
      <FormInput
        label="Gastos anuales (€)" /* TODO i18n */
        keyboardType="numeric"
        value={fields.annual_operating_costs != null ? String(fields.annual_operating_costs) : ''}
        onChangeText={(t) =>
          onChange('annual_operating_costs', t === '' ? undefined : Number(t))
        }
      />
      <FormInput
        label="Vacancia esperada (0-1)" /* TODO i18n */
        keyboardType="numeric"
        placeholder="0.05"
        value={fields.vacancy_ratio != null ? String(fields.vacancy_ratio) : ''}
        onChangeText={(t) =>
          onChange('vacancy_ratio', t === '' ? undefined : Number(t.replace(',', '.')))
        }
      />
      <FormInput
        label="Plazo contrato (años)" /* TODO i18n */
        keyboardType="numeric"
        value={fields.contract_term_years != null ? String(fields.contract_term_years) : ''}
        onChangeText={(t) =>
          onChange('contract_term_years', t === '' ? undefined : Number(t))
        }
      />
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
