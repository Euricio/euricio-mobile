import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Stepper } from '../../../components/valuation/Stepper';
import { PropertyTypePicker } from '../../../components/valuation/PropertyTypePicker';
import { LocationStep } from '../../../components/valuation/LocationStep';
import { DynamicFieldGroup } from '../../../components/valuation/DynamicFieldGroup';
import { VpoSection } from '../../../components/valuation/VpoSection';
import { IncomeSection } from '../../../components/valuation/IncomeSection';
import { ResultV2 } from '../../../components/valuation/ResultV2';
import {
  calculateV2,
  getNotaryPrice,
  postNotaryPrice,
} from '../../../lib/api/valuations';
import type {
  CalculateV2Input,
  NotaryPriceCache,
} from '../../../lib/api/valuations';
import type {
  PropertyType,
  PropertyValuationFields,
  ValuationResultV2,
} from '../../../lib/valuation/types';
import { getProfile } from '../../../lib/valuation/property-types';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
} from '../../../constants/theme';

const STEPS = ['Tipo', 'Ubicación', 'Datos', 'Extras', 'Resultado']; // TODO i18n

type StepIdx = 1 | 2 | 3 | 4 | 5;

export default function ValuationWizardScreen() {
  const [step, setStep] = useState<StepIdx>(1);
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>();
  const [country, setCountry] = useState('ES');
  const [postalCode, setPostalCode] = useState('');
  const [fields, setFields] = useState<PropertyValuationFields>({});
  const [vpoFields, setVpoFields] = useState<PropertyValuationFields>({ vpo_status: 'no' });
  const [notaryCache, setNotaryCache] = useState<NotaryPriceCache | null>(null);
  const [result, setResult] = useState<ValuationResultV2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [notaryNeeded, setNotaryNeeded] = useState(false);

  const profile = propertyType ? getProfile(propertyType) : undefined;

  /* ── Notary cache lookup ──────────────────────────────────── */

  const lookupNotaryCache = useCallback(async (pc: string, c: string) => {
    if (c !== 'ES' || !/^\d{5}$/.test(pc)) {
      setNotaryCache(null);
      return;
    }
    try {
      const data = await getNotaryPrice(pc);
      setNotaryCache(data);
    } catch {
      setNotaryCache(null);
    }
  }, []);

  useEffect(() => {
    void lookupNotaryCache(postalCode, country);
  }, [postalCode, country, lookupNotaryCache]);

  const handleNotaryInput = useCallback(
    async (price: number) => {
      try {
        await postNotaryPrice(postalCode, price, false);
        await lookupNotaryCache(postalCode, country);
        setNotaryNeeded(false);
      } catch (e) {
        const err = e as Error & { status?: number; body?: { warning?: string; message?: string } };
        if (err.status === 409 && err.body?.warning === 'deviation') {
          Alert.alert(
            'Desviación detectada', // TODO i18n
            err.body.message ?? 'El precio difiere mucho del valor provincial.',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Confirmar de todos modos',
                onPress: async () => {
                  await postNotaryPrice(postalCode, price, true);
                  await lookupNotaryCache(postalCode, country);
                  setNotaryNeeded(false);
                },
              },
            ],
          );
        } else {
          Alert.alert('Error', err.message || 'No se pudo guardar'); // TODO i18n
        }
      }
    },
    [postalCode, country, lookupNotaryCache],
  );

  /* ── Calculate ────────────────────────────────────────────── */

  const onCalculate = async () => {
    if (!propertyType) return;
    const payload: CalculateV2Input = {
      property_type: propertyType,
      country,
      postal_code: postalCode,
      fields: { ...fields, ...vpoFields },
      explain: true,
    };
    setLoading(true);
    try {
      const r = await calculateV2(payload);
      setResult(r);
      setStep(5);
    } catch (e) {
      const err = e as Error & { status?: number; body?: { error?: string } };
      if (err.status === 409 && err.body?.error === 'notary_input_required') {
        setNotaryNeeded(true);
        setStep(2);
        Alert.alert(
          'Datos de notariado requeridos', // TODO i18n
          'Por favor, introduce el precio del portal notariado.',
        );
        return;
      }
      Alert.alert('Error', err.message || 'Error de cálculo'); // TODO i18n
    } finally {
      setLoading(false);
    }
  };

  /* ── Validation ───────────────────────────────────────────── */

  const canAdvance = (): boolean => {
    if (step === 1) return !!propertyType;
    if (step === 2) {
      if (!country || !postalCode) return false;
      if (country === 'ES' && /^\d{5}$/.test(postalCode)) {
        return Boolean(notaryCache?.cached) && !notaryNeeded;
      }
      return postalCode.length >= 3;
    }
    if (step === 3) {
      if (!profile) return false;
      for (const req of profile.required_fields) {
        const v = fields[req];
        if (v == null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) {
          return false;
        }
      }
      return true;
    }
    return true;
  };

  /* ── Navigation ───────────────────────────────────────────── */

  const onBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as StepIdx);
  };

  const onNext = () => {
    if (!canAdvance()) {
      Alert.alert('Faltan datos', 'Completa los campos requeridos.'); // TODO i18n
      return;
    }
    if (step < 5) setStep((prev) => (prev + 1) as StepIdx);
  };

  const onReset = () => {
    setStep(1);
    setPropertyType(undefined);
    setFields({});
    setVpoFields({ vpo_status: 'no' });
    setResult(null);
    setNotaryNeeded(false);
  };

  const handleFieldChange = (key: string, value: unknown) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };
  const handleVpoChange = (key: string, value: unknown) => {
    setVpoFields((prev) => ({ ...prev, [key]: value }));
  };

  /* ── Render ───────────────────────────────────────────────── */

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerTitle: 'Valoración' /* TODO i18n */ }} />

      <Stepper steps={STEPS} current={step} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>
              {/* TODO i18n */ 'Tipo de inmueble'}
            </Text>
            <PropertyTypePicker value={propertyType} onChange={setPropertyType} />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.sectionTitle}>
              {/* TODO i18n */ 'Ubicación'}
            </Text>
            <LocationStep
              postalCode={postalCode}
              country={country}
              onChange={(patch) => {
                if (patch.postalCode !== undefined) setPostalCode(patch.postalCode);
                if (patch.country !== undefined) setCountry(patch.country);
              }}
              notaryCache={notaryCache}
              onNotaryInput={handleNotaryInput}
            />
            {notaryNeeded && (
              <Card style={styles.alert}>
                <Text style={styles.alertText}>
                  {/* TODO i18n */}
                  El cálculo requiere el precio del Portal Notariado para este CP.
                </Text>
              </Card>
            )}
          </View>
        )}

        {step === 3 && profile && (
          <View>
            <Text style={styles.sectionTitle}>
              {/* TODO i18n */ `Datos del inmueble (${profile.labels.es})`}
            </Text>
            <DynamicFieldGroup
              profile={profile}
              fields={fields}
              onChange={handleFieldChange}
            />
          </View>
        )}

        {step === 4 && profile && (
          <View>
            <Text style={styles.sectionTitle}>
              {/* TODO i18n */ 'Extras (rendimiento y VPO)'}
            </Text>
            <IncomeSection
              fields={fields}
              onChange={handleFieldChange}
              profile={profile}
            />
            <VpoSection
              vpo={vpoFields}
              onChange={handleVpoChange}
              visible={profile.allows_vpo}
            />
            {!profile.allows_vpo && (
              <Text style={styles.hint}>
                {/* TODO i18n */}
                Este tipo no admite VPO.
              </Text>
            )}
          </View>
        )}

        {step === 5 && result && <ResultV2 result={result} />}
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <Button
          title="Atrás" /* TODO i18n */
          variant="outline"
          onPress={onBack}
          disabled={step === 1 || loading}
          style={styles.footerBtn}
        />
        {step < 4 && (
          <Button
            title="Siguiente" /* TODO i18n */
            onPress={onNext}
            disabled={!canAdvance() || loading}
            style={styles.footerBtn}
          />
        )}
        {step === 4 && (
          <Button
            title="Calcular" /* TODO i18n */
            onPress={onCalculate}
            loading={loading}
            style={styles.footerBtn}
          />
        )}
        {step === 5 && (
          <Button
            title="Nueva valoración" /* TODO i18n */
            onPress={onReset}
            style={styles.footerBtn}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    padding: spacing.md,
  },
  alert: {
    backgroundColor: colors.warningLight,
    marginTop: spacing.md,
  },
  alertText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerBtn: {
    flex: 1,
  },
});
