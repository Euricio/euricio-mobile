import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import Slider from '@react-native-community/slider';
import {
  useCalculateVergleichswert,
  useCalculateSubstanzwert,
  useCalculateErtragswert,
  useGenerateValuationPdf,
  useSendValuationReport,
} from '../../../lib/api/valuations';
import type { ValuationInput, ValuationResult } from '../../../lib/api/valuations';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

const PROPERTY_TYPES = [
  'apartment',
  'house',
  'villa',
  'chalet',
  'finca',
  'commercial',
  'land',
];

const CONDITIONS = [
  'new',
  'like_new',
  'good',
  'needs_renovation',
  'ruin',
];

type Method = 'vergleichswert' | 'substanzwert' | 'ertragswert';

export default function ValuationToolScreen() {
  const { t, formatPrice } = useI18n();

  // Form state
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [propertyType, setPropertyType] = useState('apartment');
  const [condition, setCondition] = useState('good');
  const [yearBuilt, setYearBuilt] = useState('');
  const [conditionFactor, setConditionFactor] = useState(1.0);
  const [customAdjustment, setCustomAdjustment] = useState(0);
  const [activeMethod, setActiveMethod] = useState<Method>('vergleichswert');
  const [emailTo, setEmailTo] = useState('');

  // Results state
  const [results, setResults] = useState<Record<Method, ValuationResult | null>>({
    vergleichswert: null,
    substanzwert: null,
    ertragswert: null,
  });

  // Mutations
  const calcVergleich = useCalculateVergleichswert();
  const calcSubstanz = useCalculateSubstanzwert();
  const calcErtrag = useCalculateErtragswert();
  const generatePdf = useGenerateValuationPdf();
  const sendReport = useSendValuationReport();

  const buildInput = (): ValuationInput => ({
    address,
    postal_code: postalCode,
    area_m2: parseFloat(area) || 0,
    rooms: parseInt(rooms, 10) || 0,
    property_type: propertyType,
    condition,
    year_built: parseInt(yearBuilt, 10) || 2000,
    condition_factor: conditionFactor,
    custom_adjustment: customAdjustment,
  });

  const handleCalculate = (method: Method) => {
    const input = buildInput();
    const mutate =
      method === 'vergleichswert'
        ? calcVergleich
        : method === 'substanzwert'
          ? calcSubstanz
          : calcErtrag;

    mutate.mutate(input, {
      onSuccess: (data) => setResults((prev) => ({ ...prev, [method]: data })),
      onError: (err) => Alert.alert(t('error'), err.message),
    });
  };

  const isCalculating =
    calcVergleich.isPending || calcSubstanz.isPending || calcErtrag.isPending;

  const currentResult = results[activeMethod];

  const handleGeneratePdf = () => {
    if (!currentResult) return;
    generatePdf.mutate(
      { ...buildInput(), results: currentResult },
      {
        onError: () => Alert.alert(t('error'), t('valuation_pdfError')),
      },
    );
  };

  const handleSendEmail = () => {
    if (!currentResult || !emailTo) return;
    sendReport.mutate(
      { email: emailTo, input: buildInput(), results: currentResult },
      {
        onSuccess: () => {
          Alert.alert(t('valuation_emailSent'));
          setEmailTo('');
        },
        onError: () => Alert.alert(t('error'), t('valuation_emailError')),
      },
    );
  };

  const methods: { key: Method; label: string }[] = [
    { key: 'vergleichswert', label: t('valuation_method_vergleichswert') },
    { key: 'substanzwert', label: t('valuation_method_substanzwert') },
    { key: 'ertragswert', label: t('valuation_method_ertragswert') },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ headerTitle: t('valuation_title') }} />

      {/* Input Section */}
      <Text style={styles.sectionHeader}>{t('valuation_inputSection')}</Text>
      <Card>
        <FormInput
          label={t('valuation_address')}
          value={address}
          onChangeText={setAddress}
          placeholder={t('valuation_addressPlaceholder')}
        />
        <FormInput
          label={t('valuation_postalCode')}
          value={postalCode}
          onChangeText={setPostalCode}
          placeholder={t('valuation_postalCodePlaceholder')}
          keyboardType="number-pad"
        />
        <View style={styles.row}>
          <View style={styles.halfField}>
            <FormInput
              label={t('valuation_area')}
              value={area}
              onChangeText={setArea}
              placeholder={t('valuation_areaPlaceholder')}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfField}>
            <FormInput
              label={t('valuation_rooms')}
              value={rooms}
              onChangeText={setRooms}
              placeholder={t('valuation_roomsPlaceholder')}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <FormSelect
          label={t('valuation_propertyType')}
          value={propertyType}
          onChange={setPropertyType}
          options={PROPERTY_TYPES.map((pt) => ({
            label: t(`propType_${pt}`),
            value: pt,
          }))}
        />
        <FormSelect
          label={t('valuation_condition')}
          value={condition}
          onChange={setCondition}
          options={CONDITIONS.map((c) => ({
            label: t(`condition_${c}`),
            value: c,
          }))}
        />
        <FormInput
          label={t('valuation_yearBuilt')}
          value={yearBuilt}
          onChangeText={setYearBuilt}
          placeholder={t('valuation_yearBuiltPlaceholder')}
          keyboardType="number-pad"
        />

        {/* Condition Factor Slider */}
        <View style={styles.sliderSection}>
          <Text style={styles.sliderLabel}>
            {t('valuation_conditionFactor')}: {conditionFactor.toFixed(2)}
          </Text>
          <Slider
            minimumValue={0.7}
            maximumValue={1.3}
            value={conditionFactor}
            onValueChange={setConditionFactor}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
            step={0.05}
          />
        </View>

        {/* Custom Adjustment Slider */}
        <View style={styles.sliderSection}>
          <Text style={styles.sliderLabel}>
            {t('valuation_customAdjustment')}: {customAdjustment > 0 ? '+' : ''}
            {customAdjustment}%
          </Text>
          <Slider
            minimumValue={-30}
            maximumValue={30}
            value={customAdjustment}
            onValueChange={(v: number) => setCustomAdjustment(Math.round(v))}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
            step={1}
          />
        </View>
      </Card>

      {/* Method Tabs */}
      <Text style={styles.sectionHeader}>{t('valuation_resultsSection')}</Text>
      <View style={styles.methodRow}>
        {methods.map((m) => (
          <TouchableOpacity
            key={m.key}
            onPress={() => setActiveMethod(m.key)}
            style={[
              styles.methodTab,
              activeMethod === m.key && styles.methodTabActive,
            ]}
          >
            <Text
              style={[
                styles.methodLabel,
                activeMethod === m.key && styles.methodLabelActive,
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Card>
        <Button
          title={isCalculating ? t('valuation_calculating') : t('valuation_calculate')}
          onPress={() => handleCalculate(activeMethod)}
          loading={isCalculating}
          disabled={!area || !address}
        />

        {currentResult ? (
          <View style={styles.resultCards}>
            <ResultCard
              label={t('valuation_result_min')}
              value={formatPrice(currentResult.min)}
              color={colors.warning}
            />
            <ResultCard
              label={t('valuation_result_mid')}
              value={formatPrice(currentResult.mid)}
              color={colors.primary}
            />
            <ResultCard
              label={t('valuation_result_max')}
              value={formatPrice(currentResult.max)}
              color={colors.success}
            />
            {currentResult.price_per_m2 && (
              <View style={styles.priceM2}>
                <Text style={styles.priceM2Label}>{t('valuation_pricePerM2')}</Text>
                <Text style={styles.priceM2Value}>
                  {formatPrice(currentResult.price_per_m2)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.noResults}>{t('valuation_noResults')}</Text>
        )}
      </Card>

      {/* Actions */}
      {currentResult && (
        <Card style={styles.actionsCard}>
          <Button
            title={
              generatePdf.isPending
                ? t('valuation_generatingPdf')
                : t('valuation_generatePdf')
            }
            onPress={handleGeneratePdf}
            loading={generatePdf.isPending}
            variant="secondary"
            icon={<Ionicons name="document-outline" size={18} color={colors.primary} />}
          />
          <View style={styles.emailRow}>
            <TextInput
              style={styles.emailInput}
              value={emailTo}
              onChangeText={setEmailTo}
              placeholder={t('valuation_recipientEmail')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title={t('valuation_sendEmail')}
              onPress={handleSendEmail}
              loading={sendReport.isPending}
              disabled={!emailTo}
              size="sm"
              icon={<Ionicons name="mail-outline" size={16} color={colors.white} />}
            />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

function ResultCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[resultStyles.card, { borderLeftColor: color }]}>
      <Text style={resultStyles.label}>{label}</Text>
      <Text style={resultStyles.value}>{value}</Text>
    </View>
  );
}

const resultStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  value: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120 },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  halfField: { flex: 1 },
  sliderSection: { marginTop: spacing.md },
  sliderLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  methodTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  methodTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  methodLabelActive: { color: colors.white },
  resultCards: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  priceM2: {
    position: 'absolute',
    bottom: -28,
    right: 0,
    flexDirection: 'row',
    gap: 4,
  },
  priceM2Label: { fontSize: fontSize.xs, color: colors.textTertiary },
  priceM2Value: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  noResults: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    paddingVertical: spacing.lg,
  },
  actionsCard: { marginTop: spacing.md },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  emailInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
