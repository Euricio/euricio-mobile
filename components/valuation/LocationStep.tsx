import React, { useState } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import { Button } from '../ui/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';
import type { NotaryPriceCache } from '../../lib/api/valuations';

interface LocationStepProps {
  postalCode: string;
  country: string;
  onChange: (patch: { postalCode?: string; country?: string }) => void;
  notaryCache?: NotaryPriceCache | null;
  onNotaryInput: (price: number) => Promise<void>;
}

const COUNTRIES = [
  { value: 'ES', label: 'España (ES)' },
  { value: 'DE', label: 'Alemania (DE)' },
  { value: 'PT', label: 'Portugal (PT)' },
  { value: 'AT', label: 'Austria (AT)' },
  { value: 'FR', label: 'Francia (FR)' },
  { value: 'IT', label: 'Italia (IT)' },
  { value: 'CH', label: 'Suiza (CH)' },
];

function buildNotaryPortalUrl(pc: string, cached?: NotaryPriceCache | null): string {
  if (cached?.notary_portal_url) return cached.notary_portal_url;
  return `https://www.penotariado.com/inmobiliario/en/housing-price-finder?locationType=CP&locationCode=${encodeURIComponent(pc)}&kpi=pricePerSqm&constructionType=99&propertyType=99`;
}

export function LocationStep({
  postalCode,
  country,
  onChange,
  notaryCache,
  onNotaryInput,
}: LocationStepProps) {
  const [manualPrice, setManualPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const validPc = /^\d{5}$/.test(postalCode);
  const showNotary = country === 'ES' && validPc;

  const handleSave = async () => {
    const num = Number(manualPrice);
    if (!Number.isFinite(num) || num <= 0) return;
    setSaving(true);
    try {
      await onNotaryInput(num);
      setManualPrice('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <FormSelect
        label="País" /* TODO i18n */
        options={COUNTRIES}
        value={country}
        onChange={(v) => onChange({ country: v })}
        required
      />
      <FormInput
        label="Código Postal" /* TODO i18n */
        value={postalCode}
        onChangeText={(v) => onChange({ postalCode: v })}
        keyboardType="numeric"
        placeholder="28001"
        maxLength={10}
        required
      />

      {showNotary && notaryCache && notaryCache.cached && (
        <View style={styles.cacheOk}>
          <View style={styles.cacheRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.cacheText}>
              {/* TODO i18n */}
              Portal Notariado: {notaryCache.price_per_sqm?.toLocaleString('es-ES')} €/m²
            </Text>
          </View>
          <Text style={styles.cacheMeta}>
            {/* TODO i18n */}
            Hace {notaryCache.age_days ?? 0} días
            {notaryCache.reference_period ? ` · ${notaryCache.reference_period}` : ''}
          </Text>
          <Button
            title="Re-verificar en portal" /* TODO i18n */
            variant="ghost"
            size="sm"
            onPress={() =>
              Linking.openURL(buildNotaryPortalUrl(postalCode, notaryCache))
            }
          />
        </View>
      )}

      {showNotary && notaryCache && !notaryCache.cached && (
        <View style={styles.cacheMissing}>
          <View style={styles.cacheRow}>
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <Text style={styles.cacheTitle}>
              {/* TODO i18n */}
              Precio no disponible en caché
            </Text>
          </View>
          <Text style={styles.cacheHint}>
            {/* TODO i18n */}
            Consulta el Portal Notariado y pega el valor €/m².
          </Text>
          <Button
            title="Abrir Portal Notariado" /* TODO i18n */
            variant="outline"
            size="sm"
            onPress={() =>
              Linking.openURL(buildNotaryPortalUrl(postalCode, notaryCache))
            }
            style={{ marginBottom: spacing.sm }}
          />
          <FormInput
            label="€/m² del portal" /* TODO i18n */
            value={manualPrice}
            onChangeText={setManualPrice}
            keyboardType="numeric"
            placeholder="2500"
          />
          <Button
            title={saving ? 'Guardando...' : 'Guardar'} /* TODO i18n */
            onPress={handleSave}
            disabled={!manualPrice || saving}
            loading={saving}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cacheOk: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cacheMissing: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cacheRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cacheText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  cacheTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  cacheMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  cacheHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
});
