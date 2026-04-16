import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchCallLogs, CallLog } from '../../lib/voice/voiceApi';
import { useVoice } from '../../lib/voice/VoiceContext';
import { useI18n } from '../../lib/i18n';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Gestern';
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

function DirectionIcon({ direction, status }: { direction: string; status: string }) {
  const isMissed = status === 'no-answer' || status === 'missed' || status === 'busy';
  if (isMissed) {
    return (
      <View style={[styles.iconBg, { backgroundColor: colors.errorLight }]}>
        <Ionicons name="call" size={16} color={colors.error} style={{ transform: [{ rotate: '135deg' }] }} />
      </View>
    );
  }
  if (direction === 'inbound') {
    return (
      <View style={[styles.iconBg, { backgroundColor: colors.infoLight }]}>
        <Ionicons name="arrow-down-outline" size={16} color={colors.info} />
      </View>
    );
  }
  return (
    <View style={[styles.iconBg, { backgroundColor: colors.successLight }]}>
      <Ionicons name="arrow-up-outline" size={16} color={colors.success} />
    </View>
  );
}

interface CallLogListProps {
  limit?: number;
  onCallBack?: (number: string) => void;
}

export default function CallLogList({ limit = 50, onCallBack }: CallLogListProps) {
  const { t } = useI18n();
  const { dialNumber } = useVoice();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['call-logs', limit],
    queryFn: () => fetchCallLogs(limit),
    staleTime: 30_000,
  });

  const handleCallBack = (log: CallLog) => {
    const number = log.direction === 'inbound' ? log.from_number : log.to_number;
    if (onCallBack) {
      onCallBack(number);
    } else {
      dialNumber(number);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="call-outline" size={40} color={colors.textTertiary} />
        <Text style={styles.emptyText}>{t('voice_noCallLogs')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={logs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const otherNumber =
          item.direction === 'inbound' ? item.from_number : item.to_number;
        const isMissed =
          item.status === 'no-answer' || item.status === 'missed' || item.status === 'busy';

        return (
          <TouchableOpacity
            style={styles.logRow}
            onPress={() => handleCallBack(item)}
            activeOpacity={0.7}
          >
            <DirectionIcon direction={item.direction} status={item.status} />
            <View style={styles.logInfo}>
              <Text style={[styles.logNumber, isMissed && styles.logMissed]}>
                {item.entity_name || otherNumber}
              </Text>
              <View style={styles.logMeta}>
                <Text style={styles.logDirection}>
                  {item.direction === 'inbound' ? t('voice_incoming') : t('voice_outgoing')}
                </Text>
                {item.duration > 0 && (
                  <Text style={styles.logDuration}>
                    {formatDuration(item.duration)}
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.logDate}>{formatDate(item.started_at)}</Text>
          </TouchableOpacity>
        );
      }}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  list: {
    paddingVertical: spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logInfo: {
    flex: 1,
  },
  logNumber: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  logMissed: {
    color: colors.error,
  },
  logMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  logDirection: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  logDuration: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  logDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
});
