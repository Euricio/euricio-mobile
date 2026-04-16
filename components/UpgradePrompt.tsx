import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './ui/Button';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../constants/theme';
import { useI18n } from '../lib/i18n';

interface UpgradePromptProps {
  feature: 'contracts' | 'scanner';
}

const UPGRADE_URL = 'https://app.euricio.com/settings/subscription';

export function UpgradePrompt({ feature }: UpgradePromptProps) {
  const { t } = useI18n();

  const title = feature === 'contracts'
    ? t('upgrade_contracts_title')
    : t('upgrade_scanner_title');

  const description = feature === 'contracts'
    ? t('upgrade_contracts_description')
    : t('upgrade_scanner_description');

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={40} color={colors.primary} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.featureList}>
          {['upgrade_feature_1', 'upgrade_feature_2', 'upgrade_feature_3'].map(
            (key) => (
              <View key={key} style={styles.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.featureText}>{t(key)}</Text>
              </View>
            ),
          )}
        </View>

        <Button
          title={t('upgrade_cta')}
          onPress={() => Linking.openURL(UPGRADE_URL)}
          size="lg"
          icon={
            <Ionicons name="arrow-up-circle-outline" size={20} color={colors.white} />
          }
          style={styles.ctaButton}
        />

        <Text style={styles.hint}>{t('upgrade_hint')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    ...shadow.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  ctaButton: {
    alignSelf: 'stretch',
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
