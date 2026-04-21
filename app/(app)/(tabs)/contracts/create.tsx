import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateContract } from '../../../../lib/api/contracts';
import { useProperties } from '../../../../lib/api/contracts';
import { CONTRACT_TYPE_CONFIG, type ClauseConfig } from '../../../../lib/contracts/config';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { CollapsibleSection } from '../../../../components/ui/CollapsibleSection';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';
import { useI18n } from '../../../../lib/i18n';

interface ClauseState {
  enabled: boolean;
  text: string;
  edited: boolean;
}

// Contract types that show property picker
const TYPES_WITH_PROPERTY = new Set([
  'seller_broker', 'landlord_broker', 'buyer_search', 'tenant_search',
  'purchase_contract', 'investor_search', 'rental_contract', 'commercial_search',
  'proof_contract', 'brokerage_contract', 'rental_brokerage', 'reservation',
  'expose_release', 'viewing_protocol', 'handover_protocol', 'power_of_attorney',
  'document_authorization',
]);

// Contract types that show mandate type selector
const TYPES_WITH_MANDATE = new Set([
  'seller_broker', 'landlord_broker', 'brokerage_contract', 'rental_brokerage',
]);

// Contract types that show commission
const TYPES_WITH_COMMISSION = new Set([
  'seller_broker', 'landlord_broker', 'buyer_search', 'tenant_search',
  'investor_search', 'commercial_search', 'proof_contract', 'brokerage_contract',
  'rental_brokerage', 'commission',
]);

