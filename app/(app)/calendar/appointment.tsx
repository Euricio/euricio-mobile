import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
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
import { useBusyStatus, RedirectMode } from '../../../lib/api/busyStatus';
import { useAuthStore } from '../../../store/authStore';
import { BusyPresetPicker, BusyPresetValues } from '../../../components/voice/BusyPresetPicker';
import type { AnnouncementLang } from '../../../lib/busyPresets';
import { BusyRedirectOptions } from '../../../components/voice/BusyRedirectOptions';
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
  const { data: busyStatus } = useBusyStatus();
  const user = useAuthStore(s => s.user);
  const displayName =
    (busyStatus as any)?.display_name ||
    (user?.user_metadata as any)?.full_name ||
    user?.email ||
    '';
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

  // Deep Work
  const [blocksCalls, setBlocksCalls] = useState(false);
  const [preset, setPreset] = useState<BusyPresetValues>({
    busy_preset: 'in_appointment',
    busy_callback_time: '',
    busy_reason: '',
    announcement: '',
    busy_announcement_language: 'es',
  });
  const [redirect, setRedirect] = useState<{
    announcement: string;
    redirect_mode: RedirectMode;
    redirect_agent_id: string | null;
    redirect_number: string;
  }>({ announcement: '', redirect_mode: 'next_in_flow', redirect_agent_id: null, redirect_number: '' });

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
      const e: any = existingAppt;
      setBlocksCalls(!!e.blocks_calls);
      setPreset({
        busy_preset: e.busy_preset || 'in_appointment',
        busy_callback_time: e.busy_callback_time || '',
        busy_reason: '',
        announcement: e.announcement || '',
        busy_announcement_language: (e.busy_announcement_language as AnnouncementLang) || 'es',
      });
      setRedirect({
        announcement: e.announcement || '',
        redirect_mode: (e.redirect_mode as RedirectMode) || 'next_in_flow',
        redirect_agent_id: e.redirect_agent_id || null,
        redirect_number: e.redirect_number || '',
      });
    }
  }, [existingAppt]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('error'), t('calendar_appointmentTitleRequired'));
      return;
    }
    const startAt = `${date}T${startTime}:00`;
    const endAt = `${date}T${endTime}:00`;
    const deepWorkPayload: any = blocksCalls
      ? {
          blocks_calls: true,
          busy_preset: preset.busy_preset,
          busy_callback_time: preset.busy_callback_time || null,
          busy_announcement_language: preset.busy_announcement_language,
          announcement: preset.announcement || null,
          redirect_mode: redirect.redirect_mode,
          redirect_agent_id: redirect.redirect_agent_id,
          redirect_number: redirect.redirect_number || null,
        }
      : {
          blocks_calls: false,
          busy_preset: null,
          busy_callback_time: null,
          busy_announcement_language: null,
          announcement: null,
          redirect_mode: null,
          redirect_agent_id: null,
          redirect_number: null,
        };
    const payload = {
      title: title.trim(),
      type: type as 'visit' | 'call' | 'meeting' | 'other',
      start_at: startAt,
      end_at: endAt,
      location: location.trim() || null,
      notes: notes.trim() || null,
      lead_id: leadId,
      status: 'scheduled',
      ...deepWorkPayload,
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

      <Card>
        <View style={styles.deepWorkRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.deepWorkTitle}>{t('busy.deep_work_section_title')}</Text>
            <Text style={styles.deepWorkHint}>{t('busy.deep_work_hint')}</Text>
          </View>
          <Switch
            value={blocksCalls}
            onValueChange={setBlocksCalls}
            trackColor={{ false: colors.border, true: 'rgba(239,68,68,0.4)' }}
            thumbColor={blocksCalls ? colors.error : colors.surface}
          />
        </View>

        {blocksCalls && (
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            <BusyPresetPicker
              values={preset}
              displayName={displayName}
              onChange={setPreset}
            />
            <BusyRedirectOptions values={redirect} onChange={setRedirect} hideAnnouncement />
          </View>
        )}
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
    gap: spacing.md,
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
  deepWorkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  deepWorkTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  deepWorkHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
