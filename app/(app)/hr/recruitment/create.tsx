import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useI18n } from '../../../../lib/i18n';
import { useCreateCandidate } from '../../../../lib/api/recruitment';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../../constants/theme';

const REGIONS = ['berlin', 'hamburg', 'munich', 'cologne', 'frankfurt', 'marbella', 'malaga', 'madrid', 'other'];
const SOURCES = ['website', 'referral', 'portal', 'linkedin', 'other'];
const LANGUAGES = ['de', 'en', 'es', 'fr', 'pt', 'it', 'other'];

export default function CreateCandidateScreen() {
  const { t } = useI18n();
  const createCandidate = useCreateCandidate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [source, setSource] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const regionOptions = REGIONS.map((r) => ({ value: r, label: t(`recruit_region_${r}`) }));
  const sourceOptions = SOURCES.map((s) => ({ value: s, label: t(`recruit_source_${s}`) }));

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = t('recruit_fullNameRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createCandidate.mutate(
      {
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        region: region || null,
        experience_years: experienceYears ? parseInt(experienceYears, 10) : null,
        languages: selectedLanguages.length > 0 ? selectedLanguages : null,
        source: source || null,
        referred_by: referredBy.trim() || null,
        notes: notes.trim() || null,
        stage: 'applied',
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('error'), t('recruit_createError')),
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerTitle: t('recruit_new'), headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormInput
          label={t('recruit_fullName')}
          required
          value={fullName}
          onChangeText={setFullName}
          placeholder={t('recruit_fullNamePlaceholder')}
          error={errors.fullName}
          autoCapitalize="words"
        />
        <FormInput
          label={t('recruit_email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('recruit_emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormInput
          label={t('recruit_phone')}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('recruit_phonePlaceholder')}
          keyboardType="phone-pad"
        />
        <FormSelect
          label={t('recruit_region')}
          value={region}
          onChange={setRegion}
          options={regionOptions}
          placeholder={t('recruit_regionPlaceholder')}
        />
        <FormInput
          label={t('recruit_experience')}
          value={experienceYears}
          onChangeText={setExperienceYears}
          placeholder={t('recruit_experiencePlaceholder')}
          keyboardType="numeric"
        />

        {/* Multi-select languages */}
        <Text style={styles.label}>{t('recruit_languages')}</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.langChip, selectedLanguages.includes(lang) && styles.langChipActive]}
              onPress={() => toggleLanguage(lang)}
            >
              <Text
                style={[
                  styles.langChipText,
                  selectedLanguages.includes(lang) && styles.langChipTextActive,
                ]}
              >
                {t(`recruit_lang_${lang}`)}
              </Text>
              {selectedLanguages.includes(lang) && (
                <Ionicons name="checkmark" size={14} color={colors.white} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <FormSelect
          label={t('recruit_source')}
          value={source}
          onChange={setSource}
          options={sourceOptions}
          placeholder={t('recruit_sourcePlaceholder')}
        />
        <FormInput
          label={t('recruit_referredBy')}
          value={referredBy}
          onChangeText={setReferredBy}
          placeholder={t('recruit_referredByPlaceholder')}
        />
        <FormInput
          label={t('recruit_notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('recruit_notesPlaceholder')}
          multiline
          numberOfLines={3}
        />

        <View style={styles.buttons}>
          <Button
            title={t('save')}
            onPress={handleSubmit}
            loading={createCandidate.isPending}
            disabled={createCandidate.isPending}
            size="lg"
          />
          <Button title={t('cancel')} variant="outline" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120 },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderLight,
  },
  langChipActive: { backgroundColor: colors.primary },
  langChipText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
  langChipTextActive: { color: colors.white },
  buttons: { gap: spacing.sm, marginTop: spacing.md },
});
