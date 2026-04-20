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
import { fetchCallerContext, type CallerContextMatch } from '../../lib/api/callerContext';
import { useI18n } from '../../lib/i18n';
import { Avatar } from '../ui/Avatar';
import { CallerContextCard } from './CallerContextCard';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const ENTITY_LABEL_KEYS: Record<string, string> = {
  lead: 'caller_entity_lead',
  property_owner: 'caller_entity_owner',
  partner: 'caller_entity_partner',
};

/** Upgrade a legacy CallerMatch into a CallerContextMatch-compatible shape
 *  so the CallerContextCard can still render when only the legacy endpoint
 *  responds (e.g. network hiccup or backend rollout in progress). */
function legacyToContext(m: CallerMatch): CallerContextMatch {
  return {
    entity_type: m.entity_type as CallerContextMatch['entity_type'],
    entity_id: Number(m.entity_id),
    name: m.name,
    phone: '',
    email: m.email ?? null,
    status: m.status ?? null,
    language_code: null,
    warmth: null,
    is_cold_callback: false,
    next_action: null,
    property: m.property_id ? { id: Number(m.property_id), title: m.property_info || '' } : null,
    relationship_owner: null,
    last_agent: null,
    last_interaction: null,
    open_tasks_count: 0,
  };
}

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

  const [matches, setMatches] = useState<CallerContextMatch[]>([]);
  const [lookupDone, setLookupDone] = useState(false);

  useEffect(() => {
    if (!incomingCall?.from) return;
    let cancelled = false;
    setLookupDone(false);
    setMatches([]);

    (async () => {
      // Primary: rich caller-context endpoint (returns CRM context in one trip)
      try {
        const res = await fetchCallerContext(incomingCall.from!);
        if (cancelled) return;
        setMatches(res.matches);
        setLookupDone(true);
        return;
      } catch {
        // Fall through to legacy endpoint on any error
      }

      // Fallback: legacy caller-lookup (already in production)
      try {
        const res = await lookupCaller(incomingCall.from!);
        if (cancelled) return;
        setMatches((res.matches || []).map(legacyToContext));
      } catch {
        if (!cancelled) setMatches([]);
      } finally {
        if (!cancelled) setLookupDone(true);
      }
    })();

    return () => {
      cancelled = true;
    };
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
              <CallerContextCard match={matches[0]} compact />
            )}

            {lookupDone && matches.length > 1 && (
              <View style={styles.multiMatchWrap}>
                <Text style={styles.multiMatch}>
                  {matches.length} {t('voice_matchesFound')}
                </Text>
                {matches.slice(0, 3).map((m) => (
                  <View key={`${m.entity_type}-${m.entity_id}`} style={styles.matchRow}>
                    <Avatar name={m.name} size={32} />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={styles.matchRowName} numberOfLines={1}>{m.name}</Text>
                      <Text style={styles.matchRowType} numberOfLines={1}>
                        {t(ENTITY_LABEL_KEYS[m.entity_type] || 'caller_entity_lead')}
                        {m.next_action ? ` · ${m.next_action}` : ''}
                      </Text>
                    </View>
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
  },
  multiMatchWrap: {
    gap: spacing.sm,
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
    alignItems: 'center',
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
