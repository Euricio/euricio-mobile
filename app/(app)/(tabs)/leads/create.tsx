import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useCreateLead } from '../../../../lib/api/leads';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { colors, spacing } from '../../../../constants/theme';
import { useI18n } from '../../../../lib/i18n';

export default function CreateLeadScreen() {
  const { t } = useI18n();
  const createLead = useCreateLead();

  const sourceOptions = [
    { value: 'website', label: t('leadSource_website') },
    { value: 'telefon', label: t('leadSource_telefon') },
    { value: 'empfehlung', label: t('leadSource_empfehlung') },
    { value: 'portal', label: t('leadSource_portal') },
    { value: 'sonstige', label: t('leadSource_sonstige') },
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
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    const payload: Record<string, unknown> = {
      full_name: name.trim(),
      status: 'new',
    };
    if (email.trim()) payload.email = email.trim();
    if (phone.trim()) payload.phone = phone.trim();
    if (source) payload.source = source;
    if (language) payload.preferred_language = language;
    if (budget.trim()) payload.budget = parseFloat(budget.trim());
    if (notes.trim()) payload.notes = notes.trim();

    createLead.mutate(
      payload as any,
      {
        onSuccess: () => {
          router.back();
        },
        onError: (error) => {
          Alert.alert(t('error'), t('leads_createError'));
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
          headerTitle: t('leads_new'),
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
            title={t('lead_create')}
            onPress={handleSubmit}
            loading={createLead.isPending}
            disabled={createLead.isPending}
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
