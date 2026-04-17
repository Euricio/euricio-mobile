import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import { FormInput } from '../../../../components/ui/FormInput';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { useI18n } from '../../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
} from '../../../../constants/theme';

export default function AccountSettingsScreen() {
  const { t } = useI18n();

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangeEmail = async () => {
    if (!emailPassword.trim()) {
      Alert.alert(t('error'), t('account_passwordRequired'));
      return;
    }
    if (!newEmail.trim()) return;

    setEmailLoading(true);
    try {
      // Re-authenticate with current password first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: emailPassword,
      });
      if (signInError) throw signInError;

      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      Alert.alert(t('account_changeEmail'), t('account_emailChanged'));
      setNewEmail('');
      setEmailPassword('');
    } catch {
      Alert.alert(t('error'), t('account_emailError'));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert(t('error'), t('account_passwordRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), t('account_passwordMismatch'));
      return;
    }
    if (!newPassword.trim()) return;

    setPasswordLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw signInError;

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Alert.alert(t('account_changePassword'), t('account_passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      Alert.alert(t('error'), t('account_passwordError'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerTitle: t('account_title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(app)/(tabs)/more');
                }
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ paddingRight: 8 }}
            >
              <Ionicons name="chevron-back" size={26} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Change Email */}
        <Text style={styles.sectionTitle}>{t('account_changeEmail')}</Text>
        <Card style={styles.card}>
          <FormInput
            label={t('account_newEmail')}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder={t('account_newEmailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <FormInput
            label={t('account_currentPassword')}
            value={emailPassword}
            onChangeText={setEmailPassword}
            placeholder={t('account_currentPasswordPlaceholder')}
            secureTextEntry
          />
          <Button
            title={t('account_changeEmail')}
            onPress={handleChangeEmail}
            loading={emailLoading}
            disabled={emailLoading || !newEmail.trim() || !emailPassword.trim()}
          />
        </Card>

        {/* Change Password */}
        <Text style={styles.sectionTitle}>{t('account_changePassword')}</Text>
        <Card style={styles.card}>
          <FormInput
            label={t('account_currentPassword')}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder={t('account_currentPasswordPlaceholder')}
            secureTextEntry
          />
          <FormInput
            label={t('account_newPassword')}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder={t('account_newPasswordPlaceholder')}
            secureTextEntry
          />
          <FormInput
            label={t('account_confirmPassword')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder={t('account_confirmPasswordPlaceholder')}
            secureTextEntry
          />
          <Button
            title={t('account_changePassword')}
            onPress={handleChangePassword}
            loading={passwordLoading}
            disabled={passwordLoading || !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120 },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: { marginBottom: spacing.md },
});
