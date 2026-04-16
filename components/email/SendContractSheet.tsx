import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { useI18n, LOCALE_LABELS } from '../../lib/i18n';
import type { Locale } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

interface SendContractSheetProps {
  visible: boolean;
  onClose: () => void;
  onSend: (email: string, language: Locale) => void;
  defaultEmail: string;
  loading: boolean;
}

export function SendContractSheet({
  visible,
  onClose,
  onSend,
  defaultEmail,
  loading,
}: SendContractSheetProps) {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState(defaultEmail);
  const [language, setLanguage] = useState<Locale>(locale);

  const handleSend = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    onSend(trimmed, language);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="mail-outline" size={22} color={colors.primary} />
            <Text style={styles.title}>{t('email_sendContract')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Recipient Email */}
          <Text style={styles.label}>{t('email_recipientEmail')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('email_recipientEmailPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Language Picker */}
          <Text style={styles.label}>{t('email_language')}</Text>
          <View style={styles.langRow}>
            {(['de', 'en', 'es'] as Locale[]).map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.langChip,
                  language === loc && styles.langChipActive,
                ]}
                onPress={() => setLanguage(loc)}
              >
                <Text
                  style={[
                    styles.langChipText,
                    language === loc && styles.langChipTextActive,
                  ]}
                >
                  {LOCALE_LABELS[loc]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Send Button */}
          <Button
            title={loading ? t('email_sending') : t('email_send')}
            onPress={handleSend}
            loading={loading}
            disabled={loading || !email.trim()}
            icon={
              !loading ? (
                <Ionicons name="send" size={16} color={colors.white} />
              ) : undefined
            }
            size="lg"
            style={styles.sendBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 20, // safe area
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.md,
    color: colors.text,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  langChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  langChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  langChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  langChipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  sendBtn: {
    marginTop: spacing.lg,
  },
});
