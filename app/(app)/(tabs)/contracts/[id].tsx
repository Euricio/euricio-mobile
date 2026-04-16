import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useContract,
  useDeleteContract,
  useGeneratePdf,
} from '../../../../lib/api/contracts';
import {
  useSendContractEmail,
  useSendSignatureRequest,
  useEmailSettings,
  EmailNotConfiguredError,
} from '../../../../lib/api/email';
import { CONTRACT_TYPE_CONFIG } from '../../../../lib/contracts/config';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { Button } from '../../../../components/ui/Button';
import { SendContractSheet } from '../../../../components/email/SendContractSheet';
import { SignedPdfUpload } from '../../../../components/contracts/SignedPdfUpload';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../../constants/theme';
import { useI18n } from '../../../../lib/i18n';
import type { Locale } from '../../../../lib/i18n';

function getStatusBadge(
  status: string,
  t: (key: string) => string,
): { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' } {
  switch (status) {
    case 'draft':
      return { label: t('contractStatus_draft'), variant: 'warning' };
    case 'signed':
      return { label: t('contractStatus_signed'), variant: 'success' };
    case 'archived':
      return { label: t('contractStatus_archived'), variant: 'default' };
    default:
      return { label: status, variant: 'default' };
  }
}

export default function ContractDetailScreen() {
  const { t, formatDate } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: contract, isLoading, refetch, isRefetching } = useContract(id!);
  const deleteContract = useDeleteContract();
  const generatePdf = useGeneratePdf();
  const sendContractEmail = useSendContractEmail();
  const sendSignatureRequest = useSendSignatureRequest();
  const { data: emailSettings } = useEmailSettings();
  const [showSendSheet, setShowSendSheet] = useState(false);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!contract) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerTitle: t('contracts_title'), headerShown: true }} />
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{t('contracts_notFound')}</Text>
      </View>
    );
  }

  const typeConfig = CONTRACT_TYPE_CONFIG[contract.contract_type];
  const typeLabel = t(`contractType_${contract.contract_type}`) || typeConfig?.label_de || contract.contract_type;
  const badge = getStatusBadge(contract.status, t);
  const hasPdf = !!contract.pdf_stored_url || !!contract.pdf_url;

  const enabledClauses = (contract.selected_clauses ?? []).filter(
    (c) => c.enabled,
  );

  const propertyDisplay = contract.property
    ? `${contract.property.street || ''}, ${contract.property.city || ''}`.trim()
    : contract.property_address || '';

  const handleGeneratePdf = () => {
    generatePdf.mutate(contract.id, {
      onSuccess: () => {
        Alert.alert(t('contract_pdfSuccess'));
      },
      onError: () => {
        Alert.alert(t('error'), t('contract_pdfError'));
      },
    });
  };

  const handleViewPdf = () => {
    const url = contract.pdf_stored_url || contract.pdf_url;
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleDelete = () => {
    Alert.alert(t('contracts_delete'), t('contracts_deleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          deleteContract.mutate(contract.id, {
            onSuccess: () => router.back(),
            onError: () => Alert.alert(t('error'), t('contracts_deleteError')),
          });
        },
      },
    ]);
  };

  const handleSendEmail = () => {
    if (!emailSettings?.smtp_host) {
      Alert.alert(t('error'), t('email_smtpNotConfigured'));
      return;
    }
    if (!contract.client_email) {
      Alert.alert(t('error'), t('email_noClientEmail'));
      return;
    }
    setShowSendSheet(true);
  };

  const handleSendContractEmail = (email: string, language: Locale) => {
    sendContractEmail.mutate(
      {
        contractId: contract.id,
        recipientEmail: email,
        language,
      },
      {
        onSuccess: () => {
          setShowSendSheet(false);
          Alert.alert(t('email_sent'));
        },
        onError: (error) => {
          if (error instanceof EmailNotConfiguredError) {
            Alert.alert(t('error'), t('email_smtpNotConfigured'));
          } else {
            Alert.alert(t('error'), t('email_sendError'));
          }
        },
      },
    );
  };

  const handleSendSignature = () => {
    if (!emailSettings?.smtp_host) {
      Alert.alert(t('error'), t('email_smtpNotConfigured'));
      return;
    }
    if (!contract.signature_status && !contract.client_email) {
      Alert.alert(t('error'), t('email_signatureNoToken'));
      return;
    }

    Alert.alert(t('email_sendSignature'), t('email_sendSignature'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('email_send'),
        onPress: () => {
          sendSignatureRequest.mutate(
            {
              contractId: contract.id,
              signerIds: [],
            },
            {
              onSuccess: () => {
                Alert.alert(t('email_signatureSent'));
                refetch();
              },
              onError: () => {
                Alert.alert(t('error'), t('email_signatureError'));
              },
            },
          );
        },
      },
    ]);
  };

  const handleEdit = () => {
    router.push({
      pathname: '/(app)/(tabs)/contracts/edit',
      params: { id: contract.id },
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
          headerTitle: typeLabel,
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
        <View style={styles.headerIcon}>
          <Ionicons name="document-text" size={32} color={colors.primary} />
        </View>
        <Text style={styles.headerTitle}>{typeLabel}</Text>
        <Badge label={badge.label} variant={badge.variant} size="md" />
        <Text style={styles.headerDate}>
          {formatDate(contract.created_at, {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* PDF Actions — Generated Contract */}
      <View style={styles.pdfActions}>
        {hasPdf ? (
          <Button
            title={`${t('signedPdf_generatedPdf')} — ${t('contract_viewPdf')}`}
            icon="document-outline"
            onPress={handleViewPdf}
          />
        ) : (
          <Button
            title={t('contract_generatePdf')}
            icon="create-outline"
            onPress={handleGeneratePdf}
            loading={generatePdf.isPending}
            disabled={generatePdf.isPending}
          />
        )}
      </View>

      {/* Email Actions */}
      <View style={styles.emailActions}>
        <Button
          title={t('email_sendContract')}
          onPress={handleSendEmail}
          variant="outline"
          icon={
            <Ionicons name="mail-outline" size={16} color={colors.primary} />
          }
          style={styles.emailBtn}
        />
        <Button
          title={t('email_sendSignature')}
          onPress={handleSendSignature}
          variant="ghost"
          loading={sendSignatureRequest.isPending}
          disabled={sendSignatureRequest.isPending}
          icon={
            <Ionicons
              name="create-outline"
              size={16}
              color={colors.primary}
            />
          }
          style={styles.emailBtn}
        />
      </View>

      {/* Signed PDF Upload */}
      <SignedPdfUpload
        contractId={contract.id}
        signedPdfUrl={contract.signed_pdf_url}
        onUploadComplete={() => refetch()}
      />

      {/* Open standalone scanner */}
      {!contract.signed_pdf_url && (
        <TouchableOpacity
          style={styles.scannerLink}
          onPress={() => router.push('/(app)/scanner')}
        >
          <Ionicons name="scan-outline" size={18} color={colors.primary} />
          <Text style={styles.scannerLinkText}>{t('signedPdf_openScanner')}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      )}

      {/* Client Info */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('contract_sectionClient')}</Text>
        <DetailRow
          icon="person-outline"
          label={t('contract_clientName')}
          value={contract.client_name}
        />
        {contract.client_email && (
          <DetailRow
            icon="mail-outline"
            label={t('contract_clientEmail')}
            value={contract.client_email}
          />
        )}
        {contract.client_phone && (
          <DetailRow
            icon="call-outline"
            label={t('contract_clientPhone')}
            value={contract.client_phone}
          />
        )}
        {contract.client_address && (
          <DetailRow
            icon="location-outline"
            label={t('contract_clientAddress')}
            value={contract.client_address}
          />
        )}
        {contract.client_id_number && (
          <DetailRow
            icon="card-outline"
            label={t('contract_clientIdNumber')}
            value={contract.client_id_number}
          />
        )}
      </Card>

      {/* Property */}
      {propertyDisplay ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contract_sectionProperty')}</Text>
          <DetailRow
            icon="home-outline"
            label={t('contract_propertyAddress')}
            value={propertyDisplay}
          />
        </Card>
      ) : null}

      {/* Contract Details */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('contract_sectionDetails')}</Text>
        {contract.mandate_type && (
          <DetailRow
            icon="ribbon-outline"
            label={t('contract_mandateType')}
            value={
              contract.mandate_type === 'exclusive'
                ? t('contract_mandateExclusive')
                : t('contract_mandateSimple')
            }
          />
        )}
        {contract.commission_percentage != null && (
          <DetailRow
            icon="cash-outline"
            label={t('contract_commission')}
            value={`${contract.commission_percentage}%`}
          />
        )}
        {contract.signing_location && (
          <DetailRow
            icon="navigate-outline"
            label={t('contract_signingLocation')}
            value={contract.signing_location}
          />
        )}
      </Card>

      {/* Clauses */}
      {enabledClauses.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('contract_clauses')} ({enabledClauses.length})
          </Text>
          {enabledClauses.map((clause, index) => (
            <View key={clause.key} style={styles.clauseItem}>
              <Text style={styles.clauseNumber}>{index + 1}.</Text>
              <View style={styles.clauseContent}>
                <Text style={styles.clauseTitle}>{clause.title_de}</Text>
                <Text style={styles.clauseText} numberOfLines={3}>
                  {clause.text}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Delete */}
      <View style={styles.deleteContainer}>
        <Button
          title={t('delete')}
          variant="danger"
          icon="trash-outline"
          onPress={handleDelete}
          loading={deleteContract.isPending}
          disabled={deleteContract.isPending}
        />
      </View>

      {/* Send Email Bottom Sheet */}
      <SendContractSheet
        visible={showSendSheet}
        onClose={() => setShowSendSheet(false)}
        onSend={handleSendContractEmail}
        defaultEmail={contract.client_email || ''}
        loading={sendContractEmail.isPending}
      />
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
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  headerDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  pdfActions: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  emailActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  emailBtn: {
    flex: 1,
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
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
    borderBottomColor: colors.border + '40',
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
  clauseItem: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
    gap: spacing.sm,
  },
  clauseNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    minWidth: 24,
  },
  clauseContent: {
    flex: 1,
  },
  clauseTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  clauseText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  scannerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  scannerLinkText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  deleteContainer: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
});
