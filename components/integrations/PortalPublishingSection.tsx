import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useI18n } from '../../lib/i18n';
import {
  usePortalConfigs,
  usePortalSyncLogs,
  useSavePortalConfig,
  useSyncPortal,
  PortalName,
  PortalConfig,
  SyncLogEntry,
} from '../../lib/api/portals';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

const ALL_PORTALS: PortalName[] = [
  'idealista', 'fotocasa', 'pisos', 'kyero',
  'immoscout24', 'immowelt', 'kleinanzeigen',
  'rightmove', 'zoopla', 'onthemarket',
];

const PORTAL_GROUPS: { key: string; portals: PortalName[] }[] = [
  { key: 'portal.group.spain', portals: ['idealista', 'fotocasa', 'pisos', 'kyero'] },
  { key: 'portal.group.germany', portals: ['immoscout24', 'immowelt', 'kleinanzeigen'] },
  { key: 'portal.group.uk', portals: ['rightmove', 'zoopla', 'onthemarket'] },
];

const PORTAL_META: Record<PortalName, {
  badge: string;
  color: string;
  nameKey: string;
  infoKey: string;
  subtitleKey?: string;
  inputLabelKey: string;
  inputPlaceholderKey: string;
}> = {
  idealista:     { badge: 'id', color: '#1BC47D', nameKey: 'portal.idealista',     infoKey: 'portal.idealistaInfo',     inputLabelKey: 'portal.ilcCode',       inputPlaceholderKey: 'portal.ilcPlaceholder' },
  fotocasa:      { badge: 'fc', color: '#E4002B', nameKey: 'portal.fotocasa',      infoKey: 'portal.fotocasaInfo',      subtitleKey: 'portal.fotocasaCovers', inputLabelKey: 'portal.apiKey',        inputPlaceholderKey: 'portal.apiKeyPlaceholder' },
  pisos:         { badge: 'pi', color: '#FF6B00', nameKey: 'portal.pisos',         infoKey: 'portal.pisosInfo',         inputLabelKey: 'portal.apiKeyGeneric', inputPlaceholderKey: 'portal.apiKeyPlaceholder' },
  kyero:         { badge: 'ky', color: '#0077B6', nameKey: 'portal.kyero',         infoKey: 'portal.kyeroInfo',         inputLabelKey: 'portal.apiKeyGeneric', inputPlaceholderKey: 'portal.apiKeyPlaceholder' },
  immoscout24:   { badge: 'is', color: '#FF7500', nameKey: 'portal.immoscout24',   infoKey: 'portal.immoscout24Info',   inputLabelKey: 'portal.apiKeyGeneric', inputPlaceholderKey: 'portal.apiKeyPlaceholder' },
  immowelt:      { badge: 'iw', color: '#003399', nameKey: 'portal.immowelt',      infoKey: 'portal.immoweltInfo',      inputLabelKey: 'portal.apiKeyGeneric', inputPlaceholderKey: 'portal.apiKeyPlaceholder' },
  kleinanzeigen: { badge: 'ka', color: '#86B817', nameKey: 'portal.kleinanzeigen', infoKey: 'portal.kleinanzeigenInfo', inputLabelKey: 'portal.apiKeyGeneric', inputPlaceholderKey: 'portal.apiKeyPlaceholder' },
  rightmove:     { badge: 'rm', color: '#00DEB6', nameKey: 'portal.rightmove',     infoKey: 'portal.rightmoveInfo',     inputLabelKey: 'portal.apiKeyGeneric', inputPlaceholderKey: 'portal.apiKeyPlaceholder' },
  zoopla:        { badge: 'zp', color: '#8046F1', nameKey: 'portal.zoopla',        infoKey: 'portal.zooplaInfo',        inputLabelKey: 'portal.apiKeyGeneric', inputPlaceholderKey: 'portal.apiKeyPlaceholder' },
  onthemarket:   { badge: 'om', color: '#1A1A2E', nameKey: 'portal.onthemarket',   infoKey: 'portal.onthemarketInfo',   inputLabelKey: 'portal.apiKeyGeneric', inputPlaceholderKey: 'portal.apiKeyPlaceholder' },
};

const SYNC_FREQUENCIES = [
  { value: '2x_daily', key: 'portal.freq2xDaily' },
  { value: '4x_daily', key: 'portal.freq4xDaily' },
  { value: 'hourly', key: 'portal.freqHourly' },
];

