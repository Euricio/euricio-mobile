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
import { useCreateShiftRequest } from '../../../lib/api/hr';
import { FormInput } from '../../../components/ui/FormInput';
import { Button } from '../../../components/ui/Button';
import { useI18n } from '../../../lib/i18n';
import { colors, spacing } from '../../../constants/theme';

function parseDateDE(dateStr: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
}

export default function CreateShiftRequestScreen() {
  const { t } = useI18n();
  const createRequest = useCreateShiftRequest();

  const [shiftDate, setShiftDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!shiftDate.trim()) newErrors.shiftDate = t('required');
    else if (!/^\d{2}\.\d{2}\.\d{4}$/.test(shiftDate)) newErrors.shiftDate = 'DD.MM.YYYY';
    if (!startTime.trim()) newErrors.startTime = t('required');
    else if (!/^\d{2}:\d{2}$/.test(startTime)) newErrors.startTime = 'HH:MM';
    if (!endTime.trim()) newErrors.endTime = t('required');
    else if (!/^\d{2}:\d{2}$/.test(endTime)) newErrors.endTime = 'HH:MM';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    createRequest.mutate(
      {
        shift_date: parseDateDE(shiftDate)!,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('error'), t('hr_requestError')),
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerTitle: t('hr_requestShiftChange') }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormInput
          label={t('hr_shiftDate')}
          required
          value={shiftDate}
          onChangeText={setShiftDate}
          placeholder="DD.MM.YYYY"
          keyboardType="numeric"
          error={errors.shiftDate}
        />
        <FormInput
          label={t('hr_preferredStart')}
          required
          value={startTime}
          onChangeText={setStartTime}
          placeholder="HH:MM"
          keyboardType="numeric"
          error={errors.startTime}
        />
        <FormInput
          label={t('hr_preferredEnd')}
          required
          value={endTime}
          onChangeText={setEndTime}
          placeholder="HH:MM"
          keyboardType="numeric"
          error={errors.endTime}
        />
        <FormInput
          label={t('hr_vacationNotes')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('hr_vacationNotes')}
          multiline
          numberOfLines={3}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={t('save')}
            onPress={handleSubmit}
            loading={createRequest.isPending}
            disabled={createRequest.isPending}
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
