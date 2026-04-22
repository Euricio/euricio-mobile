import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  useValuationRequest,
  useImportValuationAsLead,
  type ValuationRequest,
} from '../../../lib/api/valuation-requests';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { ResultV2 } from '../../../components/valuation/ResultV2';
import type { ValuationResultV2 } from '../../../lib/valuation/types';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
} from '../../../constants/theme';

export default function ValuationRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, formatDate } = useI18n();
  const { data: request, isLoading } = useValuationRequest(id);
  const importAsLead = useImportValuationAsLead();

  const handleImport = () => {
    if (!request) return;
    importAsLead.mutate(request, {
      onSuccess: () => Alert.alert(t('valReq_importSuccess')),
      onError: () => Alert.alert(t('error'), t('valReq_importError')),
    });
  };

  const handleCall = () => {
    if (!request?.contact_phone) return;
    Linking.openURL(`tel:${request.contact_phone}`);
  };

  if (isLoading || !request) return <LoadingScreen />;

  const isImported = request.status === 'imported';

  // Detect engine version — rows may carry `valuation_logic_version` when the
  // request was produced by the v2 engine. The column is optional so we cast
  // to access it without breaking the base type.
  const row = request as ValuationRequest & {
    valuation_logic_version?: string | null;
    range_base?: number | null;
    range_low?: number | null;
    range_high?: number | null;
    confidence_score?: number | null;
    confidence_class?: string | null;
    confidence_breakdown?: unknown;
    method_results?: unknown;
    weights?: unknown;
    warnings?: unknown;
    vpo?: unknown;
    market_data?: unknown;
    assumptions_snapshot?: unknown;
    value_per_sqm?: number | null;
  };
  const version = row.valuation_logic_version;
  const isV2 = version === 'v2';
  const v2Result = isV2 ? reconstructV2(row) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen
        options={{ headerTitle: t('valReq_title') }}
      />

      {/* Version + status */}
      <View style={styles.statusRow}>
        <View style={styles.badgeRow}>
          <Badge
            label={isImported ? t('valReq_imported') : t('valReq_pending')}
            variant={isImported ? 'success' : 'warning'}
          />
          {version && (
            <Badge
              label={isV2 ? 'v2' : 'v1-legacy'}
              variant={isV2 ? 'success' : 'default'}
            />
          )}
        </View>
        <Text style={styles.date}>
          {formatDate(request.created_at, {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* v2 result preview — rendered before legacy details */}
      {v2Result && (
        <View style={{ marginBottom: 16 }}>
          <ResultV2 result={v2Result} />
        </View>
      )}

      {/* Property Details */}
      <Text style={styles.sectionHeader}>{t('valReq_propertyDetails')}</Text>
      <Card>
        <DetailRow
          icon="home-outline"
          label={t('valuation_propertyType')}
          value={
            request.property_type
              ? t(`propType_${request.property_type}`)
              : '—'
          }
        />
        <DetailRow
          icon="location-outline"
          label={t('valuation_address')}
          value={
            [request.address, request.postal_code].filter(Boolean).join(', ') ||
            '—'
          }
        />
        <DetailRow
          icon="resize-outline"
          label={t('valuation_area')}
          value={request.area_m2 ? `${request.area_m2} m\u00b2` : '—'}
        />
        <DetailRow
          icon="bed-outline"
          label={t('valuation_rooms')}
          value={request.rooms ? String(request.rooms) : '—'}
        />
        {request.sell_timeline && (
          <DetailRow
            icon="time-outline"
            label={t('valReq_sellTimeline')}
            value={request.sell_timeline}
          />
        )}
      </Card>

      {/* Contact Details */}
      <Text style={styles.sectionHeader}>{t('valReq_contactDetails')}</Text>
      <Card>
        <DetailRow
          icon="person-outline"
          label={t('lead_name')}
          value={request.contact_name || '—'}
        />
        <DetailRow
          icon="mail-outline"
          label={t('lead_email')}
          value={request.contact_email || '—'}
        />
        <DetailRow
          icon="call-outline"
          label={t('lead_phone')}
          value={request.contact_phone || '—'}
        />
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        {request.contact_phone && (
          <Button
            title={t('valReq_callContact')}
            onPress={handleCall}
            variant="secondary"
            icon={<Ionicons name="call-outline" size={18} color={colors.primary} />}
          />
        )}
        {isImported ? (
          <View style={styles.importedRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.importedText}>
              {t('valReq_alreadyImported')}
            </Text>
          </View>
        ) : (
          <Button
            title={t('valReq_importAsLead')}
            onPress={handleImport}
            loading={importAsLead.isPending}
            icon={
              <Ionicons name="person-add-outline" size={18} color={colors.white} />
            }
          />
        )}
      </View>
    </ScrollView>
  );
}

/**
 * Rebuild a ValuationResultV2 shape from the flat DB columns so the UI can
 * render the v2 viewer for persisted requests. Missing fields fall back to
 * empty-but-valid defaults so the component doesn't crash.
 */
function reconstructV2(row: {
  property_type?: string | null;
  postal_code?: string | null;
  range_base?: number | null;
  range_low?: number | null;
  range_high?: number | null;
  value_per_sqm?: number | null;
  confidence_score?: number | null;
  confidence_class?: string | null;
  confidence_breakdown?: unknown;
  method_results?: unknown;
  weights?: unknown;
  warnings?: unknown;
  vpo?: unknown;
  market_data?: unknown;
  assumptions_snapshot?: unknown;
  created_at?: string | null;
}): ValuationResultV2 | null {
  if (row.range_base == null) return null;
  const confidenceClass = (row.confidence_class as ValuationResultV2['confidence']['class']) || 'media';
  return {
    property_type: (row.property_type as ValuationResultV2['property_type']) || 'piso',
    country: 'ES',
    postal_code: row.postal_code ?? '',
    range: {
      low: row.range_low ?? row.range_base,
      base: row.range_base,
      high: row.range_high ?? row.range_base,
    },
    value_per_sqm: row.value_per_sqm ?? undefined,
    confidence: {
      score: row.confidence_score ?? 0,
      class: confidenceClass,
      breakdown: Array.isArray(row.confidence_breakdown)
        ? (row.confidence_breakdown as ValuationResultV2['confidence']['breakdown'])
        : [],
    },
    weights: (row.weights as ValuationResultV2['weights']) ?? {},
    methods: Array.isArray(row.method_results)
      ? (row.method_results as ValuationResultV2['methods'])
      : [],
    warnings: Array.isArray(row.warnings)
      ? (row.warnings as ValuationResultV2['warnings'])
      : [],
    vpo: (row.vpo as ValuationResultV2['vpo']) ?? undefined,
    market_data: (row.market_data as ValuationResultV2['market_data']) ?? {
      source: 'unknown',
      confidence: 'low',
    },
    assumptions_snapshot:
      (row.assumptions_snapshot as ValuationResultV2['assumptions_snapshot']) ?? {},
    calculated_at: row.created_at ?? new Date().toISOString(),
  };
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={detailStyles.row}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <View style={detailStyles.content}>
        <Text style={detailStyles.label}>{label}</Text>
        <Text style={detailStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  content: { flex: 1 },
  label: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  value: {
    fontSize: fontSize.md,
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  date: { fontSize: fontSize.sm, color: colors.textSecondary },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  importedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  importedText: {
    fontSize: fontSize.md,
    color: colors.success,
    fontWeight: fontWeight.medium,
  },
});
