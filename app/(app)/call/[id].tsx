import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useVoice } from '../../../lib/voice/VoiceContext';
import { useI18n } from '../../../lib/i18n';
import { useCallerContext } from '../../../lib/api/callerContext';
import { CallerContextCard } from '../../../components/voice/CallerContextCard';
import { QuickActions } from '../../../components/call/QuickActions';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

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
    error,
    callDuration,
    isMuted,
    isOnHold,
    incomingCall,
    hangUp,
    toggleMute,
    toggleHold,
  } = useVoice();

  // Source of the phone number: live voice context wins, URL param is fallback
  const phone = useMemo(() => {
    if (incomingCall?.from) return incomingCall.from;
    if (id && /^[+\d]/.test(String(id))) return String(id);
    return null;
  }, [incomingCall?.from, id]);

  const { data: ctx, isLoading: ctxLoading } = useCallerContext(phone);
  const match = ctx?.matches?.[0] ?? null;

  const displayName = match?.name || (phone ? phone : t('call_title'));

  const isConnected = status === 'connected';

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
      case 'error':
        return error || 'Error';
      default:
        return t('call_connecting');
    }
  })();

  // Auto-return from call screen on disconnect/error
  React.useEffect(() => {
    if (status === 'error' || status === 'disconnected') {
      const to = setTimeout(() => router.back(), 2500);
      return () => clearTimeout(to);
    }
  }, [status]);

  return (
    <View style={styles.container}>
      {/* Header — name + status */}
      <View style={styles.header}>
        <Text style={styles.callerName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.status}>{statusLabel}</Text>
      </View>

      {/* Middle — caller context */}
      <ScrollView
        style={styles.middle}
        contentContainerStyle={styles.middleContent}
        showsVerticalScrollIndicator={false}
      >
        {ctxLoading && !match && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.white} />
          </View>
        )}

        {match && (
          <View style={styles.cardWrap}>
            <CallerContextCard match={match} compact />
          </View>
        )}

        {isConnected && match && (
          <View style={styles.actionsWrap}>
            <Text style={styles.sectionLabel}>{t('call_ws_title')}</Text>
            <QuickActions
              entity_type={match.entity_type}
              entity_id={match.entity_id}
              entityName={match.name}
              variant="dark"
            />
          </View>
        )}

        {!match && !ctxLoading && phone && (
          <View style={styles.unknownBox}>
            <Ionicons name="help-circle-outline" size={28} color="rgba(255,255,255,0.8)" />
            <Text style={styles.unknownText}>{t('caller_unknown')}</Text>
            <Text style={styles.unknownPhone}>{phone}</Text>
          </View>
        )}
      </ScrollView>

      {/* Controls + hangup */}
      <View style={styles.footer}>
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
          <ControlButton icon="keypad-outline" label="DTMF" onPress={() => {}} />
        </View>

        <TouchableOpacity
          style={styles.hangupButton}
          onPress={async () => {
            await hangUp();
            router.back();
          }}
        >
          <Ionicons
            name="call"
            size={32}
            color={colors.white}
            style={{ transform: [{ rotate: '135deg' }] }}
          />
        </TouchableOpacity>
      </View>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  callerName: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  status: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  middle: {
    flex: 1,
  },
  middleContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  cardWrap: {
    // The CallerContextCard is light-on-white; pad against the dark bg
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  actionsWrap: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.xs,
  },
  unknownBox: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  unknownText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  unknownPhone: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize.sm,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.md,
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
