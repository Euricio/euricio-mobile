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
import { Stack, router } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '../../../../lib/auth/authContext';
import { useAuthStore } from '../../../../store/authStore';
import { useTeamSummary } from '../../../../lib/api/hr';
import { useEmailSettings } from '../../../../lib/api/email';
import { useVoicePermissions } from '../../../../lib/voice/useVoicePermissions';
import { useProfile } from '../../../../lib/api/profile';
import { useQuery } from '@tanstack/react-query';
import { fetchVoiceStatus } from '../../../../lib/voice/voiceApi';
import { Card } from '../../../../components/ui/Card';
import { Avatar } from '../../../../components/ui/Avatar';
import { Button } from '../../../../components/ui/Button';
import { useI18n, LOCALE_LABELS } from '../../../../lib/i18n';
import type { Locale } from '../../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../../constants/theme';

export default function MoreScreen() {
  const { signOut } = useAuth();
  const user = useAuthStore((s) => s.user);
  const { t, locale, setLocale } = useI18n();
  const { data: teamSummary } = useTeamSummary();
  const { data: emailSettings } = useEmailSettings();
  const { data: profile } = useProfile();
  const { data: voicePerms } = useVoicePermissions();
  const { data: voiceStatus } = useQuery({
    queryKey: ['voice-status'],
    queryFn: fetchVoiceStatus,
    enabled: !!voicePerms?.hasPermission,
    staleTime: 60_000,
  });

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
      <Stack.Screen
        options={{
          headerTitle: t('settings_title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

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

      {/* Sales Tools Section */}
      <Text style={styles.sectionHeader}>{t('pipeline_subtitle')}</Text>
      <Card
        onPress={() => router.push('/(app)/pipeline/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: colors.accent + '15' }]}>
            <Ionicons name="git-branch-outline" size={24} color={colors.accent} />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('pipeline_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('pipeline_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>
      <Card
        onPress={() => router.push('/(app)/calendar/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: '#bf5af2' + '15' }]}>
            <Ionicons name="calendar-outline" size={24} color="#bf5af2" />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('calendar_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('calendar_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>
      <Card
        onPress={() => router.push('/(app)/mortgage/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: colors.warning + '15' }]}>
            <Ionicons name="calculator-outline" size={24} color={colors.warning} />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('mortgage_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('mortgage_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>
      <Card
        onPress={() => router.push('/(app)/partners/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: '#30d158' + '15' }]}>
            <Ionicons name="people-circle-outline" size={24} color="#30d158" />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('partners_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('partners_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>

      {/* Messaging Section */}
      <Text style={styles.sectionHeader}>{t('more_messaging')}</Text>
      <Card
        onPress={() => router.push('/(app)/whatsapp/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: '#25D366' + '15' }]}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('whatsapp_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('whatsapp_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>
      <Card
        onPress={() => router.push('/(app)/telegram/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: '#0088cc' + '15' }]}>
            <Ionicons name="paper-plane-outline" size={24} color="#0088cc" />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('telegram_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('telegram_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>

      {/* Requests Section */}
      <Text style={styles.sectionHeader}>{t('more_requests')}</Text>
      <Card
        onPress={() => router.push('/(app)/valuations/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: colors.accent + '15' }]}>
            <Ionicons name="stats-chart-outline" size={24} color={colors.accent} />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('valuation_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('valuation_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>
      {(profile?.role === 'admin' || profile?.role === 'manager_agent' || profile?.role === 'anwalt') && (
        <>
          <Card
            onPress={() => router.push('/(app)/valuation-requests/')}
            style={styles.hrCard}
          >
            <View style={styles.hrRow}>
              <View style={[styles.hrIcon, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name="document-text-outline" size={24} color={colors.warning} />
              </View>
              <View style={styles.hrInfo}>
                <Text style={styles.hrTitle}>{t('valReq_title')}</Text>
                <Text style={styles.hrSubtitle}>{t('valReq_subtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
          <Card
            onPress={() => router.push('/(app)/search-requests/')}
            style={styles.hrCard}
          >
            <View style={styles.hrRow}>
              <View style={[styles.hrIcon, { backgroundColor: colors.info + '15' }]}>
                <Ionicons name="search-outline" size={24} color={colors.info} />
              </View>
              <View style={styles.hrInfo}>
                <Text style={styles.hrTitle}>{t('searchReq_title')}</Text>
                <Text style={styles.hrSubtitle}>{t('searchReq_subtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </>
      )}

      {/* Manager Section — role-gated */}
      {(profile?.role === 'admin' || profile?.role === 'manager_agent' || profile?.role === 'anwalt') && (
        <>
          <Text style={styles.sectionHeader}>{t('more_manager')}</Text>
          <Card
            onPress={() => router.push('/(app)/manager/shifts/')}
            style={styles.hrCard}
          >
            <View style={styles.hrRow}>
              <View style={[styles.hrIcon, { backgroundColor: '#6366F1' + '15' }]}>
                <Ionicons name="calendar-outline" size={24} color="#6366F1" />
              </View>
              <View style={styles.hrInfo}>
                <Text style={styles.hrTitle}>{t('shifts_title')}</Text>
                <Text style={styles.hrSubtitle}>{t('shifts_subtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
          <Card
            onPress={() => router.push('/(app)/manager/timecheck/')}
            style={styles.hrCard}
          >
            <View style={styles.hrRow}>
              <View style={[styles.hrIcon, { backgroundColor: '#F59E0B' + '15' }]}>
                <Ionicons name="timer-outline" size={24} color="#F59E0B" />
              </View>
              <View style={styles.hrInfo}>
                <Text style={styles.hrTitle}>{t('timecheck_title')}</Text>
                <Text style={styles.hrSubtitle}>{t('timecheck_subtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
          <Card
            onPress={() => router.push('/(app)/manager/development/')}
            style={styles.hrCard}
          >
            <View style={styles.hrRow}>
              <View style={[styles.hrIcon, { backgroundColor: '#10B981' + '15' }]}>
                <Ionicons name="trending-up-outline" size={24} color="#10B981" />
              </View>
              <View style={styles.hrInfo}>
                <Text style={styles.hrTitle}>{t('dev_title')}</Text>
                <Text style={styles.hrSubtitle}>{t('dev_subtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
          <Card
            onPress={() => router.push('/(app)/hr/recruitment/')}
            style={styles.hrCard}
          >
            <View style={styles.hrRow}>
              <View style={[styles.hrIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
                <Ionicons name="person-add-outline" size={24} color="#8B5CF6" />
              </View>
              <View style={styles.hrInfo}>
                <Text style={styles.hrTitle}>{t('recruit_title')}</Text>
                <Text style={styles.hrSubtitle}>{t('recruit_subtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </>
      )}

      {/* Admin Section — admin only */}
      {profile?.role === 'admin' && (
        <>
          <Text style={styles.sectionHeader}>{t('more_admin')}</Text>
          <Card
            onPress={() => router.push('/(app)/admin/team/')}
            style={styles.hrCard}
          >
            <View style={styles.hrRow}>
              <View style={[styles.hrIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="people-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.hrInfo}>
                <Text style={styles.hrTitle}>{t('adminTeam_title')}</Text>
                <Text style={styles.hrSubtitle}>{t('adminTeam_subtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
          {profile?.is_internal && (
            <Card
              onPress={() => router.push('/(app)/admin/users/')}
              style={styles.hrCard}
            >
              <View style={styles.hrRow}>
                <View style={[styles.hrIcon, { backgroundColor: '#8B5CF6' + '15' }]}>
                  <Ionicons name="shield-outline" size={24} color="#8B5CF6" />
                </View>
                <View style={styles.hrInfo}>
                  <Text style={styles.hrTitle}>{t('adminUsers_title')}</Text>
                  <Text style={styles.hrSubtitle}>{t('adminUsers_subtitle')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
            </Card>
          )}
          <Card
            onPress={() => router.push('/(app)/admin/categories/')}
            style={styles.hrCard}
          >
            <View style={styles.hrRow}>
              <View style={[styles.hrIcon, { backgroundColor: '#F59E0B' + '15' }]}>
                <Ionicons name="pricetags-outline" size={24} color="#F59E0B" />
              </View>
              <View style={styles.hrInfo}>
                <Text style={styles.hrTitle}>{t('categories_title')}</Text>
                <Text style={styles.hrSubtitle}>{t('categories_subtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
          {profile?.is_internal && (
            <Card
              onPress={() => router.push('/(app)/admin/features/')}
              style={styles.hrCard}
            >
              <View style={styles.hrRow}>
                <View style={[styles.hrIcon, { backgroundColor: '#6366F1' + '15' }]}>
                  <Ionicons name="toggle-outline" size={24} color="#6366F1" />
                </View>
                <View style={styles.hrInfo}>
                  <Text style={styles.hrTitle}>{t('featureFlags_title')}</Text>
                  <Text style={styles.hrSubtitle}>{t('featureFlags_subtitle')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
            </Card>
          )}
          <Card
            onPress={() => router.push('/(app)/admin/integrations/')}
            style={styles.hrCard}
          >
            <View style={styles.hrRow}>
              <View style={[styles.hrIcon, { backgroundColor: '#14B8A6' + '15' }]}>
                <Ionicons name="code-slash-outline" size={24} color="#14B8A6" />
              </View>
              <View style={styles.hrInfo}>
                <Text style={styles.hrTitle}>{t('integrations_title')}</Text>
                <Text style={styles.hrSubtitle}>{t('integrations_subtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        </>
      )}

      {/* Settings Section — all users, some admin-gated */}
      <Text style={styles.sectionHeader}>{t('more_settings')}</Text>
      <Card
        onPress={() => router.push('/(app)/settings/subscription/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: '#10B981' + '15' }]}>
            <Ionicons name="card-outline" size={24} color="#10B981" />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('subscription_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('subscription_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>
      <Card
        onPress={() => router.push('/(app)/settings/account/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('account_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('account_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>
      <Card
        onPress={() => router.push('/(app)/notifications/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: '#F59E0B' + '15' }]}>
            <Ionicons name="notifications-outline" size={24} color="#F59E0B" />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('notifications_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('notifications_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>
      <Card
        onPress={() => router.push('/(app)/settings/upgrades/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: colors.accent + '15' }]}>
            <Ionicons name="diamond-outline" size={24} color={colors.accent} />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('upgrades_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('upgrades_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>
      {profile?.role === 'admin' && (
        <Card
          onPress={() => router.push('/(app)/settings/sms/')}
          style={styles.hrCard}
        >
          <View style={styles.hrRow}>
            <View style={[styles.hrIcon, { backgroundColor: '#EC4899' + '15' }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#EC4899" />
            </View>
            <View style={styles.hrInfo}>
              <Text style={styles.hrTitle}>{t('sms_title')}</Text>
              <Text style={styles.hrSubtitle}>{t('sms_subtitle')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </Card>
      )}
      <Card
        onPress={() => router.push('/(app)/feedback/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: '#3B82F6' + '15' }]}>
            <Ionicons name="chatbox-ellipses-outline" size={24} color="#3B82F6" />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('feedback_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('feedback_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>

      {/* Berichte Section — all users */}
      <Text style={styles.sectionHeader}>{t('more_reports')}</Text>
      <Card
        onPress={() => router.push('/(app)/reports/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: '#6366F1' + '15' }]}>
            <Ionicons name="bar-chart-outline" size={24} color="#6366F1" />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('reports_title')}</Text>
            <Text style={styles.hrSubtitle}>{t('reports_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>

      {/* Personal / HR Section */}
      <Text style={styles.sectionHeader}>{t('hr_personal')}</Text>
      <Card
        onPress={() => router.push('/(app)/hr/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="people-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('hr_personal')}</Text>
            <Text style={styles.hrSubtitle}>
              {teamSummary
                ? t('hr_teamMembers', { count: String(teamSummary.teamSize) })
                : t('hr_myDay')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>

      {/* Telefonie Section */}
      <Text style={styles.sectionHeader}>{t('settings_telephony')}</Text>
      <Card
        onPress={() => router.push('/(app)/voice/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="call-outline" size={24} color={colors.success} />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('settings_telephony')}</Text>
            <Text style={styles.hrSubtitle}>
              {voiceStatus?.connected
                ? t('voice_connected')
                : t('voice_disconnected')}
            </Text>
          </View>
          <View style={[
            styles.statusDot,
            { backgroundColor: voiceStatus?.connected ? colors.success : colors.textTertiary },
          ]} />
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>

      {/* E-Mail Section */}
      <Text style={styles.sectionHeader}>{t('email_title')}</Text>
      <Card
        onPress={() => router.push('/(app)/email/')}
        style={styles.hrCard}
      >
        <View style={styles.hrRow}>
          <View style={[styles.hrIcon, { backgroundColor: colors.info + '15' }]}>
            <Ionicons name="mail-outline" size={24} color={colors.info} />
          </View>
          <View style={styles.hrInfo}>
            <Text style={styles.hrTitle}>{t('email_settings')}</Text>
            <Text style={styles.hrSubtitle}>
              {emailSettings?.smtp_host
                ? t('email_configured')
                : t('email_notConfigured')}
            </Text>
          </View>
          <View style={[
            styles.statusDot,
            { backgroundColor: emailSettings?.smtp_host ? colors.success : colors.textTertiary },
          ]} />
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
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
  hrCard: {
    marginBottom: spacing.sm,
  },
  hrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hrIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hrInfo: {
    flex: 1,
  },
  hrTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  hrSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
});
