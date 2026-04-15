import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Linking,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProperty, useDeleteProperty } from '../../../../lib/api/properties';
import { usePropertyImages } from '../../../../lib/api/propertyImages';
import { usePropertyDocuments } from '../../../../lib/api/propertyMedia';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' }> = {
  available: { label: 'Verfügbar', variant: 'success' },
  reserved: { label: 'Reserviert', variant: 'warning' },
  sold: { label: 'Verkauft', variant: 'error' },
  rented: { label: 'Vermietet', variant: 'info' },
  withdrawn: { label: 'Zurückgezogen', variant: 'default' },
};

const propertyTypeLabels: Record<string, string> = {
  apartment: 'Wohnung',
  house: 'Haus',
  villa: 'Villa',
  chalet: 'Chalet',
  finca: 'Finca',
  commercial: 'Gewerbe',
  land: 'Grundstück',
  garage: 'Garage',
  other: 'Sonstige',
};

const orientationLabels: Record<string, string> = {
  north: 'Nord',
  south: 'Süd',
  east: 'Ost',
  west: 'West',
  southeast: 'Südost',
  southwest: 'Südwest',
  northeast: 'Nordost',
  northwest: 'Nordwest',
};

const conditionLabels: Record<string, string> = {
  new: 'Neubau',
  like_new: 'Neuwertig',
  good: 'Gut',
  needs_renovation: 'Renovierungsbedürftig',
  ruin: 'Ruine',
};

const heatingTypeLabels: Record<string, string> = {
  electric: 'Elektrisch',
  gas: 'Gas',
  oil: 'Öl',
  heat_pump: 'Wärmepumpe',
  solar: 'Solar',
  none: 'Keine',
};

const legalStatusLabels: Record<string, string> = {
  free: 'Frei',
  occupied: 'Besetzt',
  tenant: 'Vermietet',
  legal_dispute: 'Rechtsstreit',
};

const rentalPeriodLabels: Record<string, string> = {
  monthly: 'Monatlich',
  weekly: 'Wöchentlich',
  daily: 'Täglich',
};

const offerTypeLabels: Record<string, string> = {
  sale: 'Verkauf',
  rent: 'Vermietung',
};

