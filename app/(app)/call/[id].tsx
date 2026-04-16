import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVoice } from '../../../lib/voice/VoiceContext';
import { useI18n } from '../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const {
    status,
    callDuration,
    isMuted,
    isOnHold,
    hangUp,
    toggleMute,
    toggleHold,
    sendDigits,
  } = useVoice();

  const isConnected = status === 'connected';
  const isActive = status === 'connected' || status === 'connecting' || status === 'ringing';

  const statusLabel = (() => {
    switch (status) {
      case 'connecting':
        return t('call_connecting');
      case 'ringing':
        return t('voice_ringing');
      case 'connected':
        return formatDuration(callDuration);
      case 'disconnected':
        return t('voice_callEnded');
      default:
        return t('call_connecting');
    }
  })();

  return (
    <View style={styles.container}>
      {/* Call Info */}
      <View style={styles.header}>
        <Text style={styles.callerName}>{id || t('call_title')}</Text>
        <Text style={styles.status}>{statusLabel}</Text>
      </View>

      {/* Call Controls */}
      <View style={styles.controls}>
        <ControlButton
          icon={isMuted ? 'mic-off' : 'mic-off-outline'}
          label={t('call_mute')}
          active={isMuted}
          onPress={toggleMute}
        />
        <ControlButton
          icon="pause-outline"
          label={t('call_hold')}
          active={isOnHold}
          onPress={toggleHold}
        />
        <ControlButton
          icon="keypad-outline"
          label="DTMF"
          onPress={() => {}}
        />
      </View>

      {/* Hangup */}
      <TouchableOpacity
        style={styles.hangupButton}
        onPress={async () => {
          await hangUp();
          router.back();
        }}
      >
        <Ionicons name="call" size={32} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
      </TouchableOpacity>
    </View>
  );
}

function ControlButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.controlButton} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.controlIconBg, active && styles.controlIconActive]}>
        <Ionicons name={icon} size={24} color={active ? colors.primary : colors.white} />
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  header: {
    alignItems: 'center',
  },
  callerName: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  status: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    gap: 32,
  },
  controlButton: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  controlIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIconActive: {
    backgroundColor: colors.white,
  },
  controlLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  hangupButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
