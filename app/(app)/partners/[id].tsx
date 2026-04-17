import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import { usePartner, usePartnerCommissions, useDeletePartner } from '../../../lib/api/partners';
import type { Commission } from '../../../lib/api/partners';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

const STATUS_COLORS: Record<string, string> = {
  pending: colors.warning,
  approved: colors.info,
  paid: colors.success,
  rejected: colors.error,
};

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function CommissionItem({ commission, t, formatPrice }: { commission: Commission; t: (key: string) => string; formatPrice: (n: number | null) => string }) {
  return (
    <Card style={styles.commissionCard}>
      <View style={styles.commissionHeader}>
        <Text style={styles.commissionDesc} numberOfLines={1}>
          {commission.description || commission.property?.title || '—'}
        </Text>
        <Badge
          label={t(`partner_commissionStatus_${commission.status}`)}
          variant={
            commission.status === 'paid' ? 'success' :
            commission.status === 'approved' ? 'info' :
            commission.status === 'rejected' ? 'error' :
            'warning'
          }
        />
      </View>
      <View style={styles.commissionMeta}>
        {commission.commission_amount != null && (
          <Text style={styles.commissionAmount}>{formatPrice(commission.commission_amount)}</Text>
        )}
        <Text style={styles.commissionType}>
          {commission.commission_type === 'percent'
            ? `${commission.commission_value}%`
            : formatPrice(commission.commission_value)}
        </Text>
      </View>
    </Card>
  );
}

export default function PartnerDetailScreen() {
  const { t, formatPrice } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: partner, isLoading } = usePartner(id);
  const { data: commissions } = usePartnerCommissions(id);
  const deletePartner = useDeletePartner();
  const [activeTab, setActiveTab] = useState<'info' | 'commissions'>('info');

  const handleDelete = () => {
    Alert.alert(t('partners_delete'), t('partners_deleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePartner.mutateAsync(id);
            router.back();
          } catch {
            Alert.alert(t('error'), t('partners_deleteError'));
          }
        },
      },
    ]);
  };

  if (isLoading || !partner) return <LoadingScreen />;

  const fullName = [partner.first_name, partner.last_name].filter(Boolean).join(' ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          headerTitle: fullName,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(app)/partners/edit',
                    params: { id: partner.id },
                  })
                }
              >
                <Ionicons name="pencil-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={{ marginLeft: spacing.md }}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Quick actions */}
      <View style={styles.quickActions}>
        {partner.phone && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Linking.openURL(`tel:${partner.phone}`)}
          >
            <Ionicons name="call-outline" size={20} color={colors.white} />
            <Text style={styles.actionText}>{t('partner_callAction')}</Text>
          </TouchableOpacity>
        )}
        {partner.email && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.info }]}
            onPress={() => Linking.openURL(`mailto:${partner.email}`)}
          >
            <Ionicons name="mail-outline" size={20} color={colors.white} />
            <Text style={styles.actionText}>{t('partner_emailAction')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab selector */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            {t('partner_info')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'commissions' && styles.tabActive]}
          onPress={() => setActiveTab('commissions')}
        >
          <Text style={[styles.tabText, activeTab === 'commissions' && styles.tabTextActive]}>
            {t('partner_commissions')} ({commissions?.length ?? 0})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'info' && (
        <Card>
          <InfoRow label={t('partner_category')} value={t(`partner_category_${partner.category}`)} />
          <InfoRow label={t('partner_status')} value={t(`partner_status_${partner.status}`)} />
          <InfoRow label={t('partner_email')} value={partner.email} />
          <InfoRow label={t('partner_emailAlt')} value={partner.email_alt} />
          <InfoRow label={t('partner_phone')} value={partner.phone} />
          <InfoRow label={t('partner_phoneAlt')} value={partner.phone_alt} />
          <InfoRow label={t('partner_organization')} value={partner.organization} />
          <InfoRow label={t('partner_city')} value={partner.city} />
          <InfoRow label={t('partner_nif')} value={partner.nif} />
          <InfoRow
            label={t('partner_commissionType')}
            value={partner.commission_type ? t(`partner_commission_${partner.commission_type}`) : null}
          />
          <InfoRow
            label={t('partner_commissionValue')}
            value={
              partner.commission_value != null
                ? partner.commission_type === 'percent'
                  ? `${partner.commission_value}%`
                  : formatPrice(partner.commission_value)
                : null
            }
          />
          {partner.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>{t('partner_notes')}</Text>
              <Text style={styles.notesText}>{partner.notes}</Text>
            </View>
          )}
        </Card>
      )}

      {activeTab === 'commissions' && (
        <>
          <Button
            title={t('partner_newCommission')}
            onPress={() =>
              router.push({
                pathname: '/(app)/partners/create-commission',
                params: { partnerId: partner.id },
              })
            }
            icon={<Ionicons name="add-outline" size={18} color={colors.white} />}
          />
          <View style={{ height: spacing.sm }} />
          {(commissions ?? []).length === 0 ? (
            <EmptyState
              icon="wallet-outline"
              title={t('partner_noCommissions')}
            />
          ) : (
            (commissions ?? []).map((c) => (
              <CommissionItem key={c.id} commission={c} t={t} formatPrice={formatPrice} />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  notesSection: {
    paddingTop: spacing.md,
  },
  notesLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  commissionCard: {
    marginBottom: spacing.sm,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  commissionDesc: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  commissionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commissionAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  commissionType: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
});
