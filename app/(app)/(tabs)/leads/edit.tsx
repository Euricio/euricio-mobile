import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useLead, useUpdateLead } from '../../../../lib/api/leads';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { colors, spacing } from '../../../../constants/theme';
import { useI18n } from '../../../../lib/i18n';

export default function EditLeadScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lead, isLoading } = useLead(id!);
  const updateLead = useUpdateLead();

  const sourceOptions = [
    { value: 'website', label: t('leadSource_website') },
    { value: 'telefon', label: t('leadSource_telefon') },
    { value: 'empfehlung', label: t('leadSource_empfehlung') },
    { value: 'portal', label: t('leadSource_portal') },
    { value: 'sonstige', label: t('leadSource_sonstige') },
  ];

  const statusOptions = [
    { value: 'new', label: t('leadStatus_new') },
    { value: 'contacted', label: t('leadStatus_contacted') },
    { value: 'qualified', label: t('leadStatus_qualified') },
    { value: 'lost', label: t('leadStatus_lost') },
  ];

  const languageOptions = [
    { value: 'de', label: t('lang_de') },
    { value: 'en', label: t('lang_en') },
    { value: 'es', label: t('lang_es') },
    { value: 'fr', label: t('lang_fr') },
    { value: 'pt', label: t('lang_pt') },
    { value: 'it', label: t('lang_it') },
    { value: 'other', label: t('lang_other') },
  ];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [language, setLanguage] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('new');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead) {
      setName(lead.full_name ?? '');
      setEmail(lead.email ?? '');
      setPhone(lead.phone ?? '');
      setSource(lead.source ?? '');
      setLanguage(lead.preferred_language ?? '');
      setBudget(lead.budget != null ? String(lead.budget) : '');
      setNotes(lead.notes ?? '');
      setStatus(lead.status ?? 'new');
    }
  }, [lead]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t('lead_nameRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    updateLead.mutate(
      {
        id: id!,
        full_name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        source: source || null,
        preferred_language: language || null,
        budget: budget.trim() ? parseFloat(budget.trim()) : null,
        notes: notes.trim() || null,
        status,
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: () => {
          Alert.alert(
            t('error'),
            t('leads_updateError'),
          );
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerTitle: t('leads_edit'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <FormInput
          label={t('lead_name')}
          required
          value={name}
          onChangeText={setName}
          placeholder={t('lead_namePlaceholder')}
          error={errors.name}
          autoCapitalize="words"
        />
        <FormInput
          label={t('lead_email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('lead_emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormInput
          label={t('lead_phone')}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('lead_phonePlaceholder')}
          keyboardType="phone-pad"
        />
        <FormSelect
          label={t('prop_status')}
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />
        <FormSelect
          label={t('lead_source')}
          options={sourceOptions}
          value={source}
          onChange={setSource}
          placeholder={t('lead_sourcePlaceholder')}
        />
        <FormSelect
          label={t('lead_language')}
          options={languageOptions}
          value={language}
          onChange={setLanguage}
          placeholder={t('lead_languagePlaceholder')}
        />
        <FormInput
          label={t('lead_budget')}
          value={budget}
          onChangeText={setBudget}
          placeholder={t('lead_budgetPlaceholder')}
          keyboardType="numeric"
        />
        <FormInput
          label={t('lead_notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('lead_notesPlaceholder')}
          multiline
          numberOfLines={4}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={t('save')}
            onPress={handleSubmit}
            loading={updateLead.isPending}
            disabled={updateLead.isPending}
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
});
