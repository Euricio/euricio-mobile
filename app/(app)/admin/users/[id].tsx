import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useUser, useUpdateUserRole } from '../../../../lib/api/admin-users';
import { Card } from '../../../../components/ui/Card';
import { Avatar } from '../../../../components/ui/Avatar';
import { Badge } from '../../../../components/ui/Badge';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { useI18n } from '../../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../../constants/theme';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'agent', label: 'Agent' },
  { value: 'viewer', label: 'Viewer' },
];

export default function UserDetailScreen() {
  const { t, formatDate } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: user, isLoading } = useUser(id!);
  const updateRole = useUpdateUserRole();

  const [selectedRole, setSelectedRole] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user && !loaded) {
      setSelectedRole(user.role || 'agent');
      setLoaded(true);
    }
  }, [user, loaded]);

  const handleSave = () => {
    if (!id) return;
    updateRole.mutate(
      { id, role: selectedRole },
      {
        onSuccess: () => {
          Alert.alert(t('adminUsers_saved'), t('adminUsers_roleSaved'));
        },
        onError: () => {
          Alert.alert(t('error'), t('adminUsers_saveError'));
        },
      },
    );
  };

  if (isLoading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: t('adminUsers_detail') }} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Profile card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar name={user.full_name || user.email || '?'} size={64} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.full_name || '—'}</Text>
              <Text style={styles.profileEmail}>{user.email || '—'}</Text>
              <View style={styles.profileBadges}>
                <Badge
                  label={user.role || 'agent'}
                  variant={user.role === 'admin' ? 'primary' : 'info'}
                />
                <Badge
                  label={user.is_active ? t('adminUsers_active') : t('adminUsers_inactive')}
                  variant={user.is_active ? 'success' : 'default'}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Role selector */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('adminUsers_roleSection')}</Text>
          <FormSelect
            label={t('adminUsers_role')}
            options={ROLE_OPTIONS}
            value={selectedRole}
            onChange={setSelectedRole}
          />
          <Button
            title={t('save')}
            onPress={handleSave}
            loading={updateRole.isPending}
            disabled={updateRole.isPending}
          />
        </Card>

        {/* Plan info */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('adminUsers_planSection')}</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('adminUsers_plan')}</Text>
            <Text style={styles.statValue}>{user.plan_id || '—'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('adminUsers_position')}</Text>
            <Text style={styles.statValue}>{user.position || '—'}</Text>
          </View>
        </Card>

        {/* Activity stats */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('adminUsers_activitySection')}</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('adminUsers_lastLogin')}</Text>
            <Text style={styles.statValue}>
              {user.last_sign_in_at
                ? formatDate(user.last_sign_in_at, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>{t('adminUsers_createdAt')}</Text>
            <Text style={styles.statValue}>
              {formatDate(user.created_at, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120 },
  profileCard: { marginBottom: spacing.md },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionCard: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
});
