import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useTeamMember,
  useUpdateTeamMember,
  useToggleTeamMember,
} from '../../../../lib/api/admin-team';
import { useI18n } from '../../../../lib/i18n';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';

export default function TeamMemberDetailScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: member, isLoading } = useTeamMember(id!);
  const updateMember = useUpdateTeamMember();
  const toggleMember = useToggleTeamMember();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [position, setPosition] = useState('');
  const [language, setLanguage] = useState('');

  useEffect(() => {
    if (member) {
      setFullName(member.full_name ?? '');
      setEmail(member.email ?? '');
      setPhone(member.phone ?? '');
      setRole(member.role ?? '');
      setPosition(member.position ?? '');
      setLanguage(member.language ?? '');
    }
  }, [member]);

  const roleOptions = [
    { value: 'admin', label: t('adminTeam_role_admin') },
    { value: 'manager_agent', label: t('adminTeam_role_manager_agent') },
    { value: 'anwalt', label: t('adminTeam_role_anwalt') },
    { value: 'agent', label: t('adminTeam_role_agent') },
  ];

  const langOptions = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
  ];

  const handleSave = () => {
    if (!id) return;

    updateMember.mutate(
      {
        id,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        role: role || null,
        position: position.trim() || null,
        language: language || null,
      },
      {
        onSuccess: () => {
          Alert.alert(t('success'), t('adminTeam_saved'));
        },
        onError: () => {
          Alert.alert(t('error'), t('adminTeam_saveError'));
        },
      },
    );
  };

  const handleToggle = () => {
    if (!member || !id) return;
    const newActive = !member.is_active;

    Alert.alert(
      newActive ? t('adminTeam_activate') : t('adminTeam_deactivate'),
      newActive
        ? t('adminTeam_activateConfirm')
        : t('adminTeam_deactivateConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: () => {
            toggleMember.mutate(
              { id, is_active: newActive },
              {
                onError: () => {
                  Alert.alert(t('error'), t('adminTeam_toggleError'));
                },
              },
            );
          },
        },
      ],
    );
  };

  const handleResetPassword = () => {
    Alert.alert(
      t('adminTeam_resetPassword'),
      t('adminTeam_resetPasswordConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          onPress: () => {
            const generated = Math.random().toString(36).slice(-10);
            Alert.alert(
              t('adminTeam_newPassword'),
              generated,
            );
          },
        },
      ],
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!member) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerTitle: 'Team', headerShown: true }} />
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{t('adminTeam_notFound')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerTitle: member.full_name || 'Team',
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Editable Fields */}
        <Text style={styles.sectionHeader}>{t('adminTeam_details')}</Text>

        <FormInput
          label={t('adminTeam_name')}
          value={fullName}
          onChangeText={setFullName}
          placeholder={t('adminTeam_namePlaceholder')}
          autoCapitalize="words"
        />
        <FormInput
          label={t('adminTeam_email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('adminTeam_emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormInput
          label={t('adminTeam_phone')}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('adminTeam_phonePlaceholder')}
          keyboardType="phone-pad"
        />
        <FormSelect
          label={t('adminTeam_role')}
          options={roleOptions}
          value={role}
          onChange={setRole}
          placeholder={t('adminTeam_rolePlaceholder')}
        />
        <FormInput
          label={t('adminTeam_position')}
          value={position}
          onChangeText={setPosition}
          placeholder={t('adminTeam_positionPlaceholder')}
        />
        <FormSelect
          label={t('adminTeam_language')}
          options={langOptions}
          value={language}
          onChange={setLanguage}
          placeholder={t('adminTeam_languagePlaceholder')}
        />

        {/* Save */}
        <View style={styles.buttonContainer}>
          <Button
            title={t('save')}
            onPress={handleSave}
            loading={updateMember.isPending}
            disabled={updateMember.isPending}
          />
        </View>

        {/* Status toggle */}
        <Text style={styles.sectionHeader}>{t('adminTeam_status')}</Text>

        <View style={styles.buttonContainer}>
          <Button
            title={
              member.is_active
                ? t('adminTeam_deactivate')
                : t('adminTeam_activate')
            }
            variant={member.is_active ? 'danger' : 'primary'}
            onPress={handleToggle}
            loading={toggleMember.isPending}
            disabled={toggleMember.isPending}
          />
        </View>

        {/* Reset Password */}
        <Text style={styles.sectionHeader}>{t('adminTeam_security')}</Text>

        <View style={styles.buttonContainer}>
          <Button
            title={t('adminTeam_resetPassword')}
            variant="outline"
            onPress={handleResetPassword}
          />
        </View>

        {/* Documents */}
        <Text style={styles.sectionHeader}>{t('adminTeam_documents')}</Text>

        <Card>
          <View style={styles.documentsPlaceholder}>
            <Ionicons
              name="document-text-outline"
              size={32}
              color={colors.textTertiary}
            />
            <Text style={styles.documentsPlaceholderText}>
              {t('adminTeam_noDocuments')}
            </Text>
          </View>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.error,
    marginTop: spacing.md,
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
  buttonContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  documentsPlaceholder: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  documentsPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
});
