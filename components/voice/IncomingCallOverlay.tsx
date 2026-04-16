import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoice } from '../../lib/voice/VoiceContext';
import { lookupCaller, CallerMatch } from '../../lib/voice/voiceApi';
import { useI18n } from '../../lib/i18n';
import { Avatar } from '../ui/Avatar';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const ENTITY_LABELS: Record<string, string> = {
  lead: 'Lead',
  property_owner: 'Eigentümer',
  partner: 'Partner',
};

export default function IncomingCallOverlay() {
  const { t } = useI18n();
  const {
    incomingCall,
    status,
    callDuration,
    isMuted,
    acceptIncoming,
    rejectIncoming,
    hangUp,
    toggleMute,
  } = useVoice();

  const [matches, setMatches] = useState<CallerMatch[]>([]);
  const [lookupDone, setLookupDone] = useState(false);

  useEffect(() => {
    if (incomingCall?.from) {
      setLookupDone(false);
      setMatches([]);
      lookupCaller(incomingCall.from)
        .then((res) => setMatches(res.matches || []))
        .catch(() => {})
        .finally(() => setLookupDone(true));
    }
  }, [incomingCall?.from]);

  if (!incomingCall) return null;

  const isConnected = incomingCall.accepted || status === 'connected';

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Status indicator */}
          <View style={[styles.statusBar, isConnected ? styles.statusConnected : styles.statusRinging]}>
            <View style={[styles.dot, isConnected ? styles.dotGreen : styles.dotOrange]} />
            <Text style={styles.statusText}>
              {isConnected ? t('voice_connected') : t('voice_incomingCall')}
            </Text>
            {isConnected && (
              <Text style={styles.timer}>{formatDuration(callDuration)}</Text>
            )}
          </View>

          {/* Caller info */}
          <View style={styles.callerSection}>
            <Text style={styles.callerNumber}>{incomingCall.from || t('voice_unknown')}</Text>

            {!lookupDone && (
              <View style={styles.lookupRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.lookupText}>{t('voice_lookingUpCaller')}</Text>
              </View>
            )}

            {lookupDone && matches.length === 1 && (
              <View style={styles.matchCard}>
                <Avatar name={matches[0].name} size={40} />
                <View style={styles.matchInfo}>
                  <Text style={styles.matchName}>{matches[0].name}</Text>
                  <Text style={styles.matchType}>
                    {ENTITY_LABELS[matches[0].entity_type] || matches[0].entity_type}
                  </Text>
                </View>
              </View>
            )}

            {lookupDone && matches.length > 1 && (
              <View>
                <Text style={styles.multiMatch}>
                  {matches.length} {t('voice_matchesFound')}
                </Text>
                {matches.slice(0, 3).map((m) => (
                  <View key={`${m.entity_type}-${m.entity_id}`} style={styles.matchRow}>
                    <Text style={styles.matchRowName}>{m.name}</Text>
                    <Text style={styles.matchRowType}>
                      {ENTITY_LABELS[m.entity_type] || m.entity_type}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {lookupDone && matches.length === 0 && (
              <Text style={styles.noMatch}>{t('voice_noContactFound')}</Text>
            )}
          </View>

          {/* Action buttons */}
          {!isConnected ? (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.rejectBtn} onPress={rejectIncoming}>
                <Ionicons name="close" size={28} color={colors.error} />
                <Text style={styles.rejectText}>{t('voice_reject')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={acceptIncoming}>
                <Ionicons name="call" size={28} color={colors.success} />
                <Text style={styles.acceptText}>{t('voice_accept')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.connectedActions}>
              <TouchableOpacity
                style={[styles.ctrlBtn, isMuted && styles.ctrlBtnActive]}
                onPress={toggleMute}
              >
                <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? colors.white : colors.text} />
                <Text style={[styles.ctrlLabel, isMuted && styles.ctrlLabelActive]}>
                  {t('voice_mute')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.endBtn} onPress={hangUp}>
                <Ionicons name="call" size={28} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  statusRinging: {
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  statusConnected: {
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOrange: { backgroundColor: colors.warning },
  dotGreen: { backgroundColor: colors.success },
  statusText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  timer: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.success,
    fontVariant: ['tabular-nums'],
  },
  callerSection: {
    padding: 20,
    alignItems: 'center',
  },
  callerNumber: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 16,
    letterSpacing: 1,
  },
  lookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lookupText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    width: '100%',
  },
  matchInfo: { flex: 1 },
  matchName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  matchType: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  multiMatch: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  matchRowName: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  matchRowType: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  noMatch: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  rejectBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: colors.errorLight,
    gap: 4,
  },
  rejectText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.error,
  },
  acceptBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: colors.successLight,
    gap: 4,
  },
  acceptText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  connectedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  ctrlBtn: {
    alignItems: 'center',
    gap: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  ctrlBtnActive: {
    backgroundColor: colors.primary,
  },
  ctrlLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  ctrlLabelActive: {
    color: colors.white,
  },
  endBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
