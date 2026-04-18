import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useVoice } from '../voice/VoiceContext';
import { useI18n } from '../i18n';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../supabase';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

/**
 * Call choice hook — shows a bottom sheet letting the user pick
 * between native mobile call and Twilio business number.
 *
 * The Twilio option is always visible but GREYED OUT when the
 * Voice SDK is not initialized (isInitialized === false).
 * This way the original tel: behavior is never broken.
 */
export function useCallChoice() {
  const { makeCall, isInitialized } = useVoice();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [visible, setVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Check if user has a Twilio voice connection at all (DB check)
  const { data: voiceConnection } = useQuery({
    queryKey: ['voice-connection', user?.id],
    queryFn: async () => {
      // First try as owner
      let { data } = await supabase
        .from('voice_connections')
        .select('default_outbound_number, connect_status')
        .eq('owner_id', user!.id)
        .eq('connect_status', 'connected')
        .maybeSingle();

      // If not owner, check permissions
      if (!data) {
        const { data: perm } = await supabase
          .from('voice_user_permissions')
          .select('owner_id')
          .eq('user_id', user!.id)
          .eq('voice_enabled', true)
          .maybeSingle();

        if (perm) {
          const { data: ownerConn } = await supabase
            .from('voice_connections')
            .select('default_outbound_number, connect_status')
            .eq('owner_id', perm.owner_id)
            .eq('connect_status', 'connected')
            .maybeSingle();
          data = ownerConn;
        }
      }

      return data;
    },
    enabled: !!user,
  });

  const hasTwilioConfig = !!voiceConnection;
  const twilioReady = isInitialized;
  const outboundNumber = voiceConnection?.default_outbound_number ?? null;

  const promptCall = useCallback(
    (phone: string) => {
      if (!phone) return;
      // If no Twilio configured at all, just do native call (no dialog)
      if (!hasTwilioConfig) {
        Linking.openURL(`tel:${phone}`);
        return;
      }
      // Show choice dialog
      setPhoneNumber(phone);
      setVisible(true);
    },
    [hasTwilioConfig],
  );

  const handleMobile = useCallback(() => {
    setVisible(false);
    Linking.openURL(`tel:${phoneNumber}`);
  }, [phoneNumber]);

  const handleBusiness = useCallback(() => {
    if (!twilioReady) return; // safety — button is disabled
    setVisible(false);
    // Use makeCall from VoiceContext (unchanged, original behavior)
    makeCall(phoneNumber);
    router.push({ pathname: '/(app)/call/[id]', params: { id: phoneNumber } });
  }, [phoneNumber, makeCall, twilioReady, router]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const CallChoiceSheet = useCallback(
    () => (
      <CallChoiceModal
        visible={visible}
        phoneNumber={phoneNumber}
        outboundNumber={outboundNumber}
        twilioReady={twilioReady}
        onMobile={handleMobile}
        onBusiness={handleBusiness}
        onClose={handleClose}
      />
    ),
    [visible, phoneNumber, outboundNumber, twilioReady, handleMobile, handleBusiness, handleClose],
  );

  return { promptCall, CallChoiceSheet };
}

function CallChoiceModal({
  visible,
  phoneNumber,
  outboundNumber,
  twilioReady,
  onMobile,
  onBusiness,
  onClose,
}: {
  visible: boolean;
  phoneNumber: string;
  outboundNumber: string | null;
  twilioReady: boolean;
  onMobile: () => void;
  onBusiness: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Text style={styles.title}>
            {t('call_callTo', { phone: phoneNumber })}
          </Text>

          {/* Mobile option — always available */}
          <TouchableOpacity style={styles.option} onPress={onMobile} activeOpacity={0.7}>
            <View style={[styles.optionIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="phone-portrait-outline" size={22} color={colors.success} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{t('call_mobile')}</Text>
              <Text style={styles.optionDesc}>{t('call_mobileDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          {/* Business / Twilio option — greyed out when SDK not ready */}
          <TouchableOpacity
            style={[styles.option, !twilioReady && styles.optionDisabled]}
            onPress={onBusiness}
            activeOpacity={twilioReady ? 0.7 : 1}
            disabled={!twilioReady}
          >
            <View
              style={[
                styles.optionIcon,
                { backgroundColor: twilioReady ? colors.primary + '15' : colors.border + '30' },
              ]}
            >
              <Ionicons
                name="business-outline"
                size={22}
                color={twilioReady ? colors.primary : colors.textTertiary}
              />
            </View>
            <View style={styles.optionText}>
              <Text
                style={[
                  styles.optionTitle,
                  !twilioReady && { color: colors.textTertiary },
                ]}
              >
                {t('call_business')}
              </Text>
              <Text style={styles.optionDesc}>
                {twilioReady
                  ? `${t('call_businessDesc')}${outboundNumber ? ` · ${outboundNumber}` : ''}`
                  : t('call_businessUnavailable')}
              </Text>
            </View>
            {twilioReady ? (
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            ) : (
              <Ionicons name="lock-closed-outline" size={16} color={colors.textTertiary} />
            )}
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl + 20,
    paddingHorizontal: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  optionDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
});
