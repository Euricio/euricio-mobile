import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../../../lib/auth/authContext';
import { useAuthStore } from '../../../store/authStore';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { useI18n, LOCALE_LABELS } from '../../../lib/i18n';
import type { Locale } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const user = useAuthStore((s) => s.user);
  const { t, locale, setLocale } = useI18n();

  const handleSignOut = () => {
    Alert.alert(t('settings_logout'), t('settings_logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('settings_logout'),
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || '—';
  const userEmail = user?.email || '—';
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Profile Section */}
      <Card style={styles.profileCard}>
        <View style={styles.profileRow}>
          <Avatar name={userName} size={56} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>
        </View>
      </Card>

      {/* Telefonie Section */}
      <Text style={styles.sectionHeader}>{t('settings_telephony')}</Text>
      <Card>
        <SettingRow
          icon="call-outline"
          label={t('settings_availability')}
          right={<Switch value={true} trackColor={{ true: colors.success }} />}
        />
      </Card>

      {/* Benachrichtigungen Section */}
      <Text style={styles.sectionHeader}>{t('settings_notifications')}</Text>
      <Card>
        <SettingRow
          icon="notifications-outline"
          label={t('settings_pushNotifications')}
          right={<Switch value={true} trackColor={{ true: colors.primary }} />}
        />
        <SettingRow
          icon="call-outline"
          label={t('settings_missedCalls')}
          right={<Switch value={true} trackColor={{ true: colors.primary }} />}
          showBorder
        />
        <SettingRow
          icon="person-add-outline"
          label={t('settings_newLeads')}
          right={<Switch value={true} trackColor={{ true: colors.primary }} />}
          showBorder
        />
      </Card>

      {/* Language Section */}
      <Text style={styles.sectionHeader}>{t('settings_language')}</Text>
      <Card>
        {(['de', 'es', 'en'] as Locale[]).map((loc, index) => (
          <SettingRow
            key={loc}
            icon="language-outline"
            label={LOCALE_LABELS[loc]}
            showBorder={index > 0}
            right={
              locale === loc ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              ) : undefined
            }
            onPress={() => setLocale(loc)}
          />
        ))}
      </Card>

      {/* Über Euricio Section */}
      <Text style={styles.sectionHeader}>{t('settings_about')}</Text>
      <Card>
        <SettingRow
          icon="information-circle-outline"
          label={t('settings_appVersion')}
          value={appVersion}
        />
        <SettingRow
          icon="document-text-outline"
          label={t('settings_privacy')}
          showBorder
          showChevron
        />
        <SettingRow
          icon="shield-outline"
          label={t('settings_imprint')}
          showBorder
          showChevron
        />
      </Card>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <Button
          title={t('settings_logout')}
          onPress={handleSignOut}
          variant="danger"
          icon={<Ionicons name="log-out-outline" size={18} color={colors.white} />}
          size="lg"
        />
      </View>
    </ScrollView>
  );
}

function SettingRow({
  icon,
  label,
  value,
  right,
  showBorder,
  showChevron,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  right?: React.ReactNode;
  showBorder?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View
      style={[
        styles.settingRow,
        showBorder && styles.settingBorder,
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <Text style={styles.settingLabel}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {right}
      {showChevron && (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
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
  profileCard: {
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: spacing.md,
  },
  settingBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  settingLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  settingValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  logoutSection: {
    marginTop: spacing.xl,
  },
});
