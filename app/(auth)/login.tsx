import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth/authContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../lib/i18n';
import { colors, spacing, fontSize, fontWeight, shadow } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t('login_errorEmpty'));
      return;
    }

    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(app)/(tabs)/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('login_errorUnknown');
      if (message.includes('Invalid login credentials')) {
        setError(t('login_errorCredentials'));
      } else if (message.includes('fetch') || message.includes('network')) {
        setError(t('login_errorNetwork'));
      } else {
        setError(t('login_errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>EURICIO</Text>
          </View>
          <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>{t('login_welcome')}</Text>
          <Text style={styles.welcomeSubtitle}>
            {t('login_welcomeSubtitle')}
          </Text>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label={t('login_email')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            placeholder={t('login_emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            icon={
              <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
            }
          />

          <Input
            label={t('login_password')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            placeholder={t('login_passwordPlaceholder')}
            secureTextEntry
            autoComplete="password"
            icon={
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textTertiary}
              />
            }
          />

          <Button
            title={loading ? t('login_loading') : t('login_button')}
            onPress={handleLogin}
            loading={loading}
            disabled={!email.trim() || !password.trim()}
            size="lg"
            style={styles.loginButton}
          />
        </View>

        <Text style={styles.footer}>Euricio Real Estate Group S.L.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    ...shadow.lg,
  },
  logo: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    ...shadow.md,
  },
  welcomeTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    flex: 1,
  },
  loginButton: {
    marginTop: spacing.md,
  },
  footer: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    marginTop: spacing.xl,
  },
});
