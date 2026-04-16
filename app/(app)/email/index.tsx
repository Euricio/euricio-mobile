import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEmailSettings, useTestSmtp } from '../../../lib/api/email';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

export default function EmailSettingsScreen() {
  const { t } = useI18n();
  const {
    data: settings,
    isLoading,
    refetch,
    isRefetching,
  } = useEmailSettings();
  const testSmtp = useTestSmtp();

  const isConfigured = !!(settings?.smtp_host && settings?.smtp_user);

  const handleTestConnection = () => {
    if (!settings?.smtp_host || !settings?.smtp_user || !settings?.smtp_password) {
      Alert.alert(t('error'), t('email_smtpNotConfigured'));
      return;
    }

    testSmtp.mutate(
      {
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port || 587,
        smtp_user: settings.smtp_user,
        smtp_password: settings.smtp_password,
        use_ssl: settings.use_ssl ?? false,
        sender_name: settings.sender_name || '',
        sender_email: settings.sender_email || settings.smtp_user,
      },
      {
        onSuccess: () => {
          Alert.alert(t('email_testConnection'), t('email_testSuccess'));
        },
        onError: (error) => {
          const msg = error.message;
          let detail = t('email_testFailed');
          if (msg.includes('auth')) {
            detail = t('email_testSmtpError_auth');
          } else if (msg.includes('connection') || msg.includes('ECONNREFUSED')) {
            detail = t('email_testSmtpError_connection');
          } else if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
            detail = t('email_testSmtpError_timeout');
          }
          Alert.alert(t('error'), detail);
        },
      },
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <Stack.Screen
        options={{
          headerTitle: t('email_settings'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

      {/* Status Card */}
      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusIcon,
              {
                backgroundColor: isConfigured
                  ? colors.success + '15'
                  : colors.warning + '15',
              },
            ]}
          >
            <Ionicons
              name={isConfigured ? 'checkmark-circle' : 'alert-circle'}
              size={28}
              color={isConfigured ? colors.success : colors.warning}
            />
          </View>
          <View style={styles.statusInfo}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>{t('email_smtpConnection')}</Text>
              <Badge
                label={isConfigured ? t('email_configured') : t('email_notConfigured')}
                variant={isConfigured ? 'success' : 'warning'}
                size="sm"
              />
            </View>
            <Text style={styles.statusHint}>
              {isConfigured ? t('email_configuredHint') : t('email_notConfiguredHint')}
            </Text>
          </View>
        </View>
      </Card>

      {isConfigured && settings && (
        <>
          {/* Sender Info */}
          <Text style={styles.sectionHeader}>{t('email_senderInfo')}</Text>
          <Card>
            <SettingDetail
              icon="person-outline"
              label={t('email_senderName')}
              value={settings.sender_name || '—'}
            />
            <SettingDetail
              icon="mail-outline"
              label={t('email_senderEmail')}
              value={settings.sender_email || settings.smtp_user || '—'}
              showBorder
            />
            <SettingDetail
              icon="server-outline"
              label={t('email_smtpHost')}
              value={settings.smtp_host || '—'}
              showBorder
            />
          </Card>

          {/* Branding */}
          {(settings.company_name || settings.brand_color) && (
            <>
              <Text style={styles.sectionHeader}>{t('email_branding')}</Text>
              <Card>
                {settings.company_name && (
                  <SettingDetail
                    icon="business-outline"
                    label={t('email_companyName')}
                    value={settings.company_name}
                  />
                )}
                {settings.brand_color && (
                  <SettingDetail
                    icon="color-palette-outline"
                    label={t('email_brandColor')}
                    value={settings.brand_color}
                    showBorder={!!settings.company_name}
                    rightContent={
                      <View
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: settings.brand_color },
                        ]}
                      />
                    }
                  />
                )}
              </Card>
            </>
          )}

          {/* Test Connection Button */}
          <View style={styles.testSection}>
            <Button
              title={t('email_testConnection')}
              onPress={handleTestConnection}
              variant="outline"
              loading={testSmtp.isPending}
              disabled={testSmtp.isPending}
              icon={
                <Ionicons
                  name="flash-outline"
                  size={18}
                  color={colors.primary}
                />
              }
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function SettingDetail({
  icon,
  label,
  value,
  showBorder,
  rightContent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  showBorder?: boolean;
  rightContent?: React.ReactNode;
}) {
  return (
    <View style={[styles.detailRow, showBorder && styles.detailBorder]}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
      {rightContent}
    </View>
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
  statusCard: {
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statusTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  statusHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: spacing.md,
  },
  detailBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
    marginTop: 1,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testSection: {
    marginTop: spacing.xl,
  },
});
