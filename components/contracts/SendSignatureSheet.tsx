import React, { useEffect, useMemo, useState } from 'react';
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
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { useI18n } from '../../lib/i18n';
import {
  ContractSigner,
  SignatureChannel,
  lookupPortalCustomer,
} from '../../lib/api/email';
import { supabase } from '../../lib/supabase';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'registered'; customerId?: string }
  | { status: 'not_registered' }
  | { status: 'error' };

interface SendSignatureSheetProps {
  visible: boolean;
  onClose: () => void;
  signers: ContractSigner[];
  propertyId: string | number | null;
  smtpConfigured: boolean;
  loading: boolean;
  onSend: (
    selections: { signerId: string; channel: SignatureChannel }[],
  ) => void;
  /** Notifies the parent that signer rows changed (email edits) so it can refetch. */
  onSignersChanged?: () => void;
}

export function SendSignatureSheet({
  visible,
  onClose,
  signers,
  propertyId,
  smtpConfigured,
  loading,
  onSend,
  onSignersChanged,
}: SendSignatureSheetProps) {
  const { t } = useI18n();

  // Local mirror of signer emails so we can edit before persisting.
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [channels, setChannels] = useState<Record<string, SignatureChannel>>({});
  const [lookups, setLookups] = useState<Record<string, LookupState>>({});
  const [savingEmail, setSavingEmail] = useState<Record<string, boolean>>({});

  // Reset state whenever the sheet (re-)opens with fresh signers.
  useEffect(() => {
    if (!visible) return;
    const nextEmails: Record<string, string> = {};
    const nextChannels: Record<string, SignatureChannel> = {};
    for (const s of signers) {
      nextEmails[s.id] = s.email || '';
      nextChannels[s.id] = 'email';
    }
    setEmails(nextEmails);
    setChannels(nextChannels);
    setLookups({});
  }, [visible, signers]);

  const clientSigners = useMemo(
    () => signers.filter((s) => s.role !== 'agency'),
    [signers],
  );

  // Run portal lookup for each client signer with email + propertyId.
  // Agency signers are intentionally excluded — they never use the customer portal.
  // Debounced 350ms so we don't fire a request on every keystroke while the
  // broker is still typing the email.
  useEffect(() => {
    if (!visible) return;
    if (!propertyId) {
      setLookups({});
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      for (const signer of clientSigners) {
        const email = (emails[signer.id] || '').trim();
        if (!email) {
          setLookups((prev) => {
            if (!prev[signer.id]) return prev;
            const next = { ...prev };
            delete next[signer.id];
            return next;
          });
          continue;
        }
        setLookups((prev) => ({ ...prev, [signer.id]: { status: 'loading' } }));
        lookupPortalCustomer(email, propertyId)
          .then((data) => {
            if (cancelled) return;
            if (data.exists) {
              setLookups((prev) => ({
                ...prev,
                [signer.id]: { status: 'registered', customerId: data.customer_id },
              }));
            } else {
              setLookups((prev) => ({
                ...prev,
                [signer.id]: { status: 'not_registered' },
              }));
              // If portal had been chosen but customer isn't registered, fall back to email.
              setChannels((prev) =>
                prev[signer.id] === 'portal'
                  ? { ...prev, [signer.id]: 'email' }
                  : prev,
              );
            }
          })
          .catch(() => {
            if (cancelled) return;
            setLookups((prev) => ({
              ...prev,
              [signer.id]: { status: 'error' },
            }));
            setChannels((prev) =>
              prev[signer.id] === 'portal'
                ? { ...prev, [signer.id]: 'email' }
                : prev,
            );
          });
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [visible, propertyId, clientSigners, emails]);

  async function persistEmail(signerId: string, email: string) {
    const trimmed = email.trim();
    if (!trimmed) return;
    setSavingEmail((p) => ({ ...p, [signerId]: true }));
    const { error } = await supabase
      .from('contract_signers')
      .update({ email: trimmed })
      .eq('id', signerId);
    setSavingEmail((p) => ({ ...p, [signerId]: false }));
    if (!error) {
      onSignersChanged?.();
    }
  }

  function eligibleSelections() {
    const out: { signerId: string; channel: SignatureChannel }[] = [];
    for (const s of signers) {
      const email = (emails[s.id] || '').trim();
      if (!email) continue;
      const channel = channels[s.id] || 'email';
      // Agency signers always use email (they have no portal account).
      const safeChannel: SignatureChannel =
        s.role === 'agency' ? 'email' : channel;
      out.push({ signerId: s.id, channel: safeChannel });
    }
    return out;
  }

  const selections = eligibleSelections();
  const canSend = selections.length > 0 && smtpConfigured;

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
          <View style={styles.handle} />

          <View style={styles.header}>
            <Ionicons name="create-outline" size={22} color={colors.primary} />
            <Text style={styles.title}>{t('email_sendSignature')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {!smtpConfigured && (
            <View style={styles.warningBox}>
              <Ionicons
                name="warning-outline"
                size={16}
                color={colors.warning}
              />
              <Text style={styles.warningText}>
                {t('email_smtpNotConfigured')}
              </Text>
            </View>
          )}

          <ScrollView
            style={styles.signerList}
            contentContainerStyle={styles.signerListContent}
            keyboardShouldPersistTaps="handled"
          >
            {signers.length === 0 && (
              <Text style={styles.emptyText}>
                {t('signature_noSigners')}
              </Text>
            )}

            {signers.map((signer) => {
              const isAgency = signer.role === 'agency';
              const email = emails[signer.id] || '';
              const channel = channels[signer.id] || 'email';
              const lookup: LookupState = lookups[signer.id] || {
                status: 'idle',
              };
              const portalAvailable =
                !isAgency && lookup.status === 'registered';
              const showPortalNotRegistered =
                !isAgency &&
                !!email.trim() &&
                lookup.status === 'not_registered';

              return (
                <View key={signer.id} style={styles.signerCard}>
                  <View style={styles.signerHeader}>
                    <Ionicons
                      name={isAgency ? 'briefcase-outline' : 'person-outline'}
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.signerLabel}>
                      {signer.role_label || signer.role}
                    </Text>
                    {signer.status === 'sent' && (
                      <Text style={styles.signerStatusSent}>
                        {t('signature_statusSent')}
                      </Text>
                    )}
                    {signer.status === 'signed' && (
                      <Text style={styles.signerStatusSigned}>
                        {t('signature_statusSigned')}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.signerName}>
                    {signer.name || '—'}
                  </Text>

                  <Text style={styles.fieldLabel}>
                    {t('email_recipientEmail')}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(v) =>
                      setEmails((p) => ({ ...p, [signer.id]: v }))
                    }
                    onBlur={() => persistEmail(signer.id, email)}
                    placeholder={t('email_recipientEmailPlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={signer.status !== 'signed'}
                  />
                  {savingEmail[signer.id] && (
                    <Text style={styles.hintText}>
                      {t('signature_savingEmail')}
                    </Text>
                  )}

                  {!isAgency && (
                    <>
                      <Text style={styles.fieldLabel}>
                        {t('signature_channel')}
                      </Text>
                      <View style={styles.channelRow}>
                        <TouchableOpacity
                          style={[
                            styles.channelChip,
                            channel === 'email' && styles.channelChipActive,
                          ]}
                          onPress={() =>
                            setChannels((p) => ({
                              ...p,
                              [signer.id]: 'email',
                            }))
                          }
                        >
                          <Ionicons
                            name="mail-outline"
                            size={14}
                            color={
                              channel === 'email'
                                ? colors.primary
                                : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.channelChipText,
                              channel === 'email' &&
                                styles.channelChipTextActive,
                            ]}
                          >
                            {t('signature_channelEmail')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={!portalAvailable}
                          style={[
                            styles.channelChip,
                            channel === 'portal' && styles.channelChipActive,
                            !portalAvailable && styles.channelChipDisabled,
                          ]}
                          onPress={() =>
                            setChannels((p) => ({
                              ...p,
                              [signer.id]: 'portal',
                            }))
                          }
                        >
                          <Ionicons
                            name="phone-portrait-outline"
                            size={14}
                            color={
                              !portalAvailable
                                ? colors.textTertiary
                                : channel === 'portal'
                                  ? colors.primary
                                  : colors.textSecondary
                            }
                          />
                          <Text
                            style={[
                              styles.channelChipText,
                              channel === 'portal' &&
                                styles.channelChipTextActive,
                              !portalAvailable && styles.channelChipTextDisabled,
                            ]}
                          >
                            {t('signature_channelPortal')}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {lookup.status === 'loading' && (
                        <View style={styles.lookupRow}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={styles.hintText}>
                            {t('signature_portalChecking')}
                          </Text>
                        </View>
                      )}
                      {showPortalNotRegistered && (
                        <Text style={styles.hintTextWarn}>
                          {t('signature_portalNotRegistered')}
                        </Text>
                      )}
                      {lookup.status === 'registered' && (
                        <Text style={styles.hintTextOk}>
                          {t('signature_portalRegistered')}
                        </Text>
                      )}
                      {lookup.status === 'error' && (
                        <Text style={styles.hintTextWarn}>
                          {t('signature_portalLookupError')}
                        </Text>
                      )}
                      {!propertyId && (
                        <Text style={styles.hintText}>
                          {t('signature_portalNoProperty')}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <Button
            title={loading ? t('email_sending') : t('email_send')}
            onPress={() => onSend(selections)}
            loading={loading}
            disabled={loading || !canSend}
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
    paddingBottom: spacing.xl + 20,
    maxHeight: '88%',
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
    marginBottom: spacing.md,
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.warning,
  },
  signerList: {
    flexGrow: 0,
  },
  signerListContent: {
    paddingBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  signerCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  signerLabel: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  signerStatusSent: {
    fontSize: fontSize.xs,
    color: colors.info,
    fontWeight: fontWeight.medium,
  },
  signerStatusSigned: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: fontWeight.medium,
  },
  signerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  channelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  channelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  channelChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  channelChipDisabled: {
    opacity: 0.5,
  },
  channelChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  channelChipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  channelChipTextDisabled: {
    color: colors.textTertiary,
  },
  lookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  hintText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  hintTextOk: {
    fontSize: fontSize.xs,
    color: colors.success,
    marginTop: 4,
  },
  hintTextWarn: {
    fontSize: fontSize.xs,
    color: colors.warning,
    marginTop: 4,
  },
  sendBtn: {
    marginTop: spacing.md,
  },
});
