import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../../lib/i18n';
import { useBusyStatus, useSetBusy, RedirectMode } from '../../../lib/api/busyStatus';
import { BusyRedirectOptions } from '../../../components/voice/BusyRedirectOptions';
import { BusyPresetPicker, BusyPresetValues } from '../../../components/voice/BusyPresetPicker';
import type { AnnouncementLang } from '../../../lib/busyPresets';
import { Card } from '../../../components/ui/Card';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { useAuthStore } from '../../../store/authStore';
import { StyleSheet as RNStyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../constants/theme';

export default function BusyModeScreen() {
  const { t, locale } = useI18n();
  const defaultLang: AnnouncementLang =
    locale === 'de' ? 'de' : locale === 'en' ? 'en' : 'es';
  const { data: busyStatus, isLoading } = useBusyStatus();
  const setBusy = useSetBusy();
  const user = useAuthStore(s => s.user);
  const displayName =
    (busyStatus as any)?.display_name ||
    (user?.user_metadata as any)?.full_name ||
    user?.email ||
    '';

  const [showForm, setShowForm] = useState(false);
  const [preset, setPreset] = useState<BusyPresetValues>({
    busy_preset: 'in_appointment',
    busy_callback_time: '',
    busy_reason: '',
    announcement: '',
    busy_announcement_language: defaultLang,
  });
  const [redirect, setRedirect] = useState<{
    announcement: string;
    redirect_mode: RedirectMode;
    redirect_agent_id: string | null;
    redirect_number: string;
  }>({ announcement: '', redirect_mode: 'next_in_flow', redirect_agent_id: null, redirect_number: '' });

  if (isLoading) return <LoadingScreen />;

  async function handleToggleOn() {
    setPreset({ busy_preset: 'in_appointment', busy_callback_time: '', busy_reason: '', announcement: '', busy_announcement_language: defaultLang });
    setRedirect({ announcement: '', redirect_mode: 'next_in_flow', redirect_agent_id: null, redirect_number: '' });
    setShowForm(true);
  }

  async function handleToggleOff() {
    try {
      await setBusy.mutateAsync({ is_busy: false });
    } catch (err) {
      Alert.alert(t('error'), err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleConfirmBusy() {
    try {
      const reason =
        preset.busy_preset === 'custom'
          ? preset.busy_reason
          : t(`busy.presets.${preset.busy_preset}.label`);
      await setBusy.mutateAsync({
        is_busy: true,
        busy_reason: reason || undefined,
        busy_announcement: preset.announcement || undefined,
        busy_redirect_mode: redirect.redirect_mode,
        busy_redirect_agent_id: redirect.redirect_agent_id,
        busy_redirect_number: redirect.redirect_number || undefined,
        // extra fields understood by server
        busy_preset: preset.busy_preset,
        busy_callback_time: preset.busy_callback_time || undefined,
        busy_announcement_language: preset.busy_announcement_language,
      } as any);
      setShowForm(false);
    } catch (err) {
      Alert.alert(t('error'), err instanceof Error ? err.message : 'Error');
    }
  }

  const isBusy = busyStatus?.is_busy ?? false;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(tabs)/dashboard' as any);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('busy_set_title')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>

      <Card style={RNStyleSheet.flatten([styles.statusCard, isBusy && styles.statusCardBusy]) as ViewStyle}>
        <View style={styles.statusRow}>
          <View style={styles.statusLeft}>
            <View style={[styles.dot, { backgroundColor: isBusy ? colors.error : colors.success }]} />
            <View>
              <Text style={styles.statusLabel}>
                {isBusy ? t('busy_toggle_busy') : t('busy_toggle_available')}
              </Text>
              {isBusy && busyStatus?.busy_reason && (
                <Text style={styles.statusReason}>{busyStatus.busy_reason}</Text>
              )}
              {isBusy && busyStatus?.busy_set_at && (
                <Text style={styles.statusTime}>
                  {new Date(busyStatus.busy_set_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          </View>
          <Switch
            value={isBusy}
            onValueChange={v => v ? handleToggleOn() : handleToggleOff()}
            trackColor={{ false: colors.border, true: 'rgba(239,68,68,0.4)' }}
            thumbColor={isBusy ? colors.error : colors.surface}
            disabled={setBusy.isPending}
          />
        </View>
      </Card>

      {showForm && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>{t('busy_set_title')}</Text>

          <BusyPresetPicker
            values={preset}
            displayName={displayName}
            onChange={setPreset}
          />

          <View style={{ height: spacing.md }} />
          <BusyRedirectOptions values={redirect} onChange={setRedirect} hideAnnouncement />

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.btn, styles.btnBusy]}
              onPress={handleConfirmBusy}
              disabled={setBusy.isPending}
            >
              {setBusy.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnBusyText}>{t('busy_set_button')}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              onPress={() => setShowForm(false)}
            >
              <Text style={styles.btnCancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {isBusy && !showForm && (
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={colors.error} />
          <Text style={styles.infoText}>
            {busyStatus?.busy_redirect_mode === 'next_in_flow'
              ? t('busy_redirect_next_in_flow')
              : busyStatus?.busy_redirect_mode === 'specific_agent'
              ? t('busy_redirect_specific_agent')
              : t('busy_redirect_external_number')}
          </Text>
        </Card>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  headerSpacer: { width: 40 },
  content: { padding: spacing.lg, gap: spacing.md },
  statusCard: { padding: spacing.lg },
  statusCardBusy: { borderColor: colors.error, borderWidth: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  statusLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  statusReason: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  statusTime: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 1 },
  formCard: { padding: spacing.lg, gap: spacing.sm },
  formTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm },
  formButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  btnBusy: { backgroundColor: colors.error },
  btnBusyText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  btnCancel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  btnCancelText: { color: colors.text, fontSize: fontSize.sm },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  infoText: { fontSize: fontSize.sm, color: colors.error, flex: 1 },
});
