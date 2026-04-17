import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProperties, Property } from '../../../../lib/api/properties';
import { usePropertyImages, getCoverImage } from '../../../../lib/api/propertyImages';
import { useSubscription } from '../../../../lib/api/subscription';
import { SearchBar } from '../../../../components/ui/SearchBar';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { useI18n } from '../../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';

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

function PropertyCardImage({ propertyId }: { propertyId: string }) {
  const { data: images } = usePropertyImages(propertyId);
  const cover = images ? getCoverImage(images) : undefined;

  if (cover) {
    return (
      <Image source={{ uri: cover.url }} style={styles.coverImage} resizeMode="cover" />
    );
  }

  return (
    <View style={styles.imagePlaceholder}>
      <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
    </View>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const { t, formatPrice } = useI18n();
  const statusKey = statusKeys[property.status ?? ''];
  const status = {
    label: statusKey ? t(statusKey) : (property.status ?? t('unknown')),
    variant: statusVariants[property.status ?? ''] ?? ('default' as const),
  };

  return (
    <Card
      style={styles.propertyCard}
      padded={false}
      onPress={() => router.push(`/(app)/(tabs)/properties/${property.id}`)}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <PropertyCardImage propertyId={property.id} />
        <View style={styles.badgeOverlay}>
          <Badge label={status.label} variant={status.variant} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.propertyContent}>
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {property.title}
        </Text>
        {property.address && (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.addressText} numberOfLines={1}>
              {property.address}
              {property.city ? `, ${property.city}` : ''}
            </Text>
          </View>
        )}
        <View style={styles.statsRow}>
          <Text style={styles.priceText}>{formatPrice(property.price)}</Text>
          <View style={styles.propertyMeta}>
            {property.size_m2 && (
              <Text style={styles.metaText}>{property.size_m2} m²</Text>
            )}
            {property.rooms && (
              <Text style={styles.metaText}>{property.rooms} {t('properties_rooms')}</Text>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

export default function PropertiesListScreen() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { t, formatPrice } = useI18n();
  const {
    data: properties,
    isLoading,
    refetch,
    isRefetching,
  } = useProperties(search);
  const { data: subscription } = useSubscription();

  const used = properties?.length ?? 0;
  const total = subscription?.limits?.properties ?? 0;

  const markersData = useMemo(() => {
    if (!properties) return [];
    return properties
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => ({
        lat: p.latitude!,
        lng: p.longitude!,
        title: p.title.replace(/'/g, "\\'"),
        price: formatPrice(p.price).replace(/'/g, "\\'"),
      }));
  }, [properties, formatPrice]);

  const mapHtml = `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>body{margin:0}#map{width:100%;height:100vh}</style>
</head><body>
<div id="map"></div>
<script>
var map = L.map('map').setView([36.5, -4.9], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'OSM'}).addTo(map);
var markers = ${JSON.stringify(markersData)};
markers.forEach(function(m){
  L.marker([m.lat,m.lng]).addTo(map).bindPopup('<b>'+m.title+'</b><br>'+m.price);
});
if(markers.length>0){var g=L.featureGroup(markers.map(function(m){return L.marker([m.lat,m.lng])}));map.fitBounds(g.getBounds().pad(0.1));}
</script></body></html>`;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('properties_title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('properties_search')}
        />
      </View>

      {/* View Toggle & Limit Counter */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleButtons}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="list-outline"
              size={16}
              color={viewMode === 'list' ? colors.white : colors.primary}
            />
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              {t('prop_listView')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
            onPress={() => setViewMode('map')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="map-outline"
              size={16}
              color={viewMode === 'map' ? colors.white : colors.primary}
            />
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
              {t('prop_mapView')}
            </Text>
          </TouchableOpacity>
        </View>
        {total > 0 && (
          <Text style={styles.limitText}>
            {t('prop_limitCounter', { used, total })}
          </Text>
        )}
      </View>

      {isLoading ? (
        <LoadingScreen />
      ) : viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.mapWebView}
            javaScriptEnabled
          />
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title={t('properties_empty')}
              message={
                search
                  ? t('properties_emptySearch')
                  : t('properties_emptyDefault')
              }
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/(app)/(tabs)/properties/create')}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  toggleButtons: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  toggleTextActive: {
    color: colors.white,
  },
  limitText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  mapContainer: {
    flex: 1,
  },
  mapWebView: {
    flex: 1,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  propertyCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOverlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  propertyContent: {
    padding: spacing.md,
  },
  propertyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  addressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  priceText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  propertyMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
});
