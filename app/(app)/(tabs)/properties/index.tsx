import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProperties, Property } from '../../../../lib/api/properties';
import { usePropertyImages, getCoverImage } from '../../../../lib/api/propertyImages';
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
  const { t } = useI18n();
  const {
    data: properties,
    isLoading,
    refetch,
    isRefetching,
  } = useProperties(search);

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

      {isLoading ? (
        <LoadingScreen />
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
