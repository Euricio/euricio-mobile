import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useCreateTeamMember } from '../../../../lib/api/admin-team';
import { useI18n } from '../../../../lib/i18n';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { colors, spacing } from '../../../../constants/theme';

export default function CreateTeamMemberScreen() {
  const { t } = useI18n();
  const createMember = useCreateTeamMember();

  const roleOptions = [
    { value: 'admin', label: t('adminTeam_role_admin') },
    { value: 'manager_agent', label: t('adminTeam_role_manager_agent') },
    { value: 'anwalt', label: t('adminTeam_role_anwalt') },
    { value: 'agent', label: t('adminTeam_role_agent') },
  ];

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      newErrors.fullName = t('adminTeam_nameRequired');
    }
    if (!email.trim()) {
      newErrors.email = t('adminTeam_emailRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const password = Math.random().toString(36).slice(-10);

    const payload: Record<string, unknown> = {
      full_name: fullName.trim(),
      email: email.trim(),
      is_active: true,
    };
    if (role) payload.role = role;
    if (position.trim()) payload.position = position.trim();
    if (phone.trim()) payload.phone = phone.trim();

    createMember.mutate(payload as any, {
      onSuccess: () => {
        Alert.alert(
          t('adminTeam_created'),
          `${t('adminTeam_generatedPassword')}: ${password}`,
          [
            {
              text: t('ok'),
              onPress: () => router.back(),
            },
          ],
        );
      },
      onError: () => {
        Alert.alert(t('error'), t('adminTeam_createError'));
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerTitle: t('adminTeam_new'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <FormInput
          label={t('adminTeam_name')}
          required
          value={fullName}
          onChangeText={setFullName}
          placeholder={t('adminTeam_namePlaceholder')}
          error={errors.fullName}
          autoCapitalize="words"
        />
        <FormInput
          label={t('adminTeam_email')}
          required
          value={email}
          onChangeText={setEmail}
          placeholder={t('adminTeam_emailPlaceholder')}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
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
        <FormInput
          label={t('adminTeam_phone')}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('adminTeam_phonePlaceholder')}
          keyboardType="phone-pad"
        />

        <View style={styles.buttonContainer}>
          <Button
            title={t('adminTeam_create')}
            onPress={handleSubmit}
            loading={createMember.isPending}
            disabled={createMember.isPending}
          />
          <Button
            title={t('cancel')}
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
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
  buttonContainer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
