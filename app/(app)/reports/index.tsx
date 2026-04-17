import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../constants/theme';

export default function ReportsScreen() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: t('reports_title') }} />

      <View style={styles.centerContent}>
        <Ionicons
          name="bar-chart-outline"
          size={80}
          color={colors.primary + '4D'}
        />
        <Text style={styles.title}>{t('reports_comingSoon')}</Text>
        <Text style={styles.description}>{t('reports_comingSoonDesc')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 24,
  },
});
