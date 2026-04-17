import React, { useRef, useState, useCallback } from 'react';
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
import { WebView } from 'react-native-webview';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProperty, useDeleteProperty } from '../../../../lib/api/properties';
import { usePropertyImages, PropertyImage } from '../../../../lib/api/propertyImages';
import { usePropertyDocuments } from '../../../../lib/api/propertyMedia';
import { supabase } from '../../../../lib/supabase';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { CollapsibleSection } from '../../../../components/ui/CollapsibleSection';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { useI18n } from '../../../../lib/i18n';
import { useQueryClient } from '@tanstack/react-query';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
  available: 'success',
  reserved: 'warning',
  sold: 'error',
  rented: 'info',
  withdrawn: 'default',
};

const statusKeys: Record<string, string> = {
  available: 'propStatus_available',
  reserved: 'propStatus_reserved',
  sold: 'propStatus_sold',
  rented: 'propStatus_rented',
  withdrawn: 'propStatus_withdrawn',
};

const propertyTypeKeys: Record<string, string> = {
  apartment: 'propType_apartment',
  house: 'propType_house',
  villa: 'propType_villa',
  chalet: 'propType_chalet',
  finca: 'propType_finca',
  commercial: 'propType_commercial',
  land: 'propType_land',
  garage: 'propType_garage',
  other: 'propType_other',
};

const orientationKeys: Record<string, string> = {
  north: 'orientation_north',
  south: 'orientation_south',
  east: 'orientation_east',
  west: 'orientation_west',
  southeast: 'orientation_southeast',
  southwest: 'orientation_southwest',
  northeast: 'orientation_northeast',
  northwest: 'orientation_northwest',
};

const conditionKeys: Record<string, string> = {
  new: 'condition_new',
  like_new: 'condition_like_new',
  good: 'condition_good',
  needs_renovation: 'condition_needs_renovation',
  ruin: 'condition_ruin',
};

const heatingTypeKeys: Record<string, string> = {
  electric: 'heating_electric',
  gas: 'heating_gas',
  oil: 'heating_oil',
  heat_pump: 'heating_heat_pump',
  solar: 'heating_solar',
  none: 'heating_none',
};

const legalStatusKeys: Record<string, string> = {
  free: 'legalStatus_free',
  occupied: 'legalStatus_occupied',
  tenant: 'legalStatus_tenant',
  legal_dispute: 'legalStatus_legal_dispute',
};

const rentalPeriodKeys: Record<string, string> = {
  monthly: 'rentalPeriod_monthly',
  weekly: 'rentalPeriod_weekly',
  daily: 'rentalPeriod_daily',
};

