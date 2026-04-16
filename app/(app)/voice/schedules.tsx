import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSchedules,
  createSchedule,
  saveSchedule,
  deleteSchedule,
  VoiceSchedule,
  ScheduleRule,
} from '../../../lib/voice/voiceApi';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { useI18n } from '../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme';

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export default function SchedulesScreen() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['voice-schedules'],
    queryFn: fetchSchedules,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRules, setEditRules] = useState<ScheduleRule[]>([]);

  const createMut = useMutation({
    mutationFn: () =>
      createSchedule({
        name: t('voice_newSchedule'),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        rules: DAY_LABELS.map((_, i) => ({
          day: i,
          start: '09:00',
          end: '18:00',
          enabled: i >= 1 && i <= 5, // Mon-Fri
        })),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice-schedules'] }),
  });

  const saveMut = useMutation({
    mutationFn: (params: { id: string; rules: ScheduleRule[] }) =>
      saveSchedule(params.id, { rules: params.rules } as Partial<VoiceSchedule>),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voice-schedules'] });
      setEditingId(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice-schedules'] }),
  });

  const startEdit = (schedule: VoiceSchedule) => {
    setEditingId(schedule.id);
    setEditRules([...schedule.rules]);
  };

  const toggleDay = (dayIndex: number) => {
    setEditRules((prev) =>
      prev.map((r) =>
        r.day === dayIndex ? { ...r, enabled: !r.enabled } : r
      )
    );
  };

  const updateTime = (dayIndex: number, field: 'start' | 'end', value: string) => {
    setEditRules((prev) =>
      prev.map((r) =>
        r.day === dayIndex ? { ...r, [field]: value } : r
      )
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerTitle: t('voice_schedules') }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const schedules = data?.schedules || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('voice_schedules') }} />

      {schedules.map((schedule) => (
        <Card key={schedule.id} style={styles.card}>
          <View style={styles.scheduleHeader}>
            <View>
              <Text style={styles.scheduleName}>{schedule.name}</Text>
              <Text style={styles.scheduleTimezone}>{schedule.timezone}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() =>
                  editingId === schedule.id
                    ? setEditingId(null)
                    : startEdit(schedule)
                }
              >
                <Ionicons
                  name={editingId === schedule.id ? 'close' : 'create-outline'}
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(t('voice_deleteSchedule'), t('voice_deleteScheduleConfirm'), [
                    { text: t('cancel'), style: 'cancel' },
                    {
                      text: t('voice_delete'),
                      style: 'destructive',
                      onPress: () => deleteMut.mutate(schedule.id),
                    },
                  ])
                }
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Day rules */}
          {(editingId === schedule.id ? editRules : schedule.rules).map(
            (rule) => (
              <View key={rule.day} style={styles.dayRow}>
                <Text style={[styles.dayLabel, !rule.enabled && styles.dayDisabled]}>
                  {DAY_LABELS[rule.day]}
                </Text>

                {editingId === schedule.id ? (
                  <>
                    <Switch
                      value={rule.enabled}
                      onValueChange={() => toggleDay(rule.day)}
                      trackColor={{ true: colors.success }}
                    />
                    {rule.enabled && (
                      <View style={styles.timeInputs}>
                        <FormInput
                          value={rule.start}
                          onChangeText={(v) => updateTime(rule.day, 'start', v)}
                          placeholder="09:00"
                          style={styles.timeField}
                        />
                        <Text style={styles.timeSep}>—</Text>
                        <FormInput
                          value={rule.end}
                          onChangeText={(v) => updateTime(rule.day, 'end', v)}
                          placeholder="18:00"
                          style={styles.timeField}
                        />
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={[styles.timeText, !rule.enabled && styles.dayDisabled]}>
                    {rule.enabled
                      ? `${rule.start} — ${rule.end}`
                      : t('voice_closed')}
                  </Text>
                )}
              </View>
            )
          )}

          {editingId === schedule.id && (
            <Button
              title={t('voice_save')}
              onPress={() =>
                saveMut.mutate({ id: schedule.id, rules: editRules })
              }
              loading={saveMut.isPending}
              size="sm"
              style={{ marginTop: 12 }}
            />
          )}
        </Card>
      ))}

      <Button
        title={t('voice_addSchedule')}
        onPress={() => createMut.mutate()}
        loading={createMut.isPending}
        variant="secondary"
        icon={<Ionicons name="add" size={18} color={colors.primary} />}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: spacing.md },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scheduleName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  scheduleTimezone: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 10,
  },
  dayLabel: {
    width: 28,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  dayDisabled: {
    color: colors.textTertiary,
  },
  timeText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  timeInputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeField: {
    flex: 1,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  timeSep: {
    color: colors.textTertiary,
  },
});
