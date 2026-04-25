import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProperty } from '../../lib/api/properties';
import { DocumentManager } from '../../components/properties/DocumentManager';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
} from '../../constants/theme';

// Dedicated doc-portal subpage. Isolated from the property detail screen
// so that any future DocumentManager render error stays contained on this
// route and never blocks the rest of the property menu (per user request:
// "wenn nötig in eine Subkategorie, aber benutzbar").

export default function PropertyDocPortalScreen() {
  const { propertyId, propertyTitle, propertyAddress } = useLocalSearchParams<{
    propertyId: string;
    propertyTitle?: string;
    propertyAddress?: string;
  }>();
  const { t } = useI18n();
  const { data: property, isLoading } = useProperty(propertyId ?? '');

  if (!propertyId) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerTitle: t('docportal.section.title'), headerShown: true }} />
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{t('media_noPropertySelected')}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerTitle: t('docportal.section.title'), headerShown: true }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const titleFromParam = propertyTitle ? decodeURIComponent(propertyTitle) : '';
  const addressFromParam = propertyAddress ? decodeURIComponent(propertyAddress) : '';
  const displayTitle = property?.title || titleFromParam || t('docportal.section.title');
  const computedAddress =
    property?.address
      ? `${property.address}${property.city ? `, ${property.city}` : ''}`
      : addressFromParam;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('docportal.section.title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Ionicons name="folder-open-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={2}>{displayTitle}</Text>
            {!!computedAddress && (
              <Text style={styles.headerSubtitle} numberOfLines={2}>{computedAddress}</Text>
            )}
          </View>
        </View>

        <ErrorBoundary label={t('docportal.section.title')}>
          <DocumentManager
            propertyId={String(propertyId)}
            propertyName={displayTitle}
            propertyAddress={computedAddress || undefined}
          />
        </ErrorBoundary>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.md,
    paddingBottom: 80,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.error,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
