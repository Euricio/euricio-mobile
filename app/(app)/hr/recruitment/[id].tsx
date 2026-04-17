import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../../../lib/i18n';
import { useCallChoice } from '../../../../lib/call/useCallChoice';
import {
  useCandidate,
  useUpdateCandidate,
  useDeleteCandidate,
  RECRUITMENT_STAGES,
} from '../../../../lib/api/recruitment';
import type { CandidateStage } from '../../../../lib/api/recruitment';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Card } from '../../../../components/ui/Card';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../../constants/theme';

const REGIONS = ['berlin', 'hamburg', 'munich', 'cologne', 'frankfurt', 'marbella', 'malaga', 'madrid', 'other'];
const SOURCES = ['website', 'referral', 'portal', 'linkedin', 'other'];
const LANGUAGES = ['de', 'en', 'es', 'fr', 'pt', 'it', 'other'];

const STAGE_COLOR: Record<string, string> = Object.fromEntries(
  RECRUITMENT_STAGES.map((s) => [s.key, s.color]),
);

export default function CandidateDetailScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: candidate, isLoading } = useCandidate(id);
  const updateCandidate = useUpdateCandidate();
  const deleteCandidate = useDeleteCandidate();
  const { promptCall, CallChoiceSheet } = useCallChoice();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [source, setSource] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [coverLetterUrl, setCoverLetterUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [interview1Date, setInterview1Date] = useState('');
  const [interview2Date, setInterview2Date] = useState('');
  const [offerDate, setOfferDate] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [stage, setStage] = useState<CandidateStage>('applied');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (candidate && !loaded) {
      setFullName(candidate.full_name);
      setEmail(candidate.email || '');
      setPhone(candidate.phone || '');
      setRegion(candidate.region || '');
      setExperienceYears(candidate.experience_years?.toString() || '');
      setSelectedLanguages(candidate.languages || []);
      setSource(candidate.source || '');
      setReferredBy(candidate.referred_by || '');
      setCvUrl(candidate.cv_url || '');
      setCoverLetterUrl(candidate.cover_letter_url || '');
      setNotes(candidate.notes || '');
      setRejectionReason(candidate.rejection_reason || '');
      setInterview1Date(candidate.interview_1_date || '');
      setInterview2Date(candidate.interview_2_date || '');
      setOfferDate(candidate.offer_date || '');
      setHireDate(candidate.hire_date || '');
      setStage(candidate.stage);
      setLoaded(true);
    }
  }, [candidate, loaded]);

  const regionOptions = REGIONS.map((r) => ({ value: r, label: t(`recruit_region_${r}`) }));
  const sourceOptions = SOURCES.map((s) => ({ value: s, label: t(`recruit_source_${s}`) }));
  const stageOptions = RECRUITMENT_STAGES.map((s) => ({ value: s.key, label: t(`recruit_stage_${s.key}`) }));

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const handleMoveToStage = useCallback(() => {
    Alert.alert(t('recruit_moveToStage'), fullName, [
      ...RECRUITMENT_STAGES.map((s) => ({
        text: t(`recruit_stage_${s.key}`),
        onPress: () => {
          setStage(s.key);
          updateCandidate.mutate({ id, stage: s.key });
        },
      })),
      { text: t('cancel'), style: 'cancel' as const },
    ]);
  }, [id, fullName, updateCandidate, t]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = t('recruit_fullNameRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    updateCandidate.mutate(
      {
        id,
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        region: region || null,
        experience_years: experienceYears ? parseInt(experienceYears, 10) : null,
        languages: selectedLanguages.length > 0 ? selectedLanguages : null,
        source: source || null,
        referred_by: referredBy.trim() || null,
        cv_url: cvUrl.trim() || null,
        cover_letter_url: coverLetterUrl.trim() || null,
        notes: notes.trim() || null,
        rejection_reason: rejectionReason.trim() || null,
        interview_1_date: interview1Date || null,
        interview_2_date: interview2Date || null,
        offer_date: offerDate || null,
        hire_date: hireDate || null,
        stage,
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('error'), t('recruit_updateError')),
      },
    );
  };

  const handleDelete = () => {
    Alert.alert(t('recruit_delete'), t('recruit_deleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () =>
          deleteCandidate.mutate(id, {
            onSuccess: () => router.back(),
            onError: () => Alert.alert(t('error'), t('recruit_deleteError')),
          }),
      },
    ]);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerTitle: t('recruit_edit'), headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Stage + actions */}
        <Card style={styles.stageCard}>
          <View style={styles.stageRow}>
            <Badge
              label={t(`recruit_stage_${stage}`)}
              variant={stage === 'hired' ? 'success' : stage === 'rejected' ? 'error' : 'info'}
            />
            <Button title={t('recruit_moveToStage')} variant="outline" size="sm" onPress={handleMoveToStage} />
          </View>
          <View style={styles.actionRow}>
            {phone ? (
              <TouchableOpacity style={styles.actionBtn} onPress={() => promptCall(phone)}>
                <Ionicons name="call-outline" size={18} color={colors.success} />
                <Text style={styles.actionText}>{t('recruit_call')}</Text>
              </TouchableOpacity>
            ) : null}
            {email ? (
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`mailto:${email}`)}>
                <Ionicons name="mail-outline" size={18} color={colors.info} />
                <Text style={styles.actionText}>{t('recruit_emailAction')}</Text>
              </TouchableOpacity>
            ) : null}
            {cvUrl ? (
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(cvUrl)}>
                <Ionicons name="document-text-outline" size={18} color={colors.accent} />
                <Text style={styles.actionText}>{t('recruit_openCv')}</Text>
              </TouchableOpacity>
            ) : null}
            {coverLetterUrl ? (
              <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(coverLetterUrl)}>
                <Ionicons name="document-outline" size={18} color={colors.accent} />
                <Text style={styles.actionText}>{t('recruit_openCoverLetter')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Card>

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

        <Text style={styles.label}>{t('recruit_languages')}</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.langChip, selectedLanguages.includes(lang) && styles.langChipActive]}
              onPress={() => toggleLanguage(lang)}
            >
              <Text
                style={[styles.langChipText, selectedLanguages.includes(lang) && styles.langChipTextActive]}
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
          label={t('recruit_cvUrl')}
          value={cvUrl}
          onChangeText={setCvUrl}
          placeholder={t('recruit_cvUrlPlaceholder')}
          autoCapitalize="none"
        />
        <FormInput
          label={t('recruit_coverLetterUrl')}
          value={coverLetterUrl}
          onChangeText={setCoverLetterUrl}
          placeholder={t('recruit_coverLetterUrlPlaceholder')}
          autoCapitalize="none"
        />
        <FormInput
          label={t('recruit_notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('recruit_notesPlaceholder')}
          multiline
          numberOfLines={3}
        />

        {/* Date tracking */}
        <FormInput
          label={t('recruit_interview1Date')}
          value={interview1Date}
          onChangeText={setInterview1Date}
          placeholder="YYYY-MM-DD"
        />
        <FormInput
          label={t('recruit_interview2Date')}
          value={interview2Date}
          onChangeText={setInterview2Date}
          placeholder="YYYY-MM-DD"
        />
        <FormInput
          label={t('recruit_offerDate')}
          value={offerDate}
          onChangeText={setOfferDate}
          placeholder="YYYY-MM-DD"
        />
        <FormInput
          label={t('recruit_hireDate')}
          value={hireDate}
          onChangeText={setHireDate}
          placeholder="YYYY-MM-DD"
        />

        {stage === 'rejected' && (
          <FormInput
            label={t('recruit_rejectionReason')}
            value={rejectionReason}
            onChangeText={setRejectionReason}
            placeholder={t('recruit_rejectionReasonPlaceholder')}
            multiline
            numberOfLines={3}
          />
        )}

        <View style={styles.buttons}>
          <Button
            title={t('save')}
            onPress={handleSubmit}
            loading={updateCandidate.isPending}
            disabled={updateCandidate.isPending}
            size="lg"
          />
          <Button title={t('delete')} variant="danger" onPress={handleDelete} />
          <Button title={t('cancel')} variant="outline" onPress={() => router.back()} />
        </View>
      </ScrollView>
      <CallChoiceSheet />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120 },
  stageCard: { marginBottom: spacing.md },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.borderLight,
  },
  actionText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.text },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
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
