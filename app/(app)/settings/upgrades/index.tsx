import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAddons, useToggleAddon } from '../../../../lib/api/subscription';
import type { Addon } from '../../../../lib/api/subscription';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { useI18n } from '../../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../../constants/theme';

export default function UpgradesScreen() {
  const { t } = useI18n();
  const { data: addons, isLoading } = useAddons();
  const toggleAddon = useToggleAddon();

  const handleToggle = (addon: Addon) => {
    const action = addon.is_active ? 'unsubscribe' : 'subscribe';
    const title = addon.is_active
      ? t('upgrades_unsubscribeTitle')
      : t('upgrades_subscribeTitle');
    const message = addon.is_active
      ? t('upgrades_unsubscribeConfirm', { name: addon.name })
      : t('upgrades_subscribeConfirm', { name: addon.name, price: addon.price });

    Alert.alert(title, message, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: addon.is_active ? t('upgrades_unsubscribe') : t('upgrades_subscribe'),
        style: addon.is_active ? 'destructive' : 'default',
        onPress: () =>
          toggleAddon.mutate({
            addon_id: addon.id,
            activate: !addon.is_active,
          }),
      },
    ]);
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: t('upgrades_title') }} />
        <LoadingScreen />
      </>
    );
  }

  if (!addons || addons.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerTitle: t('upgrades_title') }} />
        <EmptyState
          icon="cart-outline"
          title={t('upgrades_empty')}
          message={t('upgrades_emptyMessage')}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('upgrades_title') }} />

      <Text style={styles.sectionHeader}>{t('upgrades_availableAddons')}</Text>

      {addons.map((addon) => (
        <Card key={addon.id} style={styles.card}>
          <View style={styles.addonHeader}>
            <View style={styles.addonTitleRow}>
              <Text style={styles.addonName}>{addon.name}</Text>
              <Badge
                label={addon.is_active ? t('upgrades_active') : t('upgrades_inactive')}
                variant={addon.is_active ? 'success' : 'default'}
                size="sm"
              />
            </View>
            <Text style={styles.addonPrice}>
              {addon.price > 0
                ? `${addon.price.toFixed(2)} EUR / ${t('upgrades_month')}`
                : t('upgrades_free')}
            </Text>
          </View>
          {addon.description ? (
            <Text style={styles.addonDescription}>{addon.description}</Text>
          ) : null}
          <Button
            title={
              addon.is_active
                ? t('upgrades_unsubscribe')
                : t('upgrades_subscribe')
            }
            onPress={() => handleToggle(addon)}
            variant={addon.is_active ? 'outline' : 'primary'}
            size="sm"
            loading={toggleAddon.isPending}
            style={styles.addonButton}
          />
        </Card>
      ))}

      {/* Payment Note */}
      <Card style={styles.noteCard}>
        <View style={styles.noteRow}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={styles.noteText}>{t('upgrades_paymentNote')}</Text>
        </View>
      </Card>
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
  sectionHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    marginLeft: spacing.xs,
  },
  card: {
    marginBottom: spacing.md,
  },
  addonHeader: {
    marginBottom: spacing.sm,
  },
  addonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  addonName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  addonPrice: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  addonDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  addonButton: {
    alignSelf: 'flex-start',
  },
  noteCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.infoLight,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  noteText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
