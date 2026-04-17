import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApiKey, useRegenerateApiKey, useWidgets, useUpdateWidget } from '../../../../lib/api/integrations';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { useI18n } from '../../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../../constants/theme';
import PortalPublishingSection from '../../../../components/integrations/PortalPublishingSection';

const WIDGET_TYPES = ['valuation', 'career', 'portal', 'listing', 'search'] as const;

export default function IntegrationsScreen() {
  const { t } = useI18n();
  const { data: apiKey, isLoading: apiKeyLoading } = useApiKey();
  const regenerateKey = useRegenerateApiKey();
  const { data: widgets, isLoading: widgetsLoading } = useWidgets();
  const updateWidget = useUpdateWidget();

  const widgetNames: Record<string, string> = {
    valuation: t('integrations_widget_valuation'),
    career: t('integrations_widget_career'),
    portal: t('integrations_widget_portal'),
    listing: t('integrations_widget_listing'),
    search: t('integrations_widget_search'),
  };

  const maskedKey = apiKey?.key
    ? apiKey.key.substring(0, 8) + '...'
    : t('integrations_noKey');

  const handleCopyKey = () => {
    if (apiKey?.key) {
      Alert.alert(t('integrations_apiKey'), apiKey.key);
    }
  };

  const handleRegenerateKey = () => {
    Alert.alert(
      t('integrations_regenerateTitle'),
      t('integrations_regenerateConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('integrations_regenerate'),
          style: 'destructive',
          onPress: () => regenerateKey.mutate(),
        },
      ],
    );
  };

  const handleCopyEmbed = (widgetType: string) => {
    const embedCode = `<script src="https://widgets.euricio.com/${widgetType}.js"></script>`;
    Alert.alert(t('integrations_embedCode'), embedCode);
  };

  const getWidgetConfig = (type: string) => {
    return widgets?.find((w) => w.widget_type === type);
  };

  const handleToggleWidget = (type: string, enabled: boolean) => {
    const widget = getWidgetConfig(type);
    if (widget) {
      updateWidget.mutate({ id: widget.id, enabled });
    }
  };

  if (apiKeyLoading || widgetsLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: t('integrations_title'),
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerShadowVisible: false,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(app)/(tabs)/more');
                  }
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ paddingRight: 8 }}
              >
                <Ionicons name="chevron-back" size={26} color={colors.primary} />
              </TouchableOpacity>
            ),
          }}
        />
        <LoadingScreen />
      </>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
          options={{
            headerTitle: t('integrations_title'),
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerShadowVisible: false,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/(app)/(tabs)/more');
                  }
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ paddingRight: 8 }}
              >
                <Ionicons name="chevron-back" size={26} color={colors.primary} />
              </TouchableOpacity>
            ),
          }}
        />

      {/* API Key Section */}
      <Text style={styles.sectionHeader}>{t('integrations_apiKeySection')}</Text>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="key-outline" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>{t('integrations_apiKey')}</Text>
        </View>
        <View style={styles.keyRow}>
          <Text style={styles.keyText}>{maskedKey}</Text>
        </View>
        <View style={styles.buttonRow}>
          <Button
            title={t('integrations_copyKey')}
            onPress={handleCopyKey}
            variant="outline"
            size="sm"
            icon={<Ionicons name="copy-outline" size={16} color={colors.primary} />}
            disabled={!apiKey?.key}
            style={styles.actionButton}
          />
          <Button
            title={t('integrations_regenerate')}
            onPress={handleRegenerateKey}
            variant="danger"
            size="sm"
            loading={regenerateKey.isPending}
            icon={<Ionicons name="refresh-outline" size={16} color={colors.white} />}
            style={styles.actionButton}
          />
        </View>
      </Card>

      {/* Widgets Section */}
      <Text style={styles.sectionHeader}>{t('integrations_widgetsSection')}</Text>
      {WIDGET_TYPES.map((type) => {
        const widget = getWidgetConfig(type);
        const isEnabled = widget?.enabled ?? false;

        return (
          <Card key={type} style={styles.card}>
            <View style={styles.widgetRow}>
              <View style={styles.widgetInfo}>
                <Text style={styles.widgetName}>
                  {widgetNames[type] ?? type}
                </Text>
                <Text style={styles.widgetType}>{type}</Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={(value) => handleToggleWidget(type, value)}
                trackColor={{ true: colors.success }}
                disabled={!widget}
              />
            </View>
            <Button
              title={t('integrations_copyEmbed')}
              onPress={() => handleCopyEmbed(type)}
              variant="ghost"
              size="sm"
              icon={<Ionicons name="code-slash-outline" size={16} color={colors.primary} />}
              style={styles.embedButton}
            />
          </Card>
        );
      })}

      {/* Portal Publishing Section */}
      <PortalPublishingSection />
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  keyRow: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: 12,
  },
  keyText: {
    fontSize: fontSize.sm,
    fontFamily: 'monospace',
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  widgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetInfo: {
    flex: 1,
  },
  widgetName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  widgetType: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  embedButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
});
