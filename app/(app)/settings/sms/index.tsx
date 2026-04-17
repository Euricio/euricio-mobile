import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useSmsConfig,
  useUpdateSmsConfig,
  useSmsNotificationSettings,
  useUpdateNotificationSetting,
} from '../../../../lib/api/sms-settings';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormInput } from '../../../../components/ui/FormInput';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { useI18n } from '../../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight } from '../../../../constants/theme';

export default function SmsSettingsScreen() {
  const { t } = useI18n();
  const { data: smsConfig, isLoading: configLoading } = useSmsConfig();
  const updateConfig = useUpdateSmsConfig();
  const { data: notifications, isLoading: notifLoading } = useSmsNotificationSettings();
  const updateNotification = useUpdateNotificationSetting();

  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (smsConfig) {
      setAccountSid(smsConfig.account_sid ?? '');
      setAuthToken(smsConfig.auth_token ?? '');
      setPhoneNumber(smsConfig.phone_number ?? '');
    }
  }, [smsConfig]);

  const eventTypes = [
    { key: 'new_lead', label: t('sms_newLead') },
    { key: 'appointment_reminder', label: t('sms_appointmentReminder') },
    { key: 'missed_call', label: t('sms_missedCall') },
    { key: 'new_message', label: t('sms_newMessage') },
    { key: 'status_change', label: t('sms_statusChange') },
  ];

  const handleSaveConfig = () => {
    updateConfig.mutate(
      {
        account_sid: accountSid,
        auth_token: authToken,
        phone_number: phoneNumber,
      },
      {
        onSuccess: () => Alert.alert(t('sms_success'), t('sms_configSaved')),
        onError: () => Alert.alert(t('sms_error'), t('sms_configFailed')),
      },
    );
  };

  const handleToggleNotification = (id: string, enabled: boolean) => {
    updateNotification.mutate({ id, enabled });
  };

  const getNotificationSetting = (eventKey: string) => {
    return notifications?.find((n) => n.event_type === eventKey);
  };

  if (configLoading || notifLoading) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: t('sms_title') }} />
        <LoadingScreen />
      </>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Stack.Screen options={{ headerTitle: t('sms_title') }} />

        {/* Twilio Configuration */}
        <Text style={styles.sectionHeader}>{t('sms_twilioConfig')}</Text>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>{t('sms_twilioCredentials')}</Text>
          </View>
          <FormInput
            label={t('sms_accountSid')}
            value={accountSid}
            onChangeText={setAccountSid}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            autoCapitalize="none"
          />
          <FormInput
            label={t('sms_authToken')}
            value={authToken}
            onChangeText={setAuthToken}
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            secureTextEntry
            autoCapitalize="none"
          />
          <FormInput
            label={t('sms_phoneNumber')}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+49..."
            keyboardType="phone-pad"
          />
          <Button
            title={t('sms_save')}
            onPress={handleSaveConfig}
            loading={updateConfig.isPending}
            disabled={!accountSid || !authToken || !phoneNumber}
            size="lg"
            style={styles.saveButton}
          />
        </Card>

        {/* Notification Toggles */}
        <Text style={styles.sectionHeader}>{t('sms_notificationSettings')}</Text>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>{t('sms_eventNotifications')}</Text>
          </View>
          {eventTypes.map((event, index) => {
            const setting = getNotificationSetting(event.key);
            const isEnabled = setting?.enabled ?? false;

            return (
              <View
                key={event.key}
                style={[
                  styles.notificationRow,
                  index > 0 && styles.notificationRowBorder,
                ]}
              >
                <Text style={styles.notificationLabel}>{event.label}</Text>
                <Switch
                  value={isEnabled}
                  onValueChange={(value) => {
                    if (setting) {
                      handleToggleNotification(setting.id, value);
                    }
                  }}
                  trackColor={{ true: colors.success }}
                  disabled={!setting}
                />
              </View>
            );
          })}
        </Card>
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
  sectionHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    marginLeft: spacing.xs,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  notificationRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  notificationLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
});
