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
  Switch,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useProperty,
  useDeleteProperty,
  usePropertyListing,
  useTogglePublish,
} from '../../../../lib/api/properties';
import {
  useConfiguredPortals,
  usePropertyPortalStatus,
  useTogglePortalPublishing,
  PORTAL_GROUPS,
  PORTAL_META,
} from '../../../../lib/api/portalPublishing';
import { usePropertyImages, PropertyImage } from '../../../../lib/api/propertyImages';
import {
  usePropertyDocuments,
  useUploadPropertyDocument,
  useDeletePropertyDocument,
  PropertyDocument,
  DOCUMENT_TYPE_LABELS,
} from '../../../../lib/api/propertyMedia';
import { supabase } from '../../../../lib/supabase';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { CollapsibleSection } from '../../../../components/ui/CollapsibleSection';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { DocumentManager } from '../../../../components/properties/DocumentManager';
import { OwnershipSection } from '../../../../components/properties/OwnershipSection';
import { useI18n } from '../../../../lib/i18n';
import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Lookup maps ────────────────────────────────────────────────────

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
  available: 'success',
  reserved: 'warning',
  sold: 'error',
  rented: 'info',
  withdrawn: 'default',
  draft: 'default',
};

const statusKeys: Record<string, string> = {
  available: 'status_available',
  reserved: 'status_reserved',
  sold: 'status_sold',
  rented: 'status_rented',
  withdrawn: 'status_withdrawn',
  draft: 'status_draft',
};

