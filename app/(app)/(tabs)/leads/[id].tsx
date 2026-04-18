import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLead, useDeleteLead } from '../../../../lib/api/leads';
import { usePipelineStages, getStageName, useMoveLeadToStage } from '../../../../lib/api/pipeline';
import { useSendPortalInvite } from '../../../../lib/api/email';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Avatar } from '../../../../components/ui/Avatar';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { useCallChoice } from '../../../../lib/call/useCallChoice';
import { Button } from '../../../../components/ui/Button';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';
import { useI18n } from '../../../../lib/i18n';

function getStatusConfig(t: (key: string) => string): Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> {
  return {
    new: { label: t('leadStatus_new'), variant: 'info' },
    contacted: { label: t('leadStatus_contacted'), variant: 'primary' },
    qualified: { label: t('leadStatus_qualified'), variant: 'warning' },
    lost: { label: t('leadStatus_lost'), variant: 'error' },
  };
}

export default function LeadDetailScreen() {
  const { t, formatDate, formatPrice, locale } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lead, isLoading, refetch, isRefetching } = useLead(id!);
  const deleteLead = useDeleteLead();
  const { data: stages } = usePipelineStages();
  const moveToStage = useMoveLeadToStage();
  const sendPortalInvite = useSendPortalInvite();
  const statusConfig = getStatusConfig(t);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!lead) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerTitle: 'Lead', headerShown: true }} />
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{t('leads_notFound')}</Text>
      </View>
    );
  }

  const status = statusConfig[lead.status] ?? {
    label: lead.status,
    variant: 'default' as const,
  };

  const { promptCall, CallChoiceSheet } = useCallChoice();

  const handleCall = () => {
    if (lead.phone) {
      promptCall(lead.phone);
    }
  };

  const handleWhatsApp = () => {
    if (lead.phone) {
      const phone = lead.phone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/${phone}`).catch(() =>
        Alert.alert(t('error'), t('whatsapp_error')),
      );
    }
  };

  const handleTelegram = () => {
    if (lead.phone) {
      const phone = lead.phone.replace(/\D/g, '');
      Linking.openURL(`tg://resolve?phone=${phone}`).catch(() =>
        Alert.alert(t('error'), t('telegram_error')),
      );
    }
  };

  const handleMoveToStage = () => {
    if (!stages || stages.length === 0) return;
    const buttons = stages.map((stage) => ({
      text: getStageName(stage, locale),
      onPress: () => {
        moveToStage.mutate(
          { leadId: lead.id, stageKey: stage.stage_key },
          {
            onSuccess: () => refetch(),
          },
        );
      },
    }));
    buttons.push({ text: t('cancel'), onPress: () => {} });
    Alert.alert(t('lead_moveToStage'), undefined, buttons);
  };

  const handlePortalInvite = () => {
    if (!lead.email) return;
    sendPortalInvite.mutate(
      {
        customerEmail: lead.email,
        customerName: lead.full_name,
        portalPassword: '',
        propertyAddress: '',
        requiredDocuments: [],
      },
      {
        onSuccess: () => Alert.alert(t('lead_portalInviteSent')),
        onError: () => Alert.alert(t('error'), t('lead_portalInviteError')),
      },
    );
  };

  const handleEmail = () => {
    if (lead.email) {
      Linking.openURL(`mailto:${lead.email}`);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/(app)/(tabs)/leads/edit',
      params: { id: lead.id },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      t('leads_delete'),
      t('leads_deleteConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteLead.mutate(lead.id, {
              onSuccess: () => router.back(),
              onError: () =>
                Alert.alert(
                  t('error'),
                  t('leads_deleteError'),
                ),
            });
          },
        },
      ],
    );
  };

  const handleAddTask = () => {
    router.push({
      pathname: '/(app)/(tabs)/tasks/create',
      params: { leadId: lead.id, leadName: lead.full_name },
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <Stack.Screen
        options={{
          headerTitle: lead.full_name,
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={handleEdit} style={{ padding: spacing.xs }}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Avatar name={lead.full_name} size={72} />
        <Text style={styles.name}>{lead.full_name}</Text>
        <Badge label={status.label} variant={status.variant} size="md" />
        {lead.pipeline_stage && stages && (() => {
          const currentStage = stages.find((s) => s.stage_key === lead.pipeline_stage);
          if (!currentStage) return null;
          return (
            <TouchableOpacity onPress={handleMoveToStage}>
              <View style={[styles.pipelineBadge, { backgroundColor: currentStage.color }]}>
                <Text style={styles.pipelineBadgeText}>
                  {getStageName(currentStage, locale)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })()}
        {!lead.pipeline_stage && stages && stages.length > 0 && (
          <TouchableOpacity onPress={handleMoveToStage}>
            <View style={[styles.pipelineBadge, { backgroundColor: colors.textTertiary }]}>
              <Text style={styles.pipelineBadgeText}>{t('lead_pipelineStage')}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <ActionButton
          icon="call-outline"
          label={t('lead_callAction')}
          color={colors.success}
          disabled={!lead.phone}
          onPress={handleCall}
        />
        <ActionButton
          icon="logo-whatsapp"
          label={t('lead_whatsappAction')}
          color="#25D366"
          disabled={!lead.phone}
          onPress={handleWhatsApp}
        />
        <ActionButton
          icon="paper-plane-outline"
          label={t('lead_telegramAction')}
          color="#0088cc"
          disabled={!lead.phone}
          onPress={handleTelegram}
        />
        <ActionButton
          icon="mail-outline"
          label={t('lead_emailAction')}
          color={colors.info}
          disabled={!lead.email}
          onPress={handleEmail}
        />
        <ActionButton
          icon="add-circle-outline"
          label={t('lead_taskAction')}
          color={colors.accent}
          onPress={handleAddTask}
        />
      </View>

      {/* Contact Info */}
      <Card>
        <Text style={styles.cardTitle}>{t('lead_contactData')}</Text>
        {lead.phone && (
          <TouchableOpacity onPress={handleCall}>
            <DetailRow icon="call-outline" label={t('lead_phone_label')} value={lead.phone} />
          </TouchableOpacity>
        )}
        {lead.email && (
          <TouchableOpacity onPress={handleEmail}>
            <DetailRow icon="mail-outline" label={t('lead_email_label')} value={lead.email} />
          </TouchableOpacity>
        )}
        {lead.source && (
          <DetailRow icon="earth-outline" label={t('lead_source_label')} value={lead.source} />
        )}
        <DetailRow
          icon="calendar-outline"
          label={t('lead_created_label')}
          value={formatDate(lead.created_at, {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        />
      </Card>

      {/* Language & Budget */}
      {(lead.preferred_language || lead.budget) && (
        <Card>
          {lead.preferred_language && (
            <DetailRow icon="language-outline" label={t('lead_language')} value={lead.preferred_language} />
          )}
          {lead.budget != null && (
            <DetailRow icon="cash-outline" label={t('lead_budget')} value={formatPrice(lead.budget)} />
          )}
        </Card>
      )}

      {/* Notes */}
      {lead.notes && (
        <Card style={styles.notesCard}>
          <Text style={styles.cardTitle}>{t('lead_notes_label')}</Text>
          <Text style={styles.notesText}>{lead.notes}</Text>
        </Card>
      )}

      {/* Activity placeholder */}
      <Card style={styles.activityCard}>
        <Text style={styles.cardTitle}>{t('lead_activities')}</Text>
        <View style={styles.activityPlaceholder}>
          <Ionicons
            name="time-outline"
            size={32}
            color={colors.textTertiary}
          />
          <Text style={styles.activityPlaceholderText}>
            {t('lead_activityTimeline')}
          </Text>
        </View>
      </Card>

      {/* Portal Invitation */}
      {lead.email && (
        <View style={styles.portalInviteContainer}>
          <Button
            title={t('lead_portalInvite')}
            variant="outline"
            icon="mail-open-outline"
            onPress={handlePortalInvite}
            loading={sendPortalInvite.isPending}
            disabled={sendPortalInvite.isPending}
          />
        </View>
      )}

      {/* Delete */}
      <View style={styles.deleteContainer}>
        <Button
          title={t('delete')}
          variant="danger"
          icon="trash-outline"
          onPress={handleDelete}
          loading={deleteLead.isPending}
          disabled={deleteLead.isPending}
        />
      </View>
      <CallChoiceSheet />
    </ScrollView>
  );
}

function ActionButton({
  icon,
  label,
  color,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, disabled && styles.actionDisabled]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={disabled ? colors.textTertiary : color} />
      </View>
      <Text style={[styles.actionLabel, disabled && styles.actionLabelDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
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
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 120,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.error,
    marginTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  actionLabelDisabled: {
    color: colors.textTertiary,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
    marginTop: 1,
  },
  notesCard: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
  },
  notesText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  activityCard: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
  },
  activityPlaceholder: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  activityPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  pipelineBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  pipelineBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  portalInviteContainer: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
  },
  deleteContainer: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
});