function PortalCard({
  portal,
  config,
  syncLogs,
  t,
  lang,
}: {
  portal: PortalName;
  config: PortalConfig | null;
  syncLogs: SyncLogEntry[];
  t: (key: string) => string;
  lang: string;
}) {
  const [apiKey, setApiKey] = useState(config?.api_key ?? '');
  const [autoSync, setAutoSync] = useState(config?.auto_sync ?? false);
  const [syncFreq, setSyncFreq] = useState(config?.sync_frequency ?? '2x_daily');
  const [saved, setSaved] = useState(false);

  const saveConfig = useSavePortalConfig();
  const syncPortal = useSyncPortal();

  useEffect(() => {
    if (config) {
      setApiKey(config.api_key);
      setAutoSync(config.auto_sync);
      setSyncFreq(config.sync_frequency);
    }
  }, [config]);

  const meta = PORTAL_META[portal];
  const status = config?.status ?? 'not_configured';

  const dateLocale = lang === 'de' ? 'de-DE' : lang === 'es' ? 'es-ES' : 'en-GB';

  function formatDate(dateStr: string | null) {
    if (!dateStr) return t('portal.never');
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  async function handleSave() {
    setSaved(false);
    const newStatus = apiKey.trim() ? 'configured' : 'not_configured';
    await saveConfig.mutateAsync({
      portal,
      api_key: apiKey.trim(),
      auto_sync: autoSync,
      sync_frequency: syncFreq,
      status: newStatus,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSync() {
    await syncPortal.mutateAsync(portal);
  }

  const statusColor =
    status === 'configured' ? colors.success
    : status === 'error' ? colors.error
    : colors.textTertiary;

  const statusText =
    status === 'configured' ? t('portal.statusConfigured')
    : status === 'error' ? t('portal.statusError')
    : t('portal.statusNotConfigured');

  const syncStatusColor = (s: string) =>
    s === 'success' ? colors.success : s === 'error' ? colors.error : colors.warning;

  const syncStatusText = (s: string) =>
    s === 'success' ? t('portal.syncSuccess') : s === 'error' ? t('portal.syncError') : t('portal.syncWarning');

  const [freqOpen, setFreqOpen] = useState(false);

  return (
    <Card style={styles.portalCard}>
      {/* Header */}
      <View style={styles.portalHeader}>
        <View style={styles.portalHeaderLeft}>
          <View style={[styles.portalBadge, { backgroundColor: meta.color }]}>
            <Text style={styles.portalBadgeText}>{meta.badge}</Text>
          </View>
          <View>
            <Text style={styles.portalName}>{t(meta.nameKey)}</Text>
            {meta.subtitleKey && (
              <Text style={styles.portalSubtitle}>{t(meta.subtitleKey)}</Text>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      {/* API Key Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>{t(meta.inputLabelKey)}</Text>
        <TextInput
          style={styles.apiKeyInput}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder={t(meta.inputPlaceholderKey)}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Auto-sync Toggle + Frequency */}
      <View style={styles.syncRow}>
        <View style={styles.syncToggle}>
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ false: colors.border, true: colors.success }}
          />
          <Text style={styles.syncToggleLabel}>{t('portal.autoSync')}</Text>
        </View>
        <View style={styles.freqSection}>
          <Text style={styles.freqLabel}>{t('portal.syncFrequency')}:</Text>
          <TouchableOpacity
            style={styles.freqPicker}
            onPress={() => setFreqOpen(!freqOpen)}
          >
            <Text style={styles.freqPickerText}>
              {t(SYNC_FREQUENCIES.find(f => f.value === syncFreq)?.key ?? 'portal.freq2xDaily')}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Frequency dropdown */}
      {freqOpen && (
        <View style={styles.freqDropdown}>
          {SYNC_FREQUENCIES.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.freqOption,
                syncFreq === f.value && styles.freqOptionActive,
              ]}
              onPress={() => { setSyncFreq(f.value); setFreqOpen(false); }}
            >
              <Text style={[
                styles.freqOptionText,
                syncFreq === f.value && styles.freqOptionTextActive,
              ]}>
                {t(f.key)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Save + Sync Buttons */}
      <View style={styles.buttonRow}>
        <Button
          title={saveConfig.isPending ? t('portal.saving') : saved ? t('portal.saved') : t('portal.save')}
          onPress={handleSave}
          variant="outline"
          size="sm"
          loading={saveConfig.isPending}
          style={styles.saveButton}
        />
        <Button
          title={syncPortal.isPending ? t('portal.syncing') : t('portal.syncNow')}
          onPress={handleSync}
          variant="ghost"
          size="sm"
          loading={syncPortal.isPending}
          disabled={status !== 'configured'}
          style={[styles.syncButton, status !== 'configured' && { opacity: 0.4 }]}
        />
      </View>

      {/* Last Sync */}
      <Text style={styles.lastSync}>
        {t('portal.lastSync')}: {formatDate(config?.last_sync_at ?? null)}
      </Text>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color={colors.info} style={{ marginTop: 1 }} />
        <Text style={styles.infoText}>{t(meta.infoKey)}</Text>
      </View>

      {/* Sync Log */}
      <View style={styles.syncLogSection}>
        <Text style={styles.syncLogTitle}>{t('portal.syncLog')}</Text>
        {syncLogs.length === 0 ? (
          <Text style={styles.syncLogEmpty}>{t('portal.syncLogEmpty')}</Text>
        ) : (
          syncLogs.slice(0, 5).map(log => (
            <View key={log.id} style={styles.syncLogEntry}>
              <View style={styles.syncLogLeft}>
                <View style={[styles.syncLogBadge, { backgroundColor: syncStatusColor(log.status) + '20' }]}>
                  <Text style={[styles.syncLogBadgeText, { color: syncStatusColor(log.status) }]}>
                    {syncStatusText(log.status)}
                  </Text>
                </View>
                <Text style={styles.syncLogCount}>
                  {log.properties_synced} {t('portal.propertiesSynced')}
                </Text>
              </View>
              <Text style={styles.syncLogDate}>{formatDate(log.synced_at)}</Text>
            </View>
          ))
        )}
      </View>
    </Card>
  );
}

export default function PortalPublishingSection() {
  const { t, locale } = useI18n();
  const { data: configs, isLoading: configsLoading } = usePortalConfigs();
  const { data: syncLogs, isLoading: logsLoading } = usePortalSyncLogs();

  const configMap: Record<string, PortalConfig> = {};
  configs?.forEach(c => { configMap[c.portal] = c; });

  const logMap: Record<string, SyncLogEntry[]> = {};
  ALL_PORTALS.forEach(p => { logMap[p] = []; });
  syncLogs?.forEach(l => {
    if (!logMap[l.portal]) logMap[l.portal] = [];
    logMap[l.portal].push(l);
  });

  if (configsLoading || logsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionHeader}>{t('portal.sectionTitle')}</Text>
      <Text style={styles.sectionSubtitle}>{t('portal.sectionSubtitle')}</Text>

      {PORTAL_GROUPS.map(group => (
        <View key={group.key} style={styles.groupContainer}>
          <Text style={styles.groupTitle}>{t(group.key)}</Text>
          {group.portals.map(portal => (
            <PortalCard
              key={portal}
              portal={portal}
              config={configMap[portal] ?? null}
              syncLogs={logMap[portal] ?? []}
              t={t}
              lang={locale}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
    marginLeft: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
    lineHeight: 18,
  },
  groupContainer: {
    marginBottom: spacing.lg,
  },
  groupTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  portalCard: {
    marginBottom: spacing.md,
  },
  portalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  portalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  portalBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: -0.3,
  },
  portalName: {
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  portalSubtitle: {
    fontSize: fontSize.xs - 1,
    color: colors.textTertiary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: fontSize.xs - 1,
    fontWeight: fontWeight.medium,
  },
  inputSection: {
    marginBottom: spacing.sm + 2,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  apiKeyInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: fontSize.sm - 1,
    fontFamily: 'monospace',
    color: colors.text,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 2,
  },
  syncToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncToggleLabel: {
    fontSize: fontSize.sm - 1,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  freqSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freqLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  freqPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  freqPickerText: {
    fontSize: fontSize.xs,
    color: colors.text,
  },
  freqDropdown: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  freqOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  freqOptionActive: {
    backgroundColor: colors.infoLight,
  },
  freqOptionText: {
    fontSize: fontSize.xs,
    color: colors.text,
  },
  freqOptionTextActive: {
    color: colors.info,
    fontWeight: fontWeight.medium,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm + 2,
  },
  saveButton: {
    flex: 1,
  },
  syncButton: {
    flex: 1,
  },
  lastSync: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.sm + 2,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    padding: 10,
    marginBottom: spacing.sm + 2,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.info,
    lineHeight: 18,
  },
  syncLogSection: {
    marginTop: 2,
  },
  syncLogTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  syncLogEmpty: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  syncLogEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  syncLogLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  syncLogBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncLogBadgeText: {
    fontSize: fontSize.xs - 1,
    fontWeight: fontWeight.medium,
  },
  syncLogCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  syncLogDate: {
    fontSize: fontSize.xs - 1,
    color: colors.textTertiary,
  },
});
