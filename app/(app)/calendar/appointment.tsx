import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import {
  useAppointment,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
} from '../../../lib/api/calendar';
import { useLeads } from '../../../lib/api/leads';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

const APPOINTMENT_TYPES = ['visit', 'call', 'meeting', 'other'] as const;

export default function AppointmentScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const isEdit = !!params.id;

  const { data: existingAppt, isLoading: apptLoading } = useAppointment(params.id || '');
  const { data: leads } = useLeads();
  const createAppt = useCreateAppointment();
  const updateAppt = useUpdateAppointment();
  const deleteAppt = useDeleteAppointment();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('meeting');
  const [date, setDate] = useState(params.date || new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [leadId, setLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (existingAppt) {
      setTitle(existingAppt.title || '');
      setType(existingAppt.type || 'meeting');
      if (existingAppt.start_at) {
        const d = new Date(existingAppt.start_at);
        setDate(d.toISOString().slice(0, 10));
        setStartTime(d.toTimeString().slice(0, 5));
      }
      if (existingAppt.end_at) {
        const d = new Date(existingAppt.end_at);
        setEndTime(d.toTimeString().slice(0, 5));
      }
      setLocation(existingAppt.location || '');
      setNotes(existingAppt.notes || '');
      setLeadId(existingAppt.lead_id);
    }
  }, [existingAppt]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('error'), t('calendar_appointmentTitleRequired'));
      return;
    }
    const startAt = `${date}T${startTime}:00`;
    const endAt = `${date}T${endTime}:00`;
    const payload = {
      title: title.trim(),
      type: type as 'visit' | 'call' | 'meeting' | 'other',
      start_at: startAt,
      end_at: endAt,
      location: location.trim() || null,
      notes: notes.trim() || null,
      lead_id: leadId,
      status: 'scheduled',
    };

    try {
      if (isEdit && params.id) {
        await updateAppt.mutateAsync({ id: params.id, ...payload });
      } else {
        await createAppt.mutateAsync(payload);
      }
      router.back();
    } catch {
      Alert.alert(t('error'), isEdit ? t('calendar_updateError') : t('calendar_createError'));
    }
  };

  const handleDelete = () => {
    if (!params.id) return;
    Alert.alert(t('calendar_deleteAppointment'), t('calendar_deleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAppt.mutateAsync(params.id!);
            router.back();
          } catch {
            Alert.alert(t('error'), t('calendar_deleteError'));
          }
        },
      },
    ]);
  };

  if (isEdit && apptLoading) return <LoadingScreen />;

  const typeOptions = APPOINTMENT_TYPES.map((tp) => ({
    label: t(`calendar_type_${tp}`),
    value: tp,
  }));

  const leadOptions = (leads ?? []).map((l) => ({
    label: l.full_name,
    value: l.id,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          headerTitle: isEdit ? t('calendar_editAppointment') : t('calendar_newAppointment'),
          headerRight: isEdit
            ? () => (
                <TouchableOpacity onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={22} color={colors.error} />
                </TouchableOpacity>
              )
            : undefined,
        }}
      />

      <Card>
        <FormInput
          label={t('calendar_appointmentTitle')}
          value={title}
          onChangeText={setTitle}
          placeholder={t('calendar_appointmentTitlePlaceholder')}
        />

        <FormSelect
          label={t('calendar_type')}
          value={type}
          onChange={setType}
          options={typeOptions}
        />

        <FormInput
          label={t('calendar_date')}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <FormInput
              label={t('calendar_startTime')}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="HH:MM"
            />
          </View>
          <View style={styles.timeField}>
            <FormInput
              label={t('calendar_endTime')}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="HH:MM"
            />
          </View>
        </View>

        <FormInput
          label={t('calendar_location')}
          value={location}
          onChangeText={setLocation}
          placeholder={t('calendar_locationPlaceholder')}
        />

        <FormSelect
          label={t('calendar_lead')}
          value={leadId || ''}
          onChange={(v: string) => setLeadId(v || null)}
          options={[{ label: '—', value: '' }, ...leadOptions]}
        />

        <FormInput
          label={t('calendar_notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('calendar_notesPlaceholder')}
          multiline
          numberOfLines={3}
        />
      </Card>

      <View style={styles.actions}>
        <Button
          title={t('save')}
          onPress={handleSave}
          size="lg"
        />
      </View>
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
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeField: {
    flex: 1,
  },
  actions: {
    marginTop: spacing.lg,
  },
});
