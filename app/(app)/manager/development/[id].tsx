import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../../../lib/i18n';
import {
  useDevelopmentPlan,
  useUpdateDevelopmentPlan,
  useDeleteDevelopmentPlan,
} from '../../../../lib/api/development';
import { useTeamMembers } from '../../../../lib/api/manager-shifts';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { colors, spacing, fontSize, fontWeight } from '../../../../constants/theme';

const AREAS = ['communication', 'sales', 'leadership', 'technical', 'organization', 'customer_service', 'other'];
const TRIGGERS = ['onboarding', 'performance', 'promotion', 'request', 'periodic'];
const STATUSES = ['draft', 'active', 'completed', 'blocked'];

export default function DevelopmentPlanDetailScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: plan, isLoading } = useDevelopmentPlan(id);
  const updatePlan = useUpdateDevelopmentPlan();
  const deletePlan = useDeleteDevelopmentPlan();
  const { data: members } = useTeamMembers();

  const [userId, setUserId] = useState('');
  const [area, setArea] = useState('');
  const [triggerCategory, setTriggerCategory] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');
  const [targetState, setTargetState] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [plannedMeasures, setPlannedMeasures] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('draft');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (plan && !loaded) {
      setUserId(plan.user_id);
      setArea(plan.area || '');
      setTriggerCategory(plan.trigger_category || '');
      setCurrentSituation(plan.current_situation || '');
      setTargetState(plan.target_state || '');
      setSuccessCriteria(plan.success_criteria || '');
      setPlannedMeasures(plan.planned_measures || '');
      setProgress(plan.progress ?? 0);
      setStatus(plan.status);
      setStartDate(plan.start_date || '');
      setTargetDate(plan.target_date || '');
      setReviewDate(plan.review_date || '');
      setLoaded(true);
    }
  }, [plan, loaded]);

  const employeeOptions = (members ?? []).map((m) => ({ value: m.id, label: m.full_name }));
  const areaOptions = AREAS.map((a) => ({ value: a, label: t(`dev_area_${a}`) }));
  const triggerOptions = TRIGGERS.map((tr) => ({ value: tr, label: t(`dev_trigger_${tr}`) }));
  const statusOptions = STATUSES.map((s) => ({ value: s, label: t(`dev_status_${s}`) }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!userId) e.userId = t('dev_employeeRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    updatePlan.mutate(
      {
        id,
        user_id: userId,
        area: area || 'other',
        trigger_category: triggerCategory || null,
        current_situation: currentSituation || null,
        target_state: targetState || null,
        success_criteria: successCriteria || null,
        planned_measures: plannedMeasures || null,
        progress,
        status: status as any,
        start_date: startDate || null,
        target_date: targetDate || null,
        review_date: reviewDate || null,
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('error'), t('dev_updateError')),
      },
    );
  };

  const handleDelete = () => {
    Alert.alert(t('dev_delete'), t('dev_deleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () =>
          deletePlan.mutate(id, {
            onSuccess: () => router.back(),
            onError: () => Alert.alert(t('error'), t('dev_deleteError')),
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
      <Stack.Screen options={{ headerTitle: t('dev_edit'), headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormSelect
          label={t('dev_employee')}
          required
          value={userId}
          onChange={setUserId}
          options={employeeOptions}
          placeholder={t('dev_employeePlaceholder')}
          error={errors.userId}
        />
        <FormSelect
          label={t('dev_area')}
          value={area}
          onChange={setArea}
          options={areaOptions}
          placeholder={t('dev_areaPlaceholder')}
        />
        <FormSelect
          label={t('dev_triggerCategory')}
          value={triggerCategory}
          onChange={setTriggerCategory}
          options={triggerOptions}
          placeholder={t('dev_triggerCategoryPlaceholder')}
        />
        <FormInput
          label={t('dev_currentSituation')}
          value={currentSituation}
          onChangeText={setCurrentSituation}
          placeholder={t('dev_currentSituationPlaceholder')}
          multiline
          numberOfLines={3}
        />
        <FormInput
          label={t('dev_targetState')}
          value={targetState}
          onChangeText={setTargetState}
          placeholder={t('dev_targetStatePlaceholder')}
          multiline
          numberOfLines={3}
        />
        <FormInput
          label={t('dev_successCriteria')}
          value={successCriteria}
          onChangeText={setSuccessCriteria}
          placeholder={t('dev_successCriteriaPlaceholder')}
          multiline
          numberOfLines={3}
        />
        <FormInput
          label={t('dev_plannedMeasures')}
          value={plannedMeasures}
          onChangeText={setPlannedMeasures}
          placeholder={t('dev_plannedMeasuresPlaceholder')}
          multiline
          numberOfLines={3}
        />

        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>{t('dev_progress')}: {progress}%</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={5}
            value={progress}
            onValueChange={setProgress}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.borderLight}
            thumbTintColor={colors.primary}
          />
        </View>

        <FormSelect
          label={t('dev_status')}
          value={status}
          onChange={setStatus}
          options={statusOptions}
        />
        <FormInput
          label={t('dev_startDate')}
          value={startDate}
          onChangeText={setStartDate}
          placeholder={t('dev_datePlaceholder')}
        />
        <FormInput
          label={t('dev_targetDate')}
          value={targetDate}
          onChangeText={setTargetDate}
          placeholder={t('dev_datePlaceholder')}
        />
        <FormInput
          label={t('dev_reviewDate')}
          value={reviewDate}
          onChangeText={setReviewDate}
          placeholder={t('dev_datePlaceholder')}
        />

        <View style={styles.buttons}>
          <Button
            title={t('save')}
            onPress={handleSubmit}
            loading={updatePlan.isPending}
            disabled={updatePlan.isPending}
            size="lg"
          />
          <Button title={t('delete')} variant="danger" onPress={handleDelete} />
          <Button title={t('cancel')} variant="outline" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120 },
  sliderRow: { marginVertical: spacing.sm },
  sliderLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text, marginBottom: spacing.xs },
  slider: { width: '100%', height: 40 },
  buttons: { gap: spacing.sm, marginTop: spacing.md },
});
