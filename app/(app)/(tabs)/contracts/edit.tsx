import React, { useState, useEffect, useMemo } from 'react';
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
import { useContract, useUpdateContract, useProperties } from '../../../../lib/api/contracts';
import { CONTRACT_TYPE_CONFIG, type ClauseConfig } from '../../../../lib/contracts/config';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { CollapsibleSection } from '../../../../components/ui/CollapsibleSection';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../../constants/theme';
import { useI18n } from '../../../../lib/i18n';

interface ClauseState {
  enabled: boolean;
  text: string;
  edited: boolean;
}

const TYPES_WITH_PROPERTY = new Set([
  'seller_broker', 'landlord_broker', 'buyer_search', 'tenant_search',
  'purchase_contract', 'investor_search', 'rental_contract', 'commercial_search',
  'proof_contract', 'brokerage_contract', 'rental_brokerage', 'reservation',
  'expose_release', 'viewing_protocol', 'handover_protocol', 'power_of_attorney',
  'document_authorization',
]);

const TYPES_WITH_MANDATE = new Set([
  'seller_broker', 'landlord_broker', 'brokerage_contract', 'rental_brokerage',
]);

const TYPES_WITH_COMMISSION = new Set([
  'seller_broker', 'landlord_broker', 'buyer_search', 'tenant_search',
  'investor_search', 'commercial_search', 'proof_contract', 'brokerage_contract',
  'rental_brokerage', 'commission',
]);

export default function EditContractScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: contract, isLoading } = useContract(id!);
  const updateContract = useUpdateContract();
  const { data: properties } = useProperties();

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientIdNumber, setClientIdNumber] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [mandateType, setMandateType] = useState('exclusive');
  const [commission, setCommission] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [signingLocation, setSigningLocation] = useState('');
  const [clauses, setClauses] = useState<Record<string, ClauseState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  const type = contract?.contract_type || '';
  const typeConfig = CONTRACT_TYPE_CONFIG[type];
  const typeClauses = typeConfig?.clauses ?? [];

  const showProperty = TYPES_WITH_PROPERTY.has(type);
  const showMandate = TYPES_WITH_MANDATE.has(type);
  const showCommission = TYPES_WITH_COMMISSION.has(type);

  useEffect(() => {
    if (contract && !initialized) {
      setClientName(contract.client_name ?? '');
      setClientEmail(contract.client_email ?? '');
      setClientPhone(contract.client_phone ?? '');
      setClientAddress(contract.client_address ?? '');
      setClientIdNumber(contract.client_id_number ?? '');
      setPropertyId(contract.property_id ?? '');
      setPropertyAddress(contract.property_address ?? '');
      setMandateType(contract.mandate_type ?? 'exclusive');
      setCommission(contract.commission_percentage != null ? String(contract.commission_percentage) : '');
      setContractDate(contract.contract_date ?? '');
      setSigningLocation(contract.signing_location ?? '');

      // Restore clause state from saved clauses
      const savedMap: Record<string, { text: string; enabled: boolean }> = {};
      (contract.selected_clauses ?? []).forEach((sc) => {
        savedMap[sc.key] = { text: sc.text, enabled: sc.enabled };
      });

      const clauseState: Record<string, ClauseState> = {};
      typeClauses.forEach((c) => {
        const saved = savedMap[c.id];
        clauseState[c.id] = {
          enabled: saved ? saved.enabled : true,
          text: saved ? saved.text : c.defaultText,
          edited: saved ? saved.text !== c.defaultText : false,
        };
      });
      setClauses(clauseState);
      setInitialized(true);
    }
  }, [contract, initialized, typeClauses]);

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

  const toggleClause = (clauseId: string) => {
    const clause = typeClauses.find((c) => c.id === clauseId);
    if (clause?.required) return;
    setClauses((prev) => ({
      ...prev,
      [clauseId]: { ...prev[clauseId], enabled: !prev[clauseId].enabled },
    }));
  };

  const updateClauseText = (clauseId: string, text: string) => {
    const original = typeClauses.find((c) => c.id === clauseId);
    setClauses((prev) => ({
      ...prev,
      [clauseId]: { ...prev[clauseId], text, edited: text !== original?.defaultText },
    }));
  };

  const resetClause = (clauseId: string) => {
    const original = typeClauses.find((c) => c.id === clauseId);
    if (!original) return;
    setClauses((prev) => ({
      ...prev,
      [clauseId]: { ...prev[clauseId], text: original.defaultText, edited: false },
    }));
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
    return typeClauses.map((c) => {
      const state = clauses[c.id];
      return {
        key: c.id,
        title_de: c.title_de,
        title_es: c.title_es,
        text: state?.text ?? c.defaultText,
        enabled: state?.enabled ?? true,
      };
    });
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const selectedProperty = properties?.find((p) => p.id === propertyId);
    const propAddr = selectedProperty
      ? `${selectedProperty.address || ''}, ${selectedProperty.city || ''}`.trim()
      : propertyAddress.trim() || null;

    updateContract.mutate(
      {
        id: id!,
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || null,
        client_phone: clientPhone.trim() || null,
        client_address: clientAddress.trim() || null,
        client_id_number: clientIdNumber.trim() || null,
        property_id: propertyId || null,
        property_address: propAddr,
        mandate_type: showMandate ? mandateType : null,
        commission_percentage: showCommission && commission ? parseFloat(commission) : null,
        contract_date: contractDate.trim() || null,
        signing_location: signingLocation.trim() || null,
        selected_clauses: buildSavedClauses(),
      } as any,
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('error'), t('contracts_updateError')),
      },
    );
  };

  if (isLoading || !initialized) {
    return <LoadingScreen />;
  }

  const typeLabel = t(`contractType_${type}`) || typeConfig?.label_de || type;

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

        <CollapsibleSection title={t('contract_sectionClauses')} defaultOpen>
          {typeClauses.map((clause) => {
            const state = clauses[clause.id];
            if (!state) return null;
            return (
              <ClauseEditor
                key={clause.id}
                clause={clause}
                state={state}
                onToggle={() => toggleClause(clause.id)}
                onTextChange={(text) => updateClauseText(clause.id, text)}
                onReset={() => resetClause(clause.id)}
                t={t}
              />
            );
          })}
        </CollapsibleSection>

        <View style={styles.buttonContainer}>
          <Button
            title={t('save')}
            onPress={handleSubmit}
            loading={updateContract.isPending}
            disabled={updateContract.isPending}
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
  state: { enabled: boolean; text: string; edited: boolean };
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
  buttonContainer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
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
});