function formatPrice(price: number | null): string {
  if (!price) return '—';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('de-DE');
}

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: property, isLoading, refetch, isRefetching } = useProperty(id!);
  const { data: images } = usePropertyImages(id!);
  const { data: documents } = usePropertyDocuments(id!);
  const deleteProperty = useDeleteProperty();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  const handleDelete = () => {
    Alert.alert(
      'Immobilie löschen',
      'Möchten Sie diese Immobilie wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            deleteProperty.mutate(property.id, {
              onSuccess: () => router.back(),
              onError: () => Alert.alert('Fehler', 'Immobilie konnte nicht gelöscht werden.'),
            });
          },
        },
      ],
    );
  };

  // Collect active features as chips
  const featureChips: string[] = [];
  if (property.has_elevator) featureChips.push('Aufzug');
  if (property.has_parking) featureChips.push('Parkplatz');
  if (property.has_pool) featureChips.push('Pool');
  if (property.has_garden) featureChips.push(property.garden_m2 ? `Garten (${property.garden_m2} m²)` : 'Garten');
  if (property.is_furnished) featureChips.push('Möbliert');
  if (property.has_garage) featureChips.push(property.garage_spaces ? `Garage (${property.garage_spaces} Plätze)` : 'Garage');
  if (property.has_terrace) featureChips.push(property.terrace_m2 ? `Terrasse (${property.terrace_m2} m²)` : 'Terrasse');
  if (property.has_ac) featureChips.push('Klimaanlage');
  if (property.has_heating) featureChips.push(property.heating_type ? `Heizung (${heatingTypeLabels[property.heating_type] ?? property.heating_type})` : 'Heizung');
  if (property.has_storage) featureChips.push('Abstellraum');
  if (property.has_sea_view) featureChips.push('Meerblick');

  const hasAddress = property.address || property.city || property.province || property.postal_code;
  const hasLegalInfo = property.referencia_catastral || property.ibi_annual || property.community_fees_monthly || property.has_mortgage || property.legal_status || property.nota_simple_date;
  const hasRentalInfo = property.rental_price || property.rental_period || property.available_from || property.is_rented || property.rental_yield;

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
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/(tabs)/properties/edit?id=${property.id}`)}
              style={styles.headerButton}
            >
              <Ionicons name="pencil-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Image Gallery */}
      {images && images.length > 0 ? (
        <View style={styles.imageSection}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIndex(index);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            )}
          />
          {images.length > 1 && (
            <View style={styles.paginationDots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeImageIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.imageSection}>
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.imagePlaceholderText}>Kein Bild vorhanden</Text>
          </View>
        </View>
      )}

      {/* Title & Price */}
      <View style={styles.titleSection}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {property.title}
          </Text>
          {status.label && <Badge label={status.label} variant={status.variant} size="md" />}
        </View>
        <Text style={styles.price}>{formatPrice(property.price)}</Text>
        {property.price_negotiable && (
          <Text style={styles.negotiableText}>Verhandlungsbasis</Text>
        )}
        {property.offer_type && (
          <Badge
            label={offerTypeLabels[property.offer_type] ?? property.offer_type}
            variant="primary"
            size="sm"
          />
        )}
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
        {property.size_m2 != null && (
          <FactItem icon="resize-outline" label="Fläche" value={`${property.size_m2} m²`} />
        )}
        {property.rooms != null && (
          <FactItem icon="bed-outline" label="Zimmer" value={String(property.rooms)} />
        )}
        {property.bathrooms != null && (
          <FactItem icon="water-outline" label="Bäder" value={String(property.bathrooms)} />
        )}
        {property.property_type && (
          <FactItem icon="home-outline" label="Typ" value={propertyTypeLabels[property.property_type] ?? property.property_type} />
        )}
      </View>

      {/* Address Details Card */}
      {hasAddress && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Adresse</Text>
          {property.address && <DetailRow label="Straße" value={property.address} />}
          {property.city && <DetailRow label="Stadt" value={property.city} />}
          {property.province && <DetailRow label="Provinz" value={property.province} />}
          {property.postal_code && <DetailRow label="PLZ" value={property.postal_code} />}
          {property.country && <DetailRow label="Land" value={property.country} />}
        </Card>
      )}

      {/* Type & Condition Card */}
      {(property.property_subtype || property.orientation || property.condition || property.floor != null || property.year_built) && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Typ & Zustand</Text>
          {property.property_subtype && <DetailRow label="Untertyp" value={property.property_subtype} />}
          {property.orientation && <DetailRow label="Ausrichtung" value={orientationLabels[property.orientation] ?? property.orientation} />}
          {property.condition && <DetailRow label="Zustand" value={conditionLabels[property.condition] ?? property.condition} />}
          {property.floor != null && <DetailRow label="Etage" value={String(property.floor)} />}
          {property.year_built != null && <DetailRow label="Baujahr" value={String(property.year_built)} />}
        </Card>
      )}

      {/* Features as chips */}
      {featureChips.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Ausstattung</Text>
          <View style={styles.chipContainer}>
            {featureChips.map((chip) => (
              <View key={chip} style={styles.chip}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Legal & Costs Card */}
      {hasLegalInfo && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Rechtliches & Kosten</Text>
          {property.referencia_catastral && <DetailRow label="Katasterreferenz" value={property.referencia_catastral} />}
          {property.ibi_annual != null && <DetailRow label="IBI jährlich" value={formatPrice(property.ibi_annual)} />}
          {property.community_fees_monthly != null && <DetailRow label="Gemeinschaftskosten/Monat" value={formatPrice(property.community_fees_monthly)} />}
          {property.has_mortgage && (
            <>
              <DetailRow label="Hypothek" value="Ja" />
              {property.mortgage_outstanding != null && <DetailRow label="Offene Hypothek" value={formatPrice(property.mortgage_outstanding)} />}
            </>
          )}
          {property.legal_status && <DetailRow label="Rechtsstatus" value={legalStatusLabels[property.legal_status] ?? property.legal_status} />}
          {property.nota_simple_date && <DetailRow label="Nota Simple" value={formatDate(property.nota_simple_date)} />}
        </Card>
      )}

      {/* Rental Info Card */}
      {hasRentalInfo && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Vermietung</Text>
          {property.rental_price != null && <DetailRow label="Mietpreis" value={formatPrice(property.rental_price)} />}
          {property.rental_period && <DetailRow label="Mietzeitraum" value={rentalPeriodLabels[property.rental_period] ?? property.rental_period} />}
          {property.available_from && <DetailRow label="Verfügbar ab" value={formatDate(property.available_from)} />}
          {property.is_rented && <DetailRow label="Aktuell vermietet" value="Ja" />}
          {property.rental_yield != null && <DetailRow label="Mietrendite" value={`${property.rental_yield}%`} />}
        </Card>
      )}

      {/* Description */}
      {property.description && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Beschreibung</Text>
          <Text style={styles.descriptionText}>{property.description}</Text>
        </Card>
      )}

      {/* Notes */}
      {property.notes && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Interne Notizen</Text>
          <Text style={styles.descriptionText}>{property.notes}</Text>
        </Card>
      )}

      {/* Media Management */}
      <Card
        style={styles.section}
        onPress={() =>
          router.push(
            `/(app)/property-media?propertyId=${property.id}&propertyTitle=${encodeURIComponent(property.title)}`,
          )
        }
      >
        <View style={styles.mediaCardRow}>
          <View style={styles.mediaCardLeft}>
            <Ionicons name="images-outline" size={24} color={colors.primary} />
            <View>
              <Text style={styles.sectionTitle}>Medien verwalten</Text>
              <Text style={styles.mediaCardCount}>
                {images?.length ?? 0} Fotos · {documents?.length ?? 0} Dokumente
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Bearbeiten"
          onPress={() => router.push(`/(app)/(tabs)/properties/edit?id=${property.id}`)}
          icon={<Ionicons name="pencil-outline" size={18} color={colors.white} />}
          style={styles.actionButton}
        />
        <Button
          title="Exposé senden"
          onPress={() => {}}
          variant="outline"
          icon={<Ionicons name="document-text-outline" size={18} color={colors.primary} />}
          style={styles.actionButton}
        />
        <Button
          title="Auf Karte anzeigen"
          onPress={handleMaps}
          variant="outline"
          icon={<Ionicons name="map-outline" size={18} color={colors.primary} />}
          style={styles.actionButton}
        />
        <Button
          title="Immobilie löschen"
          onPress={handleDelete}
          variant="danger"
          loading={deleteProperty.isPending}
          icon={<Ionicons name="trash-outline" size={18} color={colors.white} />}
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  headerButton: {
    padding: spacing.sm,
  },
  // Image gallery
  imageSection: {
    height: 250,
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 250,
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
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: colors.white,
  },
  // Title section
  titleSection: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
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
  },
  negotiableText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  addressText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  // Key facts
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
  // Sections
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
  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  // Feature chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: '#065F46',
  },
  // Description
  descriptionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  // Media card
  mediaCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mediaCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mediaCardCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Actions
  actions: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    width: '100%',
  },
});
