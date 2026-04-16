import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchVoiceStatus, VoiceStatusResponse } from '../../../lib/voice/voiceApi';
import { useVoice } from '../../../lib/voice/VoiceContext';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { useI18n } from '../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  route: string;
  color: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: 'list-outline', labelKey: 'voice_callLogs', route: '/(app)/voice/call-logs', color: colors.info },
  { icon: 'settings-outline', labelKey: 'voice_settings', route: '/(app)/voice/settings', color: colors.primary },
  { icon: 'git-network-outline', labelKey: 'voice_routing', route: '/(app)/voice/routing', color: colors.accent },
  { icon: 'time-outline', labelKey: 'voice_schedules', route: '/(app)/voice/schedules', color: colors.warning },
  { icon: 'musical-notes-outline', labelKey: 'voice_audioAssets', route: '/(app)/voice/audio', color: colors.success },
  { icon: 'git-branch-outline', labelKey: 'voice_flows', route: '/(app)/voice/flows/', color: colors.primaryLight },
];

export default function VoiceOverview() {
  const { t } = useI18n();
  const { status: voiceStatus, isInitialized } = useVoice();

  const { data: connStatus, isLoading } = useQuery({
    queryKey: ['voice-status'],
    queryFn: fetchVoiceStatus,
    staleTime: 60_000,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('voice_title') }} />

      {/* Connection status */}
      <Card style={styles.statusCard}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: connStatus?.connected ? colors.success : colors.textTertiary },
                ]}
              />
              <Text style={styles.statusLabel}>
                {connStatus?.connected ? t('voice_connected') : t('voice_disconnected')}
              </Text>
            </View>
            {connStatus?.connected && (
              <View style={styles.statsRow}>
                {connStatus.enabled_users !== undefined && (
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{connStatus.enabled_users}</Text>
                    <Text style={styles.statLabel}>{t('voice_enabledUsers')}</Text>
                  </View>
                )}
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {isInitialized && voiceStatus === 'ready' ? '●' : '○'}
                  </Text>
                  <Text style={styles.statLabel}>{t('voice_deviceStatus')}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </Card>

      {/* Menu grid */}
      <View style={styles.grid}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuCard}
            onPress={() => router.push(item.route as never)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{t(item.labelKey as never)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  statusCard: { marginBottom: spacing.lg },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: { alignItems: 'center' },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    gap: 10,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
  },
});
