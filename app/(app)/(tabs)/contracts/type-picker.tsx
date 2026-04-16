import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CONTRACT_TYPE_CONFIG } from '../../../../lib/contracts/config';
import { SearchBar } from '../../../../components/ui/SearchBar';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';
import { useI18n } from '../../../../lib/i18n';

const CONTRACT_TYPES = Object.keys(CONTRACT_TYPE_CONFIG);

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  seller_broker: 'home-outline',
  landlord_broker: 'key-outline',
  buyer_search: 'search-outline',
  tenant_search: 'search-outline',
  purchase_contract: 'cart-outline',
  investor_search: 'trending-up-outline',
  rental_contract: 'bed-outline',
  commercial_search: 'storefront-outline',
  power_of_attorney: 'shield-outline',
  proof_contract: 'checkmark-circle-outline',
  brokerage_contract: 'swap-horizontal-outline',
  rental_brokerage: 'key-outline',
  reservation: 'bookmark-outline',
  commission: 'cash-outline',
  expose_release: 'image-outline',
  withdrawal: 'return-down-back-outline',
  privacy: 'lock-closed-outline',
  viewing_protocol: 'eye-outline',
  handover_protocol: 'hand-left-outline',
  other: 'document-outline',
  freelancer_contract: 'person-outline',
  employment_contract: 'briefcase-outline',
  cooperation_agreement: 'people-outline',
  document_authorization: 'document-attach-outline',
};

export default function ContractTypePickerScreen() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  const filteredTypes = CONTRACT_TYPES.filter((key) => {
    if (!search || search.length < 2) return true;
    const label = t(`contractType_${key}`);
    return label.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = (typeKey: string) => {
    router.push({
      pathname: '/(app)/(tabs)/contracts/create',
      params: { type: typeKey },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('contracts_selectType'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('contracts_search')}
        />
      </View>

      <FlatList
        data={filteredTypes}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const label = t(`contractType_${item}`);
          const icon = TYPE_ICONS[item] || 'document-outline';
          return (
            <TouchableOpacity
              style={styles.typeCard}
              activeOpacity={0.7}
              onPress={() => handleSelect(item)}
            >
              <View style={styles.typeIcon}>
                <Ionicons name={icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.typeLabel} numberOfLines={2}>
                {label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          );
        }}
      />
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
    paddingBottom: 40,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadow.sm,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
});
