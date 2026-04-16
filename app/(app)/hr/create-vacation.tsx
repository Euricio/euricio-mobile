import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useCreateVacationRequest, useVacationBalance } from '../../../lib/api/hr';
import { FormInput } from '../../../components/ui/FormInput';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
} from '../../../constants/theme';

function parseDateDE(dateStr: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
}

function countBusinessDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export default function CreateVacationScreen() {
  const { t } = useI18n();
  const createRequest = useCreateVacationRequest();
  const { data: balance } = useVacationBalance();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parsedStart = parseDateDE(startDate);
  const parsedEnd = parseDateDE(endDate);

  const daysCount = useMemo(() => {
    if (!parsedStart || !parsedEnd) return 0;
    return countBusinessDays(parsedStart, parsedEnd);
  }, [parsedStart, parsedEnd]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!startDate.trim()) newErrors.startDate = t('required');
    else if (!/^\d{2}\.\d{2}\.\d{4}$/.test(startDate)) newErrors.startDate = 'DD.MM.YYYY';
    if (!endDate.trim()) newErrors.endDate = t('required');
    else if (!/^\d{2}\.\d{2}\.\d{4}$/.test(endDate)) newErrors.endDate = 'DD.MM.YYYY';
    if (parsedStart && parsedEnd && parsedEnd < parsedStart) {
      newErrors.endDate = t('hr_endDate');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    createRequest.mutate(
      {
        start_date: parsedStart!,
        end_date: parsedEnd!,
        days_count: daysCount,
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
      <Stack.Screen options={{ headerTitle: t('hr_requestVacation') }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Vacation Balance */}
        {balance && (
          <Card style={styles.balanceCard}>
            <Text style={styles.balanceTitle}>{t('hr_vacationBalance')}</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={[styles.balanceValue, { color: colors.success }]}>{balance.remainingDays}</Text>
                <Text style={styles.balanceLabel}>{t('hr_daysRemaining')}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceValue}>{balance.totalDays}</Text>
                <Text style={styles.balanceLabel}>{t('hr_daysTotal')}</Text>
              </View>
            </View>
          </Card>
        )}

        <FormInput
          label={t('hr_startDate')}
          required
          value={startDate}
          onChangeText={setStartDate}
          placeholder="DD.MM.YYYY"
          keyboardType="numeric"
          error={errors.startDate}
        />
        <FormInput
          label={t('hr_endDate')}
          required
          value={endDate}
          onChangeText={setEndDate}
          placeholder="DD.MM.YYYY"
          keyboardType="numeric"
          error={errors.endDate}
        />

        {daysCount > 0 && (
          <View style={styles.daysRow}>
            <Text style={styles.daysLabel}>{t('hr_daysCount')}:</Text>
            <Text style={styles.daysValue}>{daysCount}</Text>
          </View>
        )}

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
  balanceCard: {
    marginBottom: spacing.lg,
  },
  balanceTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  balanceLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  daysLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  daysValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  buttonContainer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
