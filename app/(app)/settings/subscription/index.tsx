import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../../../lib/api/subscription';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { useI18n } from '../../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../../constants/theme';

export default function SubscriptionScreen() {
  const { t, formatDate } = useI18n();
  const { data: subscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: t('subscription_title') }} />
        <LoadingScreen />
      </>
    );
  }

  if (!subscription) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerTitle: t('subscription_title') }} />
        <View style={styles.content}>
          <Card style={styles.card}>
            <View style={styles.noSubContainer}>
              <Ionicons name="information-circle-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.noSubTitle}>{t('subscription_noPlan')}</Text>
              <Text style={styles.noSubMessage}>{t('subscription_webCrmNote')}</Text>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  const formatLimit = (key: string): string => {
    const limit = subscription.limits[key];
    if (limit === undefined || limit === null) return '--';
    if (limit < 0) return t('subscription_unlimited');
    return String(limit);
  };

  const usageItems = [
    {
      icon: 'people-outline' as const,
      label: t('subscription_leads'),
      value: formatLimit('leads'),
    },
    {
      icon: 'home-outline' as const,
      label: t('subscription_properties'),
      value: formatLimit('properties'),
    },
    {
      icon: 'person-outline' as const,
      label: t('subscription_teamSeats'),
      value: formatLimit('team_seats'),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('subscription_title') }} />

      {/* Current Plan */}
      <Text style={styles.sectionHeader}>{t('subscription_currentPlan')}</Text>
      <Card style={styles.card}>
        <View style={styles.planRow}>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{subscription.plan_name}</Text>
            <Badge
              label={subscription.billing_cycle}
              variant="primary"
              size="sm"
            />
          </View>
        </View>
        {subscription.renewal_date && (
          <Text style={styles.renewalText}>
            {t('subscription_renewsOn')} {formatDate(subscription.renewal_date)}
          </Text>
        )}
      </Card>

      {/* Usage Limits */}
      <Text style={styles.sectionHeader}>{t('subscription_usage')}</Text>
      <View style={styles.usageRow}>
        {usageItems.map((item) => (
          <Card key={item.label} style={styles.usageCard}>
            <Ionicons name={item.icon} size={24} color={colors.primary} />
            <Text style={styles.usageValue}>{item.value}</Text>
            <Text style={styles.usageLabel}>{item.label}</Text>
          </Card>
        ))}
      </View>

      {/* Features */}
      <Text style={styles.sectionHeader}>{t('subscription_features')}</Text>
      <Card style={styles.card}>
        {subscription.features.length === 0 ? (
          <Text style={styles.emptyText}>{t('subscription_noFeatures')}</Text>
        ) : (
          subscription.features.map((feature, index) => (
            <View
              key={feature}
              style={[
                styles.featureRow,
                index > 0 && styles.featureRowBorder,
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.success}
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))
        )}
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
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  renewalText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  usageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  usageCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  usageValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  usageLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  featureRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  featureText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  noSubContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noSubTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  noSubMessage: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
