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
  useSearchRequest,
  useSearchRequestMatches,
  useImportSearchRequestAsLead,
  useUpdateSearchRequestStatus,
} from '../../../lib/api/search-requests';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

const STATUSES = ['new', 'assigned', 'matched', 'closed'] as const;
const STATUS_VARIANT: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  new: 'info',
  assigned: 'warning',
  matched: 'success',
  closed: 'default',
};

export default function SearchRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, formatPrice, formatDate } = useI18n();
  const { data: request, isLoading } = useSearchRequest(id);
  const { data: matches } = useSearchRequestMatches(id);
  const importAsLead = useImportSearchRequestAsLead();
  const updateStatus = useUpdateSearchRequestStatus();

  const handleImport = () => {
    if (!request) return;
    importAsLead.mutate(request, {
      onSuccess: () => Alert.alert(t('searchReq_importSuccess')),
      onError: () => Alert.alert(t('error'), t('searchReq_importError')),
    });
  };

  const handleStatusChange = (newStatus: string) => {
    if (!id) return;
    updateStatus.mutate({ id, status: newStatus });
  };

  const handleCall = () => {
    if (!request?.contact_phone) return;
    Linking.openURL(`tel:${request.contact_phone}`);
  };

  if (isLoading || !request) return <LoadingScreen />;

  const isImported = !!request.imported_lead_id;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ headerTitle: t('searchReq_title') }} />

      {/* Status + Intent */}
      <View style={styles.statusRow}>
        <View style={styles.intentRow}>
          <Badge
            label={
              request.intent === 'buy'
                ? t('searchReq_intent_buy')
                : t('searchReq_intent_rent')
            }
            variant={request.intent === 'buy' ? 'info' : 'warning'}
          />
          <Badge
            label={t(`searchReq_status_${request.status}`)}
            variant={STATUS_VARIANT[request.status] || 'default'}
          />
        </View>
        <Text style={styles.date}>
          {formatDate(request.created_at, {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Search Criteria */}
      <Text style={styles.sectionHeader}>{t('searchReq_preferences')}</Text>
      <Card>
        {request.property_type && (
          <DetailRow
            icon="home-outline"
            label={t('valuation_propertyType')}
            value={t(`propType_${request.property_type}`)}
          />
        )}
        {(request.min_budget || request.max_budget) && (
          <DetailRow
            icon="cash-outline"
            label={t('searchReq_budget')}
            value={
              request.min_budget && request.max_budget
                ? `${formatPrice(request.min_budget)} – ${formatPrice(request.max_budget)}`
                : request.max_budget
                  ? `max. ${formatPrice(request.max_budget)}`
                  : `min. ${formatPrice(request.min_budget!)}`
            }
          />
        )}
        {(request.min_area || request.max_area) && (
          <DetailRow
            icon="resize-outline"
            label={t('searchReq_area')}
            value={
              request.min_area && request.max_area
                ? `${request.min_area} – ${request.max_area} m\u00b2`
                : request.max_area
                  ? `max. ${request.max_area} m\u00b2`
                  : `min. ${request.min_area} m\u00b2`
            }
          />
        )}
        {(request.min_rooms || request.max_rooms) && (
          <DetailRow
            icon="bed-outline"
            label={t('searchReq_rooms')}
            value={
              request.min_rooms && request.max_rooms
                ? `${request.min_rooms} – ${request.max_rooms}`
                : request.max_rooms
                  ? `max. ${request.max_rooms}`
                  : `min. ${request.min_rooms}`
            }
          />
        )}
        {request.location_preference && (
          <DetailRow
            icon="location-outline"
            label={t('searchReq_location')}
            value={request.location_preference}
          />
        )}
        {request.notes && (
          <DetailRow
            icon="document-text-outline"
            label={t('searchReq_notes')}
            value={request.notes}
          />
        )}
      </Card>

      {/* Contact */}
      <Text style={styles.sectionHeader}>{t('searchReq_contactDetails')}</Text>
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

      {/* Matched Properties */}
      {matches && matches.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>
            {t('searchReq_matchedProperties')}
          </Text>
          {matches.map((m) => (
            <Card key={m.id} style={styles.matchCard}>
              <View style={styles.matchRow}>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchTitle}>
                    {m.property?.title || '—'}
                  </Text>
                  <Text style={styles.matchDetails}>
                    {m.property?.city || '—'}
                    {m.property?.area_m2 ? ` \u00b7 ${m.property.area_m2} m\u00b2` : ''}
                    {m.property?.price ? ` \u00b7 ${formatPrice(m.property.price)}` : ''}
                  </Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{Math.round(m.score)}%</Text>
                </View>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Status Update */}
      <Text style={styles.sectionHeader}>{t('searchReq_updateStatus')}</Text>
      <View style={styles.statusButtons}>
        {STATUSES.map((s) => (
          <Button
            key={s}
            title={t(`searchReq_status_${s}`)}
            onPress={() => handleStatusChange(s)}
            variant={request.status === s ? 'primary' : 'outline'}
            size="sm"
            disabled={request.status === s}
          />
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {request.contact_phone && (
          <Button
            title={t('searchReq_callContact')}
            onPress={handleCall}
            variant="secondary"
            icon={
              <Ionicons name="call-outline" size={18} color={colors.primary} />
            }
          />
        )}
        {isImported ? (
          <View style={styles.importedRow}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
            <Text style={styles.importedText}>
              {t('searchReq_alreadyImported')}
            </Text>
          </View>
        ) : (
          <Button
            title={t('searchReq_importAsLead')}
            onPress={handleImport}
            loading={importAsLead.isPending}
            icon={
              <Ionicons
                name="person-add-outline"
                size={18}
                color={colors.white}
              />
            }
          />
        )}
      </View>
    </ScrollView>
  );
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
  intentRow: { flexDirection: 'row', gap: spacing.sm },
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
  matchCard: { marginBottom: spacing.xs },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  matchInfo: { flex: 1 },
  matchTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  matchDetails: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