const propertyTypeKeys: Record<string, string> = {
  apartment: 'propertyType_apartment',
  house: 'propertyType_house',
  villa: 'propertyType_villa',
  townhouse: 'propertyType_townhouse',
  penthouse: 'propertyType_penthouse',
  studio: 'propertyType_studio',
  duplex: 'propertyType_duplex',
  finca: 'propertyType_finca',
  plot: 'propertyType_plot',
  commercial: 'propertyType_commercial',
  office: 'propertyType_office',
  garage: 'propertyType_garage',
  storage: 'propertyType_storage',
  other: 'propertyType_other',
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

const operationTypeKeys: Record<string, string> = {
  buy: 'operationType_buy',
  sell: 'operationType_sell',
  rent_out: 'operationType_rent_out',
  rent_in: 'operationType_rent_in',
  investment: 'operationType_investment',
};

const energyCertKeys: Record<string, string> = {
  A: 'energyCert_A',
  B: 'energyCert_B',
  C: 'energyCert_C',
  D: 'energyCert_D',
  E: 'energyCert_E',
  F: 'energyCert_F',
  G: 'energyCert_G',
  pending: 'energyCert_pending',
  exempt: 'energyCert_exempt',
};

// ─── Completeness score ─────────────────────────────────────────────

function computeCompleteness(p: any): { score: number; missing: string[] } {
  const fields: [string, string, number][] = [
    ['title', 'prop_title', 5],
    ['property_type', 'prop_type', 5],
    ['offer_type', 'prop_offerType', 3],
    ['status', 'prop_status', 3],
    ['price', 'prop_price', 8],
    ['size_m2', 'prop_area', 6],
    ['rooms', 'prop_rooms', 5],
    ['bathrooms', 'prop_bathrooms', 4],
    ['address', 'prop_street', 5],
    ['city', 'prop_city', 4],
    ['province', 'prop_province', 2],
    ['postal_code', 'prop_postalCode', 2],
    ['description', 'prop_description', 8],
    ['condition', 'prop_condition', 3],
    ['year_built', 'prop_yearBuilt', 3],
    ['floor', 'prop_floor', 2],
    ['orientation', 'prop_orientation', 2],
    ['energy_certificate', 'prop_energyCertificate', 4],
    ['referencia_catastral', 'legal_cadastralRef', 3],
    ['ibi_annual', 'legal_ibiAnnual', 2],
    ['community_fees_monthly', 'legal_communityFees', 2],
    ['latitude', 'prop_geocodingPreview', 3],
    ['owner_name', 'prop_ownerName', 4],
    ['owner_phone', 'prop_ownerPhone', 3],
    ['notes', 'prop_internalNotes', 3],
    ['plot_size_m2', 'prop_plotSize', 2],
    ['built_size_m2', 'prop_builtSize', 2],
    ['useful_size_m2', 'prop_usefulSize', 1],
  ];
  let total = 0;
  let filled = 0;
  const missing: string[] = [];
  for (const [field, key, weight] of fields) {
    total += weight;
    const val = p[field];
    if (val !== null && val !== undefined && val !== '') {
      filled += weight;
    } else {
      missing.push(key);
    }
  }
  return { score: total > 0 ? Math.round((filled / total) * 100) : 0, missing };
}

// ─── Main Component ─────────────────────────────────────────────────

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: property, isLoading, refetch, isRefetching } = useProperty(id!);
  const { data: images } = usePropertyImages(id!);
  const { data: documents } = usePropertyDocuments(id!);
  const { data: listing } = usePropertyListing(id!);
  const deleteProperty = useDeleteProperty();
  const togglePublish = useTogglePublish();
  const { data: portalConfigs } = useConfiguredPortals();
  const { data: portalStatuses } = usePropertyPortalStatus(id!);
  const togglePortalPublishing = useTogglePortalPublishing();
  const uploadDocument = useUploadPropertyDocument();
  const deleteDocument = useDeletePropertyDocument();
  const queryClient = useQueryClient();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { t, formatPrice, formatDate, locale } = useI18n();

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
        const { error: resetError } = await supabase
          .from('property_images')
          .update({ is_cover: false })
          .eq('property_id', id!);
        if (resetError) throw resetError;
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

  const handleUploadDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      uploadDocument.mutate({
        propertyId: id!,
        uri: file.uri,
        fileName: file.name,
        fileSize: file.size ?? null,
        mimeType: file.mimeType ?? 'application/octet-stream',
        documentType: 'other',
      });
    } catch {
      Alert.alert(t('error'), t('propDocs_uploadError'));
    }
  }, [id, uploadDocument, t]);

  const getSignedUrl = useCallback(async (doc: PropertyDocument): Promise<string> => {
    if (doc.signed_url) return doc.signed_url;
    const { data, error } = await supabase.storage
      .from('property-documents')
      .createSignedUrl(doc.storage_path, 3600);
    if (error) throw new Error(error.message);
    if (!data?.signedUrl) throw new Error('Could not generate URL');
    return data.signedUrl;
  }, []);

  const openDocument = useCallback(async (doc: PropertyDocument) => {
    try {
      const url = await getSignedUrl(doc);
      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert(t('error'), err.message || 'Could not open document');
    }
  }, [getSignedUrl, t]);

  const shareDocument = useCallback(async (doc: PropertyDocument) => {
    try {
      const url = await getSignedUrl(doc);
      const fileUri = FileSystem.cacheDirectory + doc.file_name;
      await FileSystem.downloadAsync(url, fileUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (err: any) {
      Alert.alert(t('error'), err.message || 'Could not share document');
    }
  }, [getSignedUrl, t]);

  const handleDeleteDocument = useCallback(
    (doc: PropertyDocument) => {
      Alert.alert(t('propDocs_delete'), t('propDocs_deleteConfirm'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () =>
            deleteDocument.mutate({
              documentId: doc.id,
              storagePath: doc.storage_path,
              propertyId: id!,
            }),
        },
      ]);
    },
    [id, deleteDocument, t],
  );

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
    Alert.alert(t('properties_delete'), t('properties_deleteConfirm'), [
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
    ]);
  };

  // Collect active features as chips
  const featureChips: string[] = [];
  if (property.has_elevator) featureChips.push(t('feature_elevator'));
  if (property.has_parking) featureChips.push(property.parking_spaces ? `${t('feature_parking')} (${property.parking_spaces})` : t('feature_parking'));
  if (property.has_pool) featureChips.push(t('feature_pool'));
  if (property.has_garden) featureChips.push(property.garden_m2 ? `${t('feature_garden')} (${property.garden_m2} m²)` : t('feature_garden'));
  if (property.is_furnished) featureChips.push(t('feature_furnished'));
  if (property.has_garage) featureChips.push(property.garage_spaces ? `${t('feature_garage')} (${property.garage_spaces})` : t('feature_garage'));
  if (property.has_terrace) featureChips.push(property.terrace_m2 ? `${t('feature_terrace')} (${property.terrace_m2} m²)` : t('feature_terrace'));
  if (property.has_ac) featureChips.push(t('feature_ac'));
  if (property.has_heating) featureChips.push(property.heating_type ? `${t('feature_heating')} (${tKey(heatingTypeKeys, property.heating_type)})` : t('feature_heating'));
  if (property.has_storage) featureChips.push(t('feature_storage'));
  if (property.has_sea_view) featureChips.push(t('feature_seaView'));
  if (property.has_balcony) featureChips.push(property.balcony_m2 ? `${t('prop_balcony')} (${property.balcony_m2} m²)` : t('prop_balcony'));

  const hasAddress = property.address || property.city || property.province || property.postal_code;
  const hasLegalInfo = property.referencia_catastral || property.ibi_annual || property.community_fees_monthly || property.has_mortgage || property.legal_status || property.nota_simple_date || property.energy_certificate;
  const hasRentalInfo = property.rental_price || property.rental_period || property.available_from || property.is_rented || property.rental_yield;
  const hasLandInfo = property.land_classification || property.land_buildable_m2 || property.terreno_urbano_m2 || property.terreno_agricola_m2 || property.terreno_forestal_m2 || property.terreno_pastizal_m2;
  const hasEstimatedValue = property.estimated_value || property.estimated_value_date || property.estimated_value_method;

  const pricePerM2 = property.price && property.size_m2 ? Math.round(property.price / property.size_m2) : null;
  const { score: completenessScore, missing: completenessMissing } = computeCompleteness(property);


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

      {/* ─── 1. Cover Image Gallery ─────────────────────────────────── */}
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
          {/* Image count overlay */}
          <View style={styles.imageCountBadge}>
            <Ionicons name="images-outline" size={14} color="#fff" />
            <Text style={styles.imageCountText}>{images.length}</Text>
          </View>
          {images.length > 1 && (
            <View style={styles.paginationDots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeImageIndex && styles.dotActive]}
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
              if (activeImageIndex > 0) updateImageSortOrder(images, activeImageIndex, activeImageIndex - 1);
            }}
            disabled={activeImageIndex === 0}
          >
            <Ionicons name="arrow-back" size={16} color={activeImageIndex === 0 ? colors.textTertiary : colors.primary} />
            <Text style={[styles.reorderButtonText, activeImageIndex === 0 && styles.reorderButtonTextDisabled]}>{t('prop_moveUp')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reorderButton} onPress={() => { if (images[activeImageIndex]) setAsPrimary(images[activeImageIndex].id); }}>
            <Ionicons name="star" size={16} color={colors.primary} />
            <Text style={styles.reorderButtonText}>{t('prop_setPrimary')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reorderButton, activeImageIndex === images.length - 1 && styles.reorderButtonDisabled]}
            onPress={() => {
              if (activeImageIndex < images.length - 1) updateImageSortOrder(images, activeImageIndex, activeImageIndex + 1);
            }}
            disabled={activeImageIndex === images.length - 1}
          >
            <Text style={[styles.reorderButtonText, activeImageIndex === images.length - 1 && styles.reorderButtonTextDisabled]}>{t('prop_moveDown')}</Text>
            <Ionicons name="arrow-forward" size={16} color={activeImageIndex === images.length - 1 ? colors.textTertiary : colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* ─── 2. Header: Title, Status, Type, Condition badges ───── */}
      <View style={styles.titleSection}>
        <View style={styles.badgeRow}>
          {status.label ? <Badge label={status.label} variant={status.variant} size="sm" /> : null}
          {property.property_type ? <Badge label={tKey(propertyTypeKeys, property.property_type)} variant="primary" size="sm" /> : null}
          {property.condition ? <Badge label={tKey(conditionKeys, property.condition)} variant="info" size="sm" /> : null}
          {property.offer_type ? <Badge label={tKey(offerTypeKeys, property.offer_type)} variant="default" size="sm" /> : null}
          {property.operation_type ? <Badge label={tKey(operationTypeKeys, property.operation_type)} variant="default" size="sm" /> : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>{property.title}</Text>

        {/* ─── 3. Price with negotiable + price/m² ──────────────── */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(property.price)}</Text>
          {property.price_negotiable && (
            <Badge label={t('prop_priceNegotiable')} variant="warning" size="sm" />
          )}
        </View>
        {pricePerM2 != null && (
          <Text style={styles.pricePerM2}>{t('prop_pricePerM2')}: {formatPrice(pricePerM2)}</Text>
        )}

        {property.address && (
          <TouchableOpacity onPress={handleMaps} style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.addressText}>
              {property.address}{property.city ? `, ${property.city}` : ''}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── 4. Key Facts Row ──────────────────────────────────── */}
      <View style={styles.factsRow}>
        {property.size_m2 != null && <FactItem icon="resize-outline" label={t('propDetail_area')} value={`${property.size_m2} m²`} />}
        {property.rooms != null && <FactItem icon="bed-outline" label={t('propDetail_rooms')} value={String(property.rooms)} />}
        {property.bathrooms != null && <FactItem icon="water-outline" label={t('propDetail_bathrooms')} value={String(property.bathrooms)} />}
        {property.floor != null && <FactItem icon="layers-outline" label={t('prop_floor')} value={String(property.floor)} />}
      </View>

      {/* ─── 5. Completeness Score ─────────────────────────────── */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('completeness_title')}</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${completenessScore}%` }]} />
        </View>
        <Text style={styles.completenessText}>
          {t('completeness_score', { score: String(completenessScore) })}
        </Text>
        {completenessMissing.length > 0 && completenessScore < 100 && (
          <CollapsibleSection title={t('completeness_missing')}>
            <View style={styles.missingFieldsList}>
              {completenessMissing.slice(0, 10).map((key) => (
                <Text key={key} style={styles.missingFieldItem}>• {t(key)}</Text>
              ))}
              {completenessMissing.length > 10 && (
                <Text style={styles.missingFieldItem}>+{completenessMissing.length - 10} ...</Text>
              )}
            </View>
          </CollapsibleSection>
        )}
      </Card>

      {/* ─── 6. Base Data / Dimensions ─────────────────────────── */}
      {(property.plot_size_m2 || property.built_size_m2 || property.useful_size_m2 || property.total_floors || property.year_built) && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('propSection_priceArea')}</Text>
          {property.plot_size_m2 != null && <DetailRow label={t('prop_plotSize')} value={`${property.plot_size_m2} m²`} />}
          {property.built_size_m2 != null && <DetailRow label={t('prop_builtSize')} value={`${property.built_size_m2} m²`} />}
          {property.useful_size_m2 != null && <DetailRow label={t('prop_usefulSize')} value={`${property.useful_size_m2} m²`} />}
          {property.total_floors != null && <DetailRow label={t('prop_totalFloors')} value={String(property.total_floors)} />}
          {property.year_built != null && <DetailRow label={t('prop_yearBuilt')} value={String(property.year_built)} />}
        </Card>
      )}

      {/* ─── 6b. Commission (intern) ─────────────────────────── */}
      {property.commission_percentage != null && (
        <Card style={styles.section}>
          <View style={styles.commissionHeader}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.commissionHeaderText}>
              {t('prop_commission')} ({t('prop_commissionPrivate')})
            </Text>
          </View>
          <View style={styles.commissionRow}>
            <View style={styles.commissionCol}>
              <Text style={styles.commissionValue}>
                {property.commission_percentage.toFixed(2).replace('.', ',')} %
              </Text>
              <Text style={styles.commissionLabel}>{t('prop_commissionAgreed')}</Text>
            </View>
            <View style={styles.commissionCol}>
              <Text style={styles.commissionValue}>
                {property.price != null
                  ? formatPrice(Math.round(property.price * property.commission_percentage / 100))
                  : '–'}
              </Text>
              <Text style={styles.commissionLabel}>{t('prop_commissionCalculated')}</Text>
            </View>
          </View>
        </Card>
      )}

      {/* ─── 7. Address Details ────────────────────────────────── */}
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

      {/* ─── 8. Map Preview ────────────────────────────────────── */}
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

      {/* ─── 9. Features & Dimensions (chips) ─────────────────── */}
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

      {/* ─── 10. Type & Condition (collapsible) ───────────────── */}
      {(property.property_subtype || property.orientation || property.condition || property.energy_certificate) && (
        <View style={styles.collapsibleWrapper}>
          <CollapsibleSection title={t('propSection_typeCondition')}>
            {property.property_subtype && <DetailRow label={t('prop_subtype')} value={property.property_subtype} />}
            {property.orientation && <DetailRow label={t('prop_orientation')} value={tKey(orientationKeys, property.orientation)} />}
            {property.condition && <DetailRow label={t('prop_condition')} value={tKey(conditionKeys, property.condition)} />}
            {property.energy_certificate && <DetailRow label={t('prop_energyCertificate')} value={tKey(energyCertKeys, property.energy_certificate)} />}
          </CollapsibleSection>
        </View>
      )}

      {/* ─── 11. Legal & Costs (collapsible) ──────────────────── */}
      {hasLegalInfo && (
        <View style={styles.collapsibleWrapper}>
          <CollapsibleSection title={t('propSection_legal')}>
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
            {property.energy_certificate && <DetailRow label={t('prop_energyCertificate')} value={tKey(energyCertKeys, property.energy_certificate)} />}
          </CollapsibleSection>
        </View>
      )}

      {/* ─── 12. Rental Info (collapsible) ────────────────────── */}
      {hasRentalInfo && (
        <View style={styles.collapsibleWrapper}>
          <CollapsibleSection title={t('propSection_rental')}>
            {property.rental_price != null && <DetailRow label={t('rental_price')} value={formatPrice(property.rental_price)} />}
            {property.rental_period && <DetailRow label={t('rental_period')} value={tKey(rentalPeriodKeys, property.rental_period)} />}
            {property.available_from && <DetailRow label={t('rental_availableFrom')} value={formatDate(property.available_from)} />}
            {property.is_rented && <DetailRow label={t('rental_currentlyRented')} value={t('yes')} />}
            {property.rental_yield != null && <DetailRow label={t('rental_yield')} value={`${property.rental_yield}%`} />}
          </CollapsibleSection>
        </View>
      )}

      {/* ─── 13. Land Breakdown (collapsible) ─────────────────── */}
      {hasLandInfo && (
        <View style={styles.collapsibleWrapper}>
          <CollapsibleSection title={t('propSection_land')}>
            {property.land_classification && <DetailRow label={t('land_classification')} value={property.land_classification} />}
            {property.land_buildable_m2 != null && <DetailRow label={t('land_buildable')} value={`${property.land_buildable_m2} m²`} />}
            {property.terreno_urbano_m2 != null && <DetailRow label={t('land_terreno_urbano')} value={`${property.terreno_urbano_m2} m²`} />}
            {property.terreno_agricola_m2 != null && <DetailRow label={t('land_terreno_agricola')} value={`${property.terreno_agricola_m2} m²`} />}
            {property.terreno_forestal_m2 != null && <DetailRow label={t('land_terreno_forestal')} value={`${property.terreno_forestal_m2} m²`} />}
            {property.terreno_pastizal_m2 != null && <DetailRow label={t('land_terreno_pastizal')} value={`${property.terreno_pastizal_m2} m²`} />}
          </CollapsibleSection>
        </View>
      )}

      {/* ─── 14. Description ──────────────────────────────────── */}
      {property.description && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('propDetail_description')}</Text>
          <Text style={styles.descriptionText}>{property.description}</Text>
        </Card>
      )}

      {/* ─── 15. Internal Notes ───────────────────────────────── */}
      {property.notes && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('propDetail_internalNotes')}</Text>
          <Text style={styles.descriptionText}>{property.notes}</Text>
        </Card>
      )}

      {/* ─── 16. Estimated Value ──────────────────────────────── */}
      {hasEstimatedValue ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('estimatedValue_title')}</Text>
          {property.estimated_value != null && <DetailRow label={t('estimatedValue_value')} value={formatPrice(property.estimated_value)} />}
          {property.estimated_value_date && <DetailRow label={t('estimatedValue_date')} value={formatDate(property.estimated_value_date)} />}
          {property.estimated_value_method && <DetailRow label={t('estimatedValue_method')} value={property.estimated_value_method} />}
        </Card>
      ) : (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('estimatedValue_title')}</Text>
          <Text style={styles.emptyText}>{t('estimatedValue_noValue')}</Text>
        </Card>
      )}

      {/* ─── 17. Documents (inline) ───────────────────────────── */}
      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('propDocs_title')}</Text>
          <TouchableOpacity onPress={handleUploadDocument} style={styles.uploadButton}>
            {uploadDocument.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                <Text style={styles.uploadButtonText}>{t('propDocs_upload')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docCardInfo}>
                <Ionicons name="attach" size={20} color={colors.primary} />
                <View style={styles.docCardText}>
                  <Text style={styles.docCardName} numberOfLines={1}>{doc.file_name}</Text>
                  <Text style={styles.docCardMeta}>
                    {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                    {' · '}
                    {new Date(doc.created_at).toLocaleDateString()}
                    {doc.file_size ? ` · ${formatFileSize(doc.file_size)}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.docCardActions}>
                <TouchableOpacity style={styles.docCardActionBtn} onPress={() => openDocument(doc)}>
                  <Ionicons name="open-outline" size={18} color={colors.primary} />
                  <Text style={styles.docCardActionLabel}>{t('propDocs_open')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.docCardActionBtn} onPress={() => shareDocument(doc)}>
                  <Ionicons name="share-outline" size={18} color={colors.primary} />
                  <Text style={styles.docCardActionLabel}>{t('propDocs_share')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.docCardActionBtn} onPress={() => handleDeleteDocument(doc)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text style={[styles.docCardActionLabel, { color: colors.error }]}>{t('propDocs_delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t('propDocs_empty')}</Text>
        )}
      </Card>

      {/* ─── 17b. Document Manager (Checklist + Portal) ─────── */}
      <DocumentManager
        propertyId={String(property.id)}
        propertyName={property.title}
        propertyAddress={property.address ? `${property.address}${property.city ? `, ${property.city}` : ''}` : undefined}
      />

      {/* ─── 18. Media Management Card ────────────────────────── */}
      <Card
        style={styles.section}
        onPress={() =>
          router.push(`/(app)/property-media?propertyId=${property.id}&propertyTitle=${encodeURIComponent(property.title)}`)
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

      {/* ─── 19. Ownership Section ────────────────────────────── */}
      <OwnershipSection propertyId={property.id} />

      {/* ─── 20. Portal Publishing ────────────────────────────── */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('portals_title')}</Text>
        {!portalConfigs || portalConfigs.length === 0 ? (
          <View>
            <Text style={styles.emptyText}>{t('portals_none')}</Text>
            <Text style={[styles.emptyText, { marginTop: spacing.xs }]}>{t('portals_configureHint')}</Text>
          </View>
        ) : (
          PORTAL_GROUPS.map((group) => {
            const configuredInGroup = group.portals.filter((p) =>
              portalConfigs.some((c) => c.portal === p)
            );
            if (configuredInGroup.length === 0) return null;
            return (
              <View key={group.label.en} style={styles.portalGroup}>
                <Text style={styles.portalGroupLabel}>{group.label[locale]}</Text>
                {configuredInGroup.map((portal) => {
                  const meta = PORTAL_META[portal];
                  const status = portalStatuses?.find((s) => s.portal === portal);
                  const isPublished = status?.is_published ?? false;
                  return (
                    <View key={portal} style={styles.portalRow}>
                      <View style={styles.portalInfo}>
                        <View style={[styles.portalDot, { backgroundColor: meta.color }]} />
                        <Text style={styles.portalName}>{meta.name}</Text>
                      </View>
                      <Switch
                        value={isPublished}
                        onValueChange={(value) =>
                          togglePortalPublishing.mutate({
                            propertyId: property.id,
                            portal,
                            publish: value,
                          })
                        }
                        trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                        thumbColor={isPublished ? colors.primary : colors.textTertiary}
                      />
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </Card>

      {/* ─── 21. Metadata ─────────────────────────────────────── */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('metadata_title')}</Text>
        <DetailRow label={t('metadata_id')} value={property.id} />
        {property.created_at && <DetailRow label={t('metadata_createdAt')} value={formatDate(property.created_at)} />}
        {property.updated_at && <DetailRow label={t('metadata_updatedAt')} value={formatDate(property.updated_at)} />}
        {property.created_by && <DetailRow label={t('metadata_createdBy')} value={property.created_by} />}
        {property.assigned_to && <DetailRow label={t('metadata_assignedTo')} value={property.assigned_to} />}
      </Card>

      {/* ─── Actions ──────────────────────────────────────────── */}
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

// ─── Helper Components ──────────────────────────────────────────────

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
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 200,
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
  imageCountBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageCountText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
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
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  pricePerM2: {
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
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
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  // Completeness
  progressBarBg: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  completenessText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  missingFieldsList: {
    marginTop: spacing.xs,
  },
  missingFieldItem: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    paddingVertical: 1,
  },
  // Commission card
  commissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  commissionHeaderText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  commissionCol: {
    alignItems: 'center',
    gap: 2,
  },
  commissionValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  commissionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  // Collapsible wrapper
  collapsibleWrapper: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
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
  // Documents
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  docCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  docCardText: {
    flex: 1,
    marginLeft: 10,
  },
  docCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  docCardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  docCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  docCardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  docCardActionLabel: {
    fontSize: 13,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Publish
  publishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  publishDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  // Portal publishing
  portalGroup: {
    marginBottom: spacing.sm,
  },
  portalGroupLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  portalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  portalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  portalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  portalName: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  // Ownership
  legacyOwnerSection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  ownersList: {
    gap: spacing.sm,
  },
  ownerCard: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  ownerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  ownerPercentage: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  ownerContact: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: 2,
  },
  ownerWarning: {
    fontSize: fontSize.xs,
    color: colors.error,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
  addOwnerForm: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  ownerInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
    backgroundColor: colors.background,
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
