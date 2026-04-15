import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProperty } from '../../../../lib/api/properties';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../../constants/theme';

const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
  available: { label: 'Verfügbar', variant: 'success' },
  reserved: { label: 'Reserviert', variant: 'warning' },
  sold: { label: 'Verkauft', variant: 'error' },
  rented: { label: 'Vermietet', variant: 'info' },
};

function formatPrice(price: number | null): string {
  if (!price) return '—';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: property, isLoading, refetch, isRefetching } = useProperty(id!);

  if (isLoading) return <LoadingScreen />;

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerTitle: 'Objekt', headerShown: true }} />
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>Immobilie nicht gefunden</Text>
      </View>
    );
  }

  const status = statusLabels[property.status ?? ''] ?? {
    label: property.status ?? '',
    variant: 'default' as const,
  };

  const handleMaps = () => {
    if (property.address) {
      const encoded = encodeURIComponent(
        `${property.address}${property.city ? ', ' + property.city : ''}`,
      );
      Linking.openURL(`https://maps.google.com/?q=${encoded}`);
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
          headerTitle: property.title,
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

      {/* Image Gallery */}
      <View style={styles.imageSection}>
        {property.image_url ? (
          <Image
            source={{ uri: property.image_url }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.imagePlaceholderText}>Kein Bild vorhanden</Text>
          </View>
        )}
      </View>

      {/* Title & Price */}
      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {property.title}
          </Text>
          {status.label && <Badge label={status.label} variant={status.variant} size="md" />}
        </View>
        <Text style={styles.price}>{formatPrice(property.price)}</Text>
        {property.address && (
          <TouchableOpacity onPress={handleMaps} style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.addressText}>
              {property.address}
              {property.city ? `, ${property.city}` : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Key Facts */}
      <View style={styles.factsRow}>
        {property.size != null && (
          <FactItem icon="resize-outline" label="Fläche" value={`${property.size} m²`} />
        )}
        {property.rooms != null && (
          <FactItem icon="bed-outline" label="Zimmer" value={String(property.rooms)} />
        )}
        {property.type && (
          <FactItem icon="home-outline" label="Typ" value={property.type} />
        )}
      </View>

      {/* Description */}
      {property.description && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Beschreibung</Text>
          <Text style={styles.descriptionText}>{property.description}</Text>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Exposé senden"
          onPress={() => {}}
          icon={<Ionicons name="document-text-outline" size={18} color={colors.white} />}
          style={styles.actionButton}
        />
        <Button
          title="Auf Karte anzeigen"
          onPress={handleMaps}
          variant="outline"
          icon={<Ionicons name="map-outline" size={18} color={colors.primary} />}
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
}

function FactItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.factItem}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label}</Text>
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
  imageSection: {
    height: 250,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  imagePlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  titleSection: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flex: 1,
  },
  price: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  addressText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  factsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  factItem: {
    alignItems: 'center',
    gap: 2,
  },
  factValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  factLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
});
