import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../../../lib/i18n';
import {
  useTeamShifts,
  useTeamMembers,
  useUpdateShift,
  useDeleteShift,
} from '../../../../lib/api/manager-shifts';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { colors, spacing } from '../../../../constants/theme';

export default function EditShiftScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ id: string; date: string; userId: string }>();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();
  const { data: members } = useTeamMembers();
  const { data: shifts, isLoading } = useTeamShifts(params.date || '', params.date || '');

  const shift = shifts?.find((s) => s.id === params.id);

  const [userId, setUserId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('planned');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (shift && !loaded) {
      setUserId(shift.user_id);
      setDate(shift.date);
      setStartTime(shift.start_time?.slice(0, 5) || '');
      setEndTime(shift.end_time?.slice(0, 5) || '');
      setBreakMinutes(shift.break_minutes?.toString() || '');
      setLocation(shift.location || '');
      setNotes(shift.notes || '');
      setStatus(shift.status);
      setLoaded(true);
    }
  }, [shift, loaded]);

  const employeeOptions = (members ?? []).map((m) => ({
    value: m.id,
    label: m.full_name,
  }));

  const statusOptions = [
    { value: 'planned', label: t('shifts_status_planned') },
    { value: 'appeared', label: t('shifts_status_appeared') },
    { value: 'absent', label: t('shifts_status_absent') },
  ];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!userId) e.userId = t('shifts_employeeRequired');
    if (!date) e.date = t('shifts_dateRequired');
    if (!startTime) e.startTime = t('shifts_startTimeRequired');
    if (!endTime) e.endTime = t('shifts_endTimeRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    updateShift.mutate(
      {
        id: params.id,
        user_id: userId,
        date,
        start_time: startTime,
        end_time: endTime,
        break_minutes: breakMinutes ? parseInt(breakMinutes, 10) : null,
        location: location || null,
        notes: notes || null,
        status: status as 'planned' | 'appeared' | 'absent',
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('error'), t('shifts_updateError')),
      },
    );
  };

  const handleDelete = () => {
    Alert.alert(t('shifts_delete'), t('shifts_deleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () =>
          deleteShift.mutate(params.id, {
            onSuccess: () => router.back(),
            onError: () => Alert.alert(t('error'), t('shifts_deleteError')),
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
      <Stack.Screen options={{ headerTitle: t('shifts_edit'), headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormSelect
          label={t('shifts_employee')}
          required
          value={userId}
          onChange={setUserId}
          options={employeeOptions}
          placeholder={t('shifts_employeePlaceholder')}
          error={errors.userId}
        />
        <FormInput
          label={t('shifts_date')}
          required
          value={date}
          onChangeText={setDate}
          placeholder={t('shifts_datePlaceholder')}
          error={errors.date}
        />
        <FormInput
          label={t('shifts_startTime')}
          required
          value={startTime}
          onChangeText={setStartTime}
          placeholder={t('shifts_startTimePlaceholder')}
          error={errors.startTime}
        />
        <FormInput
          label={t('shifts_endTime')}
          required
          value={endTime}
          onChangeText={setEndTime}
          placeholder={t('shifts_endTimePlaceholder')}
          error={errors.endTime}
        />
        <FormInput
          label={t('shifts_breakMinutes')}
          value={breakMinutes}
          onChangeText={setBreakMinutes}
          placeholder={t('shifts_breakMinutesPlaceholder')}
          keyboardType="numeric"
        />
        <FormInput
          label={t('shifts_location')}
          value={location}
          onChangeText={setLocation}
          placeholder={t('shifts_locationPlaceholder')}
        />
        <FormSelect
          label={t('shifts_status')}
          value={status}
          onChange={setStatus}
          options={statusOptions}
        />
        <FormInput
          label={t('shifts_notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('shifts_notesPlaceholder')}
          multiline
          numberOfLines={3}
        />
        <View style={styles.buttons}>
          <Button
            title={t('save')}
            onPress={handleSubmit}
            loading={updateShift.isPending}
            disabled={updateShift.isPending}
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
  buttons: { gap: spacing.sm, marginTop: spacing.md },
});
