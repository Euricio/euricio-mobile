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
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLead } from '../../../../lib/api/leads';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Avatar } from '../../../../components/ui/Avatar';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
  new: { label: 'Neu', variant: 'info' },
  contacted: { label: 'Kontaktiert', variant: 'primary' },
  qualified: { label: 'Qualifiziert', variant: 'warning' },
  proposal: { label: 'Angebot', variant: 'primary' },
  won: { label: 'Gewonnen', variant: 'success' },
  lost: { label: 'Verloren', variant: 'error' },
};

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lead, isLoading, refetch, isRefetching } = useLead(id!);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!lead) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerTitle: 'Lead', headerShown: true }} />
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Lead nicht gefunden</Text>
      </View>
    );
  }

  const status = statusConfig[lead.status] ?? {
    label: lead.status,
    variant: 'default' as const,
  };

  const handleCall = () => {
    if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (lead.phone) {
      const phone = lead.phone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/${phone}`).catch(() =>
        Alert.alert('Fehler', 'WhatsApp konnte nicht geöffnet werden.'),
      );
    }
  };

  const handleEmail = () => {
    if (lead.email) {
      Linking.openURL(`mailto:${lead.email}`);
    }
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
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Avatar name={lead.full_name} size={72} />
        <Text style={styles.name}>{lead.full_name}</Text>
        <Badge label={status.label} variant={status.variant} size="md" />
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <ActionButton
          icon="call-outline"
          label="Anrufen"
          color={colors.success}
          disabled={!lead.phone}
          onPress={handleCall}
        />
        <ActionButton
          icon="logo-whatsapp"
          label="WhatsApp"
          color="#25D366"
          disabled={!lead.phone}
          onPress={handleWhatsApp}
        />
        <ActionButton
          icon="mail-outline"
          label="E-Mail"
          color={colors.info}
          disabled={!lead.email}
          onPress={handleEmail}
        />
        <ActionButton
          icon="add-circle-outline"
          label="Aufgabe"
          color={colors.accent}
        />
      </View>

      {/* Contact Info */}
      <Card>
        <Text style={styles.cardTitle}>Kontaktdaten</Text>
        {lead.phone && (
          <TouchableOpacity onPress={handleCall}>
            <DetailRow icon="call-outline" label="Telefon" value={lead.phone} />
          </TouchableOpacity>
        )}
        {lead.email && (
          <TouchableOpacity onPress={handleEmail}>
            <DetailRow icon="mail-outline" label="E-Mail" value={lead.email} />
          </TouchableOpacity>
        )}
        {lead.source && (
          <DetailRow icon="earth-outline" label="Quelle" value={lead.source} />
        )}
        <DetailRow
          icon="calendar-outline"
          label="Erstellt"
          value={new Date(lead.created_at).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        />
      </Card>

      {/* Notes */}
      {lead.notes && (
        <Card style={styles.notesCard}>
          <Text style={styles.cardTitle}>Notizen</Text>
          <Text style={styles.notesText}>{lead.notes}</Text>
        </Card>
      )}

      {/* Activity placeholder */}
      <Card style={styles.activityCard}>
        <Text style={styles.cardTitle}>Aktivitäten</Text>
        <View style={styles.activityPlaceholder}>
          <Ionicons
            name="time-outline"
            size={32}
            color={colors.textTertiary}
          />
          <Text style={styles.activityPlaceholderText}>
            Aktivitäts-Timeline wird hier angezeigt
          </Text>
        </View>
      </Card>
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
    paddingBottom: spacing.xxl,
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
});
