import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';
import {
  ALL_PROPERTY_TYPES,
  PROPERTY_PROFILES,
} from '../../lib/valuation/property-types';
import type { PropertyType } from '../../lib/valuation/types';

interface PropertyTypePickerProps {
  value?: PropertyType;
  onChange: (t: PropertyType) => void;
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  apartment: 'business-outline',
  house: 'home-outline',
  storefront: 'storefront-outline',
  office: 'briefcase-outline',
  warehouse: 'cube-outline',
  'land-urban': 'grid-outline',
  'land-rural': 'leaf-outline',
  'building-residential': 'business',
  hotel: 'bed-outline',
  garage: 'car-outline',
  'building-mixed': 'layers-outline',
  question: 'help-circle-outline',
};

export function PropertyTypePicker({ value, onChange }: PropertyTypePickerProps) {
  return (
    <View style={styles.grid}>
      {ALL_PROPERTY_TYPES.map((type) => {
        const profile = PROPERTY_PROFILES[type];
        const selected = value === type;
        const iconName = ICON_MAP[profile.icon] || 'help-circle-outline';
        return (
          <View key={type} style={styles.cell}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onChange(type)}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <Ionicons
                name={iconName}
                size={28}
                color={selected ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[styles.labelEs, selected && styles.labelEsSelected]}
                numberOfLines={2}
              >
                {/* TODO i18n */ profile.labels.es}
              </Text>
              <Text style={styles.labelDe} numberOfLines={1}>
                {profile.labels.de}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  cell: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 110,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.successLight,
  },
  labelEs: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  labelEsSelected: {
    color: colors.primary,
  },
  labelDe: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
});
