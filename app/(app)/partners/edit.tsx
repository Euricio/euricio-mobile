import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import { usePartner, useUpdatePartner } from '../../../lib/api/partners';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
} from '../../../constants/theme';

const CATEGORIES = ['private', 'agent', 'lawyer', 'notary', 'bank_advisor', 'developer', 'architect', 'other'];
const STATUSES = ['active', 'inactive', 'blocked'];
const COMMISSION_TYPES = ['percent', 'fixed'];

// Map legacy/German category values from the database to canonical English keys
const CATEGORY_ALIAS: Record<string, string> = {
  privat: 'private',
  makler: 'agent',
  anwalt: 'lawyer',
  notar: 'notary',
  bankberater: 'bank_advisor',
  'bauträger': 'developer',
  architekt: 'architect',
  sonstige: 'other',
};

function normalizeCategory(raw: string): string {
  if (CATEGORIES.includes(raw)) return raw;
  const lower = raw.toLowerCase();
  if (CATEGORIES.includes(lower)) return lower;
  return CATEGORY_ALIAS[lower] ?? raw;
}

export default function EditPartnerScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: partner, isLoading } = usePartner(id);
  const updatePartner = useUpdatePartner();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [emailAlt, setEmailAlt] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneAlt, setPhoneAlt] = useState('');
  const [organization, setOrganization] = useState('');
  const [city, setCity] = useState('');
  const [nif, setNif] = useState('');
  const [category, setCategory] = useState('private');
  const [status, setStatus] = useState('active');
  const [commissionType, setCommissionType] = useState('');
  const [commissionValue, setCommissionValue] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (partner) {
      setFirstName(partner.first_name || '');
      setLastName(partner.last_name || '');
      setAlias(partner.alias || '');
      setEmail(partner.email || '');
      setEmailAlt(partner.email_alt || '');
      setPhone(partner.phone || '');
      setPhoneAlt(partner.phone_alt || '');
      setOrganization(partner.organization || '');
      setCity(partner.city || '');
      setNif(partner.nif || '');
      setCategory(normalizeCategory(partner.category || 'private'));
      setStatus(partner.status || 'active');
      setCommissionType(partner.commission_type || '');
      setCommissionValue(partner.commission_value != null ? String(partner.commission_value) : '');
      setNotes(partner.notes || '');
    }
  }, [partner]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert(t('error'), t('partner_firstNameRequired'));
      return;
    }
    if (!lastName.trim()) {
      Alert.alert(t('error'), t('partner_lastNameRequired'));
      return;
    }

    try {
      await updatePartner.mutateAsync({
        id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        alias: alias.trim() || null,
        email: email.trim() || null,
        email_alt: emailAlt.trim() || null,
        phone: phone.trim() || null,
        phone_alt: phoneAlt.trim() || null,
        organization: organization.trim() || null,
        city: city.trim() || null,
        nif: nif.trim() || null,
        category,
        status,
        commission_type: commissionType || null,
        commission_value: commissionValue ? parseFloat(commissionValue) : null,
        notes: notes.trim() || null,
      });
      router.back();
    } catch {
      Alert.alert(t('error'), t('partners_updateError'));
    }
  };

  if (isLoading) return <LoadingScreen />;

  const categoryOptions = CATEGORIES.map((c) => ({
    label: t(`partner_category_${c}`),
    value: c,
  }));

  const statusOptions = STATUSES.map((s) => ({
    label: t(`partner_status_${s}`),
    value: s,
  }));

  const commTypeOptions = [
    { label: '—', value: '' },
    ...COMMISSION_TYPES.map((ct) => ({
      label: t(`partner_commission_${ct}`),
      value: ct,
    })),
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('partners_edit') }} />

      <Card>
        <FormInput label={t('partner_firstName') + ' *'} value={firstName} onChangeText={setFirstName} />
        <FormInput label={t('partner_lastName') + ' *'} value={lastName} onChangeText={setLastName} />
        <FormInput label={t('partner_alias')} value={alias} onChangeText={setAlias} />
        <FormSelect label={t('partner_category')} value={category} onChange={setCategory} options={categoryOptions} />
        <FormSelect label={t('partner_status')} value={status} onChange={setStatus} options={statusOptions} />
        <FormInput label={t('partner_email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
        <FormInput label={t('partner_emailAlt')} value={emailAlt} onChangeText={setEmailAlt} keyboardType="email-address" />
        <FormInput label={t('partner_phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <FormInput label={t('partner_phoneAlt')} value={phoneAlt} onChangeText={setPhoneAlt} keyboardType="phone-pad" />
        <FormInput label={t('partner_organization')} value={organization} onChangeText={setOrganization} />
        <FormInput label={t('partner_city')} value={city} onChangeText={setCity} />
        <FormInput label={t('partner_nif')} value={nif} onChangeText={setNif} />
        <FormSelect label={t('partner_commissionType')} value={commissionType} onChange={setCommissionType} options={commTypeOptions} />
        {commissionType ? (
          <FormInput
            label={t('partner_commissionValue')}
            value={commissionValue}
            onChangeText={setCommissionValue}
            keyboardType="decimal-pad"
          />
        ) : null}
        <FormInput
          label={t('partner_notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('partner_notesPlaceholder')}
          multiline
          numberOfLines={3}
        />
      </Card>

      <Button
        title={t('save')}
        onPress={handleSave}
        size="lg"
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
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
});
