import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useI18n } from '../../../../lib/i18n';
import {
  useFeatureFlags,
  useToggleFeatureFlag,
} from '../../../../lib/api/feature-flags';
import { Card } from '../../../../components/ui/Card';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../../components/ui/EmptyState';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';

export default function FeatureFlagsScreen() {
  const { t } = useI18n();
  const { data: flags, isLoading } = useFeatureFlags();
  const toggleFeatureFlag = useToggleFeatureFlag();

  const handleToggle = (id: string, currentEnabled: boolean) => {
    toggleFeatureFlag.mutate(
      { id, enabled: !currentEnabled },
      {
        onError: () => {
          Alert.alert(t('featureFlags_toggleError'));
        },
      },
    );
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: t('featureFlags_title') }} />

      <ScrollView contentContainerStyle={styles.content}>
        {(!flags || flags.length === 0) ? (
          <EmptyState
            icon="toggle-outline"
            title={t('featureFlags_empty')}
            message={t('featureFlags_emptyDesc')}
          />
        ) : (
          flags.map((flag) => (
            <Card key={flag.id} style={styles.card}>
              <View style={styles.flagRow}>
                <View style={styles.flagInfo}>
                  <Text style={styles.flagName}>{flag.name}</Text>
                  {flag.description ? (
                    <Text style={styles.flagDescription}>{flag.description}</Text>
                  ) : null}
                </View>
                <Switch
                  value={flag.enabled}
                  onValueChange={() => handleToggle(flag.id, flag.enabled)}
                  trackColor={{ true: colors.primary }}
                />
              </View>
            </Card>
          ))
        )}
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
    padding: spacing.md,
    paddingBottom: 120,
    gap: spacing.sm,
  },
  card: {
    marginBottom: 0,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flagInfo: {
    flex: 1,
  },
  flagName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  flagDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
});
