import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import { FormToggle } from '../ui/FormToggle';
import { CollapsibleSection } from '../ui/CollapsibleSection';
import { FIELD_DEFINITIONS } from '../../lib/valuation/field-definitions';
import type { PropertyValuationFields, ValuationProfile } from '../../lib/valuation/types';
import { colors, fontSize, spacing } from '../../constants/theme';

interface DynamicFieldGroupProps {
  profile: ValuationProfile;
  fields: PropertyValuationFields;
  onChange: (key: string, value: unknown) => void;
}

export function DynamicFieldGroup({ profile, fields, onChange }: DynamicFieldGroupProps) {
  return (
    <View>
      {profile.field_groups.map((group) => (
        <CollapsibleSection
          key={group.id}
          title={group.label_es /* TODO i18n */}
          defaultOpen={!group.collapsed}
        >
          {group.fields.map((fieldName) => {
            const def = FIELD_DEFINITIONS[fieldName];
            if (!def) return null;
            const value = fields[fieldName];
            const label = def.label_es + (def.unit ? ` (${def.unit})` : '');

            switch (def.type) {
              case 'number':
                return (
                  <FormInput
                    key={fieldName}
                    label={label /* TODO i18n */}
                    value={value != null ? String(value) : ''}
                    onChangeText={(txt) => {
                      const num = txt === '' ? undefined : Number(txt.replace(',', '.'));
                      onChange(fieldName, num);
                    }}
                    keyboardType="numeric"
                    placeholder={def.help_es}
                  />
                );
              case 'text':
                return (
                  <FormInput
                    key={fieldName}
                    label={label}
                    value={value != null ? String(value) : ''}
                    onChangeText={(txt) => onChange(fieldName, txt)}
                  />
                );
              case 'date':
                return (
                  <FormInput
                    key={fieldName}
                    label={label}
                    value={value != null ? String(value) : ''}
                    onChangeText={(txt) => onChange(fieldName, txt)}
                    placeholder="YYYY-MM-DD"
                  />
                );
              case 'boolean':
                return (
                  <FormToggle
                    key={fieldName}
                    label={def.label_es /* TODO i18n */}
                    value={Boolean(value)}
                    onChange={(v) => onChange(fieldName, v)}
                  />
                );
              case 'enum':
                return (
                  <FormSelect
                    key={fieldName}
                    label={def.label_es /* TODO i18n */}
                    value={value != null ? String(value) : ''}
                    onChange={(v) => onChange(fieldName, v)}
                    options={(def.options ?? []).map((o) => ({
                      value: o.value,
                      label: o.label_es,
                    }))}
                  />
                );
              case 'categories':
                // Complex nested structure — show a placeholder so users know it
                // exists; full editor requires a custom UI out of scope here.
                return (
                  <View key={fieldName} style={styles.placeholder}>
                    <Text style={styles.placeholderText}>
                      {/* TODO i18n */}
                      {def.label_es}: edición avanzada (próximamente)
                    </Text>
                  </View>
                );
              default:
                return null;
            }
          })}
        </CollapsibleSection>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