const offerTypeKeys: Record<string, string> = {
  sale: 'offerType_sale',
  rent: 'offerType_rent',
};

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: property, isLoading, refetch, isRefetching } = useProperty(id!);
  const { data: images } = usePropertyImages(id!);
  const { data: documents } = usePropertyDocuments(id!);
  const deleteProperty = useDeleteProperty();
  const queryClient = useQueryClient();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { t, formatPrice, formatDate } = useI18n();

  const updateImageSortOrder = useCallback(
    async (imagesList: PropertyImage[], fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= imagesList.length) return;
      try {
        const updates = imagesList.map((img, i) => {
          let newOrder = i;
          if (i === fromIndex) newOrder = toIndex;
          else if (fromIndex < toIndex && i > fromIndex && i <= toIndex) newOrder = i - 1;
          else if (fromIndex > toIndex && i >= toIndex && i < fromIndex) newOrder = i + 1;
          return { id: img.id, sort_order: newOrder };
        });
        for (const u of updates) {
          const { error } = await supabase
            .from('property_images')
            .update({ sort_order: u.sort_order })
            .eq('id', u.id);
          if (error) throw error;
        }
        queryClient.invalidateQueries({ queryKey: ['property-images', id] });
      } catch {
        Alert.alert(t('error'), t('prop_reorderError'));
      }
    },
    [id, queryClient, t],
  );

  const setAsPrimary = useCallback(
    async (imageId: string) => {
      try {
        // Unset all covers first
        const { error: resetError } = await supabase
          .from('property_images')
          .update({ is_cover: false })
          .eq('property_id', id!);
        if (resetError) throw resetError;
        // Set the selected as cover
        const { error } = await supabase
          .from('property_images')
          .update({ is_cover: true })
          .eq('id', imageId);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['property-images', id] });
      } catch {
        Alert.alert(t('error'), t('prop_reorderError'));
      }
    },
    [id, queryClient, t],
  );

  if (isLoading) return <LoadingScreen />;

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerTitle: t('tab_properties'), headerShown: true }} />
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{t('properties_notFound')}</Text>
      </View>
    );
  }

  const statusKey = statusKeys[property.status ?? ''];
  const status = {
    label: statusKey ? t(statusKey) : (property.status ?? ''),
    variant: statusVariants[property.status ?? ''] ?? ('default' as const),
  };

  const tKey = (map: Record<string, string>, val: string | null | undefined) => {
    if (!val) return '';
    const key = map[val];
    return key ? t(key) : val;
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
      t('properties_delete'),
      t('properties_deleteConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteProperty.mutate(property.id, {
              onSuccess: () => router.back(),
              onError: () => Alert.alert(t('error'), t('properties_deleteError')),
            });
          },
        },
      ],
    );
  };

  // Collect active features as chips
  const featureChips: string[] = [];
  if (property.has_elevator) featureChips.push(t('feature_elevator'));
  if (property.has_parking) featureChips.push(t('feature_parking'));
  if (property.has_pool) featureChips.push(t('feature_pool'));
  if (property.has_garden) featureChips.push(property.garden_m2 ? `${t('feature_garden')} (${property.garden_m2} m²)` : t('feature_garden'));
  if (property.is_furnished) featureChips.push(t('feature_furnished'));
  if (property.has_garage) featureChips.push(property.garage_spaces ? `${t('feature_garage')} (${property.garage_spaces})` : t('feature_garage'));
  if (property.has_terrace) featureChips.push(property.terrace_m2 ? `${t('feature_terrace')} (${property.terrace_m2} m²)` : t('feature_terrace'));
  if (property.has_ac) featureChips.push(t('feature_ac'));
  if (property.has_heating) featureChips.push(property.heating_type ? `${t('feature_heating')} (${tKey(heatingTypeKeys, property.heating_type)})` : t('feature_heating'));
  if (property.has_storage) featureChips.push(t('feature_storage'));
  if (property.has_sea_view) featureChips.push(t('feature_seaView'));

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
            <Text style={styles.imagePlaceholderText}>{t('properties_noImage')}</Text>
          </View>
        </View>
      )}

      {/* Image Reorder Controls */}
      {images && images.length > 1 && (
        <View style={styles.imageReorderRow}>
          <TouchableOpacity
            style={[styles.reorderButton, activeImageIndex === 0 && styles.reorderButtonDisabled]}
            onPress={() => {
              if (activeImageIndex > 0) {
                updateImageSortOrder(images, activeImageIndex, activeImageIndex - 1);
              }
            }}
            disabled={activeImageIndex === 0}
          >
            <Ionicons name="arrow-back" size={16} color={activeImageIndex === 0 ? colors.textTertiary : colors.primary} />
            <Text style={[styles.reorderButtonText, activeImageIndex === 0 && styles.reorderButtonTextDisabled]}>
              {t('prop_moveUp')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reorderButton}
            onPress={() => {
              if (images[activeImageIndex]) {
                setAsPrimary(images[activeImageIndex].id);
              }
            }}
          >
            <Ionicons name="star" size={16} color={colors.primary} />
            <Text style={styles.reorderButtonText}>{t('prop_setPrimary')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reorderButton, activeImageIndex === images.length - 1 && styles.reorderButtonDisabled]}
            onPress={() => {
              if (activeImageIndex < images.length - 1) {
                updateImageSortOrder(images, activeImageIndex, activeImageIndex + 1);
              }
            }}
            disabled={activeImageIndex === images.length - 1}
          >
            <Text style={[styles.reorderButtonText, activeImageIndex === images.length - 1 && styles.reorderButtonTextDisabled]}>
              {t('prop_moveDown')}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={activeImageIndex === images.length - 1 ? colors.textTertiary : colors.primary} />
          </TouchableOpacity>
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
          <Text style={styles.negotiableText}>{t('properties_negotiable')}</Text>
        )}
        {property.offer_type && (
          <Badge
            label={tKey(offerTypeKeys, property.offer_type)}
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
          <FactItem icon="resize-outline" label={t('propDetail_area')} value={`${property.size_m2} m²`} />
        )}
        {property.rooms != null && (
          <FactItem icon="bed-outline" label={t('propDetail_rooms')} value={String(property.rooms)} />
        )}
        {property.bathrooms != null && (
          <FactItem icon="water-outline" label={t('propDetail_bathrooms')} value={String(property.bathrooms)} />
        )}
        {property.property_type && (
          <FactItem icon="home-outline" label={t('propDetail_type')} value={tKey(propertyTypeKeys, property.property_type)} />
        )}
      </View>

      {/* Address Details Card */}
      {hasAddress && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('propSection_address')}</Text>
          {property.address && <DetailRow label={t('propDetail_street')} value={property.address} />}
          {property.city && <DetailRow label={t('propDetail_city')} value={property.city} />}
          {property.province && <DetailRow label={t('propDetail_province')} value={property.province} />}
          {property.postal_code && <DetailRow label={t('propDetail_postalCode')} value={property.postal_code} />}
          {property.country && <DetailRow label={t('propDetail_country')} value={property.country} />}
        </Card>
      )}

      {/* Owner Section */}
      {((property as any).owner_name || (property as any).owner_phone || (property as any).owner_email) && (
        <View style={styles.ownerSectionWrapper}>
          <CollapsibleSection title={t('prop_ownerSection')}>
            {(property as any).owner_name && (
              <DetailRow label={t('prop_ownerName')} value={(property as any).owner_name} />
            )}
            {(property as any).owner_phone && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${(property as any).owner_phone}`)}
              >
                <DetailRow label={t('prop_ownerPhone')} value={(property as any).owner_phone} />
              </TouchableOpacity>
            )}
            {(property as any).owner_email && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:${(property as any).owner_email}`)}
              >
                <DetailRow label={t('prop_ownerEmail')} value={(property as any).owner_email} />
              </TouchableOpacity>
            )}
          </CollapsibleSection>
        </View>
      )}

      {/* Geocoding Mini-Map */}
      {property.latitude != null && property.longitude != null && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('prop_geocodingPreview')}</Text>
          <View style={styles.miniMapContainer}>
            <WebView
              originWhitelist={['*']}
              source={{
                html: `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>body{margin:0}#map{width:100%;height:100vh}</style>
</head><body>
<div id="map"></div>
<script>
var map = L.map('map').setView([${property.latitude}, ${property.longitude}], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'OSM'}).addTo(map);
L.marker([${property.latitude}, ${property.longitude}]).addTo(map).bindPopup('${property.title.replace(/'/g, "\\'")}');
</script></body></html>`,
              }}
              style={styles.miniMapWebView}
              javaScriptEnabled
              scrollEnabled={false}
            />
          </View>
        </Card>
      )}

      {/* Type & Condition Card */}
      {(property.property_subtype || property.orientation || property.condition || property.floor != null || property.year_built) && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('propSection_typeCondition')}</Text>
          {property.property_subtype && <DetailRow label={t('prop_subtype')} value={property.property_subtype} />}
          {property.orientation && <DetailRow label={t('prop_orientation')} value={tKey(orientationKeys, property.orientation)} />}
          {property.condition && <DetailRow label={t('prop_condition')} value={tKey(conditionKeys, property.condition)} />}
          {property.floor != null && <DetailRow label={t('prop_floor')} value={String(property.floor)} />}
          {property.year_built != null && <DetailRow label={t('prop_yearBuilt')} value={String(property.year_built)} />}
        </Card>
      )}

      {/* Features as chips */}
      {featureChips.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('propSection_features')}</Text>
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
          <Text style={styles.sectionTitle}>{t('propSection_legal')}</Text>
          {property.referencia_catastral && <DetailRow label={t('legal_cadastralRef')} value={property.referencia_catastral} />}
          {property.ibi_annual != null && <DetailRow label={t('legal_ibiAnnual')} value={formatPrice(property.ibi_annual)} />}
          {property.community_fees_monthly != null && <DetailRow label={t('legal_communityFees')} value={formatPrice(property.community_fees_monthly)} />}
          {property.has_mortgage && (
            <>
              <DetailRow label={t('legal_mortgage')} value={t('yes')} />
              {property.mortgage_outstanding != null && <DetailRow label={t('legal_mortgageOutstanding')} value={formatPrice(property.mortgage_outstanding)} />}
            </>
          )}
          {property.legal_status && <DetailRow label={t('legal_legalStatus')} value={tKey(legalStatusKeys, property.legal_status)} />}
          {property.nota_simple_date && <DetailRow label={t('legal_notaSimple')} value={formatDate(property.nota_simple_date)} />}
        </Card>
      )}

      {/* Rental Info Card */}
      {hasRentalInfo && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('propSection_rental')}</Text>
          {property.rental_price != null && <DetailRow label={t('rental_price')} value={formatPrice(property.rental_price)} />}
          {property.rental_period && <DetailRow label={t('rental_period')} value={tKey(rentalPeriodKeys, property.rental_period)} />}
          {property.available_from && <DetailRow label={t('rental_availableFrom')} value={formatDate(property.available_from)} />}
          {property.is_rented && <DetailRow label={t('rental_currentlyRented')} value={t('yes')} />}
          {property.rental_yield != null && <DetailRow label={t('rental_yield')} value={`${property.rental_yield}%`} />}
        </Card>
      )}

      {/* Description */}
      {property.description && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('propDetail_description')}</Text>
          <Text style={styles.descriptionText}>{property.description}</Text>
        </Card>
      )}

      {/* Notes */}
      {property.notes && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('propDetail_internalNotes')}</Text>
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
              <Text style={styles.sectionTitle}>{t('media_title')}</Text>
              <Text style={styles.mediaCardCount}>
                {t('media_photoCount', { count: images?.length ?? 0 })} · {t('media_docCount', { count: documents?.length ?? 0 })}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={t('edit')}
          onPress={() => router.push(`/(app)/(tabs)/properties/edit?id=${property.id}`)}
          icon={<Ionicons name="pencil-outline" size={18} color={colors.white} />}
          style={styles.actionButton}
        />
        <Button
          title={t('properties_sendExpose')}
          onPress={() => {}}
          variant="outline"
          icon={<Ionicons name="document-text-outline" size={18} color={colors.primary} />}
          style={styles.actionButton}
        />
        <Button
          title={t('properties_showOnMap')}
          onPress={handleMaps}
          variant="outline"
          icon={<Ionicons name="map-outline" size={18} color={colors.primary} />}
          style={styles.actionButton}
        />
        <Button
          title={t('properties_delete')}
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
  // Owner section
  ownerSectionWrapper: {
    marginHorizontal: spacing.md,
  },
  // Mini-map
  miniMapContainer: {
    height: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  miniMapWebView: {
    flex: 1,
  },
  // Image reorder
  imageReorderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  reorderButtonDisabled: {
    opacity: 0.4,
  },
  reorderButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  reorderButtonTextDisabled: {
    color: colors.textTertiary,
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
