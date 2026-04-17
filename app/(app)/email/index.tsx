import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEmailSettings, useTestSmtp } from '../../../lib/api/email';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

/* ── Provider Presets ──────────────────────────────────────────── */

interface ProviderPreset {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  host: string;
  port: string;
  use_ssl: boolean;
}

const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  gmail: {
    label: 'Gmail',
    icon: 'mail-outline',
    color: '#EA4335',
    host: 'smtp.gmail.com',
    port: '587',
    use_ssl: false,
  },
  outlook: {
    label: 'Outlook',
    icon: 'mail-outline',
    color: '#0078D4',
    host: 'smtp.office365.com',
    port: '587',
    use_ssl: false,
  },
  yahoo: {
    label: 'Yahoo',
    icon: 'mail-outline',
    color: '#6001D2',
    host: 'smtp.mail.yahoo.com',
    port: '587',
    use_ssl: false,
  },
  custom: {
    label: 'Custom',
    icon: 'settings-outline',
    color: colors.textSecondary,
    host: '',
    port: '',
    use_ssl: false,
  },
};

/* ── Save mutation ─────────────────────────────────────────────── */

function useSaveEmailSettings() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (params: {
      smtp_host: string;
      smtp_port: number;
      smtp_user: string;
      smtp_password: string;
      sender_name: string;
      sender_email: string;
      use_ssl: boolean;
    }) => {
      const { error } = await supabase
        .from('user_email_settings')
        .upsert(
          {
            user_id: user!.id,
            smtp_host: params.smtp_host,
            smtp_port: params.smtp_port,
            smtp_user: params.smtp_user,
            smtp_password: params.smtp_password,
            sender_name: params.sender_name,
            sender_email: params.sender_email,
            use_ssl: params.use_ssl,
          },
          { onConflict: 'user_id' },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-settings'] });
    },
  });
}

export default function EmailSettingsScreen() {
  const { t } = useI18n();
  const {
    data: settings,
    isLoading,
    refetch,
    isRefetching,
  } = useEmailSettings();
  const testSmtp = useTestSmtp();
  const saveSettings = useSaveEmailSettings();

  // Form state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [useSsl, setUseSsl] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Populate form from loaded settings
  useEffect(() => {
    if (settings) {
      setSmtpHost(settings.smtp_host || '');
      setSmtpPort(String(settings.smtp_port || ''));
      setSmtpUser(settings.smtp_user || '');
      setSmtpPassword(settings.smtp_password || '');
      setSenderName(settings.sender_name || '');
      setSenderEmail(settings.sender_email || '');
      setUseSsl(settings.use_ssl ?? false);
    }
  }, [settings]);

  const isConfigured = !!(smtpHost && smtpUser);

  const handleSelectProvider = (key: string) => {
    setSelectedProvider(key);
    const preset = PROVIDER_PRESETS[key];
    setSmtpHost(preset.host);
    setSmtpPort(preset.port);
    setUseSsl(preset.use_ssl);
    if (key === 'custom') {
      setSmtpHost('');
      setSmtpPort('');
      setUseSsl(false);
    }
  };

  const handleSave = () => {
    if (!smtpHost.trim() || !smtpUser.trim()) {
      Alert.alert(t('error'), t('email_smtpNotConfigured'));
      return;
    }

    saveSettings.mutate(
      {
        smtp_host: smtpHost.trim(),
        smtp_port: parseInt(smtpPort, 10) || 587,
        smtp_user: smtpUser.trim(),
        smtp_password: smtpPassword,
        sender_name: senderName.trim(),
        sender_email: senderEmail.trim() || smtpUser.trim(),
        use_ssl: useSsl,
      },
      {
        onSuccess: () => {
          Alert.alert(t('email_settings'), t('email_saveSuccess'));
        },
        onError: () => {
          Alert.alert(t('error'), t('email_saveError'));
        },
      },
    );
  };

  const handleTestConnection = () => {
    if (!smtpHost || !smtpUser || !smtpPassword) {
      Alert.alert(t('error'), t('email_smtpNotConfigured'));
      return;
    }

    testSmtp.mutate(
      {
        smtp_host: smtpHost,
        smtp_port: parseInt(smtpPort, 10) || 587,
        smtp_user: smtpUser,
        smtp_password: smtpPassword,
        use_ssl: useSsl,
        sender_name: senderName || '',
        sender_email: senderEmail || smtpUser,
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
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

        {/* Provider Presets */}
        <Text style={styles.sectionHeader}>{t('email_provider')}</Text>
        <View style={styles.presetRow}>
          {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.presetButton,
                selectedProvider === key && styles.presetButtonActive,
              ]}
              activeOpacity={0.7}
              onPress={() => handleSelectProvider(key)}
            >
              <Ionicons name={preset.icon} size={20} color={preset.color} />
              <Text
                style={[
                  styles.presetLabel,
                  selectedProvider === key && styles.presetLabelActive,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SMTP Configuration */}
        <Text style={styles.sectionHeader}>{t('email_smtpConnection')}</Text>
        <Card style={styles.formCard}>
          <FormInput
            label={t('email_smtpHost')}
            value={smtpHost}
            onChangeText={setSmtpHost}
            placeholder="smtp.example.com"
            autoCapitalize="none"
          />
          <FormInput
            label={t('email_smtpPort')}
            value={smtpPort}
            onChangeText={setSmtpPort}
            placeholder="587"
            keyboardType="number-pad"
          />
          <FormInput
            label={t('email_smtpUser')}
            value={smtpUser}
            onChangeText={setSmtpUser}
            placeholder="user@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormInput
            label={t('email_smtpPassword')}
            value={smtpPassword}
            onChangeText={setSmtpPassword}
            placeholder="********"
            secureTextEntry
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>SSL / TLS</Text>
            <Switch
              value={useSsl}
              onValueChange={setUseSsl}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </Card>

        {/* Sender Info */}
        <Text style={styles.sectionHeader}>{t('email_senderInfo')}</Text>
        <Card style={styles.formCard}>
          <FormInput
            label={t('email_senderName')}
            value={senderName}
            onChangeText={setSenderName}
            placeholder="John Doe"
          />
          <FormInput
            label={t('email_senderEmail')}
            value={senderEmail}
            onChangeText={setSenderEmail}
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Card>

        {/* Branding (read-only display if present) */}
        {settings && (settings.company_name || settings.brand_color) && (
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

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Button
            title={t('email_save')}
            onPress={handleSave}
            loading={saveSettings.isPending}
            disabled={saveSettings.isPending || !smtpHost.trim() || !smtpUser.trim()}
          />
        </View>
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
      </ScrollView>
    </KeyboardAvoidingView>
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
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  presetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 4,
  },
  presetButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  presetLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  presetLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  formCard: {
    marginBottom: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  actionSection: {
    marginTop: spacing.lg,
  },
  testSection: {
    marginTop: spacing.md,
  },
});