export default function CreateContractScreen() {
  const { t } = useI18n();
  const { type } = useLocalSearchParams<{ type: string }>();
  const createContract = useCreateContract();
  const { data: properties } = useProperties();

  const typeConfig = CONTRACT_TYPE_CONFIG[type || ''];
  const typeClauses = typeConfig?.clauses ?? [];

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientIdNumber, setClientIdNumber] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [mandateType, setMandateType] = useState('exclusive');
  const [commission, setCommission] = useState('');
  const [contractDate, setContractDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [signingLocation, setSigningLocation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Clause state
  const [clauses, setClauses] = useState<Record<string, ClauseState>>(() => {
    const initial: Record<string, ClauseState> = {};
    typeClauses.forEach((c) => {
      initial[c.id] = {
        enabled: true,
        text: c.defaultText,
        edited: false,
      };
    });
    return initial;
  });

  // Custom clauses
  const [customClauses, setCustomClauses] = useState<Array<{ id: string; title: string; text: string }>>([]);

  const showProperty = TYPES_WITH_PROPERTY.has(type || '');
  const showMandate = TYPES_WITH_MANDATE.has(type || '');
  const showCommission = TYPES_WITH_COMMISSION.has(type || '');

  const propertyOptions = useMemo(() => {
    return (properties ?? []).map((p) => ({
      value: p.id,
      label: `${p.title || p.address || ''} - ${p.city || ''}`.trim(),
    }));
  }, [properties]);

  const mandateOptions = [
    { value: 'exclusive', label: t('contract_mandateExclusive') },
    { value: 'simple', label: t('contract_mandateSimple') },
  ];

  const toggleClause = (id: string) => {
    const clause = typeClauses.find((c) => c.id === id);
    if (clause?.required) return;
    setClauses((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  };

  const updateClauseText = (id: string, text: string) => {
    const original = typeClauses.find((c) => c.id === id);
    setClauses((prev) => ({
      ...prev,
      [id]: { ...prev[id], text, edited: text !== original?.defaultText },
    }));
  };

  const resetClause = (id: string) => {
    const original = typeClauses.find((c) => c.id === id);
    if (!original) return;
    setClauses((prev) => ({
      ...prev,
      [id]: { ...prev[id], text: original.defaultText, edited: false },
    }));
  };

  const addCustomClause = () => {
    const id = `custom_${Date.now()}`;
    setCustomClauses((prev) => [...prev, { id, title: '', text: '' }]);
  };

  const updateCustomClause = (id: string, field: 'title' | 'text', value: string) => {
    setCustomClauses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const removeCustomClause = (id: string) => {
    setCustomClauses((prev) => prev.filter((c) => c.id !== id));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!clientName.trim()) {
      newErrors.clientName = t('contract_clientNameRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildSavedClauses = () => {
    const saved: Array<{
      key: string;
      title_de: string;
      title_es: string;
      text: string;
      enabled: boolean;
    }> = [];

    typeClauses.forEach((c) => {
      const state = clauses[c.id];
      if (state) {
        saved.push({
          key: c.id,
          title_de: c.title_de,
          title_es: c.title_es,
          text: state.text,
          enabled: state.enabled,
        });
      }
    });

    customClauses.forEach((c) => {
      if (c.title.trim() && c.text.trim()) {
        saved.push({
          key: c.id,
          title_de: c.title,
          title_es: c.title,
          text: c.text,
          enabled: true,
        });
      }
    });

    return saved;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const selectedProperty = properties?.find((p) => p.id === propertyId);
    const propAddr = selectedProperty
      ? `${selectedProperty.address || ''}, ${selectedProperty.city || ''}`.trim()
      : propertyAddress.trim() || null;

    const payload: Record<string, unknown> = {
      contract_type: type,
      client_name: clientName.trim(),
      client_email: clientEmail.trim() || null,
      client_phone: clientPhone.trim() || null,
      client_address: clientAddress.trim() || null,
      client_id_number: clientIdNumber.trim() || null,
      property_id: propertyId || null,
      property_address: propAddr,
      mandate_type: showMandate ? mandateType : null,
      commission_percentage: showCommission && commission ? parseFloat(commission) : null,
      contract_date: contractDate.trim() || new Date().toISOString().slice(0, 10),
      signing_location: signingLocation.trim() || null,
      selected_clauses: buildSavedClauses(),
    };

    createContract.mutate(payload as any, {
      onSuccess: () => {
        router.dismiss(2); // dismiss create + type-picker
      },
      onError: (err) => {
        const msg = err instanceof Error ? err.message : String(err);
        Alert.alert(t('error'), `${t('contracts_createError')}\n\n${msg}`);
      },
    });
  };

  if (!typeConfig) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerTitle: t('contracts_new'), headerShown: true }} />
        <Text style={styles.errorText}>{t('contracts_notFound')}</Text>
      </View>
    );
  }

  const typeLabel = t(`contractType_${type}`);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerTitle: typeLabel,
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Client Section */}
        <CollapsibleSection title={t('contract_sectionClient')} defaultOpen>
          <FormInput
            label={t('contract_clientName')}
            required
            value={clientName}
            onChangeText={setClientName}
            placeholder={t('contract_clientNamePlaceholder')}
            error={errors.clientName}
            autoCapitalize="words"
          />
          <FormInput
            label={t('contract_clientEmail')}
            value={clientEmail}
            onChangeText={setClientEmail}
            placeholder={t('contract_clientEmailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormInput
            label={t('contract_clientPhone')}
            value={clientPhone}
            onChangeText={setClientPhone}
            placeholder={t('contract_clientPhonePlaceholder')}
            keyboardType="phone-pad"
          />
          <FormInput
            label={t('contract_clientAddress')}
            value={clientAddress}
            onChangeText={setClientAddress}
            placeholder={t('contract_clientAddressPlaceholder')}
          />
          <FormInput
            label={t('contract_clientIdNumber')}
            value={clientIdNumber}
            onChangeText={setClientIdNumber}
            placeholder={t('contract_clientIdNumberPlaceholder')}
          />
        </CollapsibleSection>

        {/* Property Section */}
        {showProperty && (
          <CollapsibleSection title={t('contract_sectionProperty')} defaultOpen>
            {propertyOptions.length > 0 && (
              <FormSelect
                label={t('contract_property')}
                options={propertyOptions}
                value={propertyId}
                onChange={setPropertyId}
                placeholder={t('contract_propertyPlaceholder')}
              />
            )}
            <FormInput
              label={t('contract_propertyAddress')}
              value={propertyAddress}
              onChangeText={setPropertyAddress}
              placeholder={t('contract_propertyAddressPlaceholder')}
            />
          </CollapsibleSection>
        )}

        {/* Details Section */}
        <CollapsibleSection title={t('contract_sectionDetails')} defaultOpen>
          {showMandate && (
            <FormSelect
              label={t('contract_mandateType')}
              options={mandateOptions}
              value={mandateType}
              onChange={setMandateType}
            />
          )}
          {showCommission && (
            <FormInput
              label={t('contract_commission')}
              value={commission}
              onChangeText={setCommission}
              placeholder={t('contract_commissionPlaceholder')}
              keyboardType="decimal-pad"
            />
          )}
          <FormInput
            label={t('contract_date')}
            value={contractDate}
            onChangeText={setContractDate}
            placeholder={t('contract_datePlaceholder')}
          />
          <FormInput
            label={t('contract_signingLocation')}
            value={signingLocation}
            onChangeText={setSigningLocation}
            placeholder={t('contract_signingLocationPlaceholder')}
          />
        </CollapsibleSection>

        {/* Clauses Section */}
        <CollapsibleSection title={t('contract_sectionClauses')} defaultOpen>
          {typeClauses.map((clause) => (
            <ClauseEditor
              key={clause.id}
              clause={clause}
              state={clauses[clause.id]}
              onToggle={() => toggleClause(clause.id)}
              onTextChange={(text) => updateClauseText(clause.id, text)}
              onReset={() => resetClause(clause.id)}
              t={t}
            />
          ))}

          {/* Custom clauses */}
          {customClauses.map((cc) => (
            <View key={cc.id} style={styles.customClause}>
              <View style={styles.customClauseHeader}>
                <Text style={styles.clauseTitle}>{t('contract_customClause')}</Text>
                <TouchableOpacity onPress={() => removeCustomClause(cc.id)}>
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.customInput}
                value={cc.title}
                onChangeText={(v) => updateCustomClause(cc.id, 'title', v)}
                placeholder={t('contract_customClauseTitle')}
                placeholderTextColor={colors.textTertiary}
              />
              <TextInput
                style={[styles.customInput, styles.customTextArea]}
                value={cc.text}
                onChangeText={(v) => updateCustomClause(cc.id, 'text', v)}
                placeholder={t('contract_customClauseText')}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addClauseButton} onPress={addCustomClause}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addClauseText}>{t('contract_addClause')}</Text>
          </TouchableOpacity>
        </CollapsibleSection>

        {/* Submit */}
        <View style={styles.buttonContainer}>
          <Button
            title={t('contract_save')}
            onPress={handleSubmit}
            loading={createContract.isPending}
            disabled={createContract.isPending}
          />
          <Button
            title={t('cancel')}
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ClauseEditor({
  clause,
  state,
  onToggle,
  onTextChange,
  onReset,
  t,
}: {
  clause: ClauseConfig;
  state: ClauseState;
  onToggle: () => void;
  onTextChange: (text: string) => void;
  onReset: () => void;
  t: (key: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.clauseContainer, !state.enabled && styles.clauseDisabled]}>
      <TouchableOpacity
        style={styles.clauseHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.clauseHeaderLeft}>
          <Switch
            value={state.enabled}
            onValueChange={onToggle}
            trackColor={{ true: colors.primary, false: colors.border }}
            disabled={clause.required}
          />
          <View style={styles.clauseTitleRow}>
            <Text style={styles.clauseTitle} numberOfLines={1}>
              {clause.title_de}
            </Text>
            {clause.required && (
              <Text style={styles.clauseRequired}>*</Text>
            )}
            {state.edited && (
              <View style={styles.editedBadge}>
                <Text style={styles.editedBadgeText}>{t('contract_clauseEdited')}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.clauseBody}>
          <TextInput
            style={styles.clauseTextInput}
            value={state.text}
            onChangeText={onTextChange}
            multiline
            editable={state.enabled}
            placeholderTextColor={colors.textTertiary}
          />
          {state.edited && (
            <TouchableOpacity style={styles.resetButton} onPress={onReset}>
              <Ionicons name="refresh" size={16} color={colors.info} />
              <Text style={styles.resetText}>{t('contract_clauseReset')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.error,
  },
  buttonContainer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  // Clause styles
  clauseContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  clauseDisabled: {
    opacity: 0.6,
  },
  clauseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  clauseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  clauseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  clauseTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flexShrink: 1,
  },
  clauseRequired: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.bold,
  },
  editedBadge: {
    backgroundColor: colors.accent + '25',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  editedBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.medium,
    color: colors.accent,
  },
  clauseBody: {
    padding: spacing.md,
    paddingTop: 0,
  },
  clauseTextInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
  },
  resetText: {
    fontSize: fontSize.xs,
    color: colors.info,
    fontWeight: fontWeight.medium,
  },

  // Custom clause
  customClause: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent + '40',
    borderStyle: 'dashed',
  },
  customClauseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  customInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  customTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addClauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  addClauseText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
});
