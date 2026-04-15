import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useProperty, useUpdateProperty } from '../../../../lib/api/properties';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { FormToggle } from '../../../../components/ui/FormToggle';
import { Button } from '../../../../components/ui/Button';
import { CollapsibleSection } from '../../../../components/ui/CollapsibleSection';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { useI18n } from '../../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight } from '../../../../constants/theme';

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id!);
  const updateProperty = useUpdateProperty();
  const { t } = useI18n();

  const typeOptions = [
    { value: 'apartment', label: t('propType_apartment') },
    { value: 'house', label: t('propType_house') },
    { value: 'villa', label: t('propType_villa') },
    { value: 'chalet', label: t('propType_chalet') },
    { value: 'finca', label: t('propType_finca') },
    { value: 'commercial', label: t('propType_commercial') },
    { value: 'land', label: t('propType_land') },
    { value: 'garage', label: t('propType_garage') },
    { value: 'other', label: t('propType_other') },
  ];

  const statusOptions = [
    { value: 'available', label: t('propStatus_available') },
    { value: 'reserved', label: t('propStatus_reserved') },
    { value: 'sold', label: t('propStatus_sold') },
    { value: 'rented', label: t('propStatus_rented') },
    { value: 'withdrawn', label: t('propStatus_withdrawn') },
  ];

  const offerTypeOptions = [
    { value: 'sale', label: t('offerType_sale') },
    { value: 'rent', label: t('offerType_rent') },
  ];

  const orientationOptions = [
    { value: 'north', label: t('orientation_north') },
    { value: 'south', label: t('orientation_south') },
    { value: 'east', label: t('orientation_east') },
    { value: 'west', label: t('orientation_west') },
    { value: 'southeast', label: t('orientation_southeast') },
    { value: 'southwest', label: t('orientation_southwest') },
    { value: 'northeast', label: t('orientation_northeast') },
    { value: 'northwest', label: t('orientation_northwest') },
  ];

  const conditionOptions = [
    { value: 'new', label: t('condition_new') },
    { value: 'like_new', label: t('condition_like_new') },
    { value: 'good', label: t('condition_good') },
    { value: 'needs_renovation', label: t('condition_needs_renovation') },
    { value: 'ruin', label: t('condition_ruin') },
  ];

  const heatingTypeOptions = [
    { value: 'electric', label: t('heating_electric') },
    { value: 'gas', label: t('heating_gas') },
    { value: 'oil', label: t('heating_oil') },
    { value: 'heat_pump', label: t('heating_heat_pump') },
    { value: 'solar', label: t('heating_solar') },
    { value: 'none', label: t('heating_none') },
  ];

  const legalStatusOptions = [
    { value: 'free', label: t('legalStatus_free') },
    { value: 'occupied', label: t('legalStatus_occupied') },
    { value: 'tenant', label: t('legalStatus_tenant') },
    { value: 'legal_dispute', label: t('legalStatus_legal_dispute') },
  ];

  const rentalPeriodOptions = [
    { value: 'monthly', label: t('rentalPeriod_monthly') },
    { value: 'weekly', label: t('rentalPeriod_weekly') },
    { value: 'daily', label: t('rentalPeriod_daily') },
  ];

  // Grunddaten
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [offerType, setOfferType] = useState('');
  const [status, setStatus] = useState('available');

  // Adresse
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  // Preis & Fläche
  const [price, setPrice] = useState('');
  const [priceNegotiable, setPriceNegotiable] = useState(true);
  const [sizeM2, setSizeM2] = useState('');
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [floor, setFloor] = useState('');

  // Typ & Zustand
  const [propertySubtype, setPropertySubtype] = useState('');
  const [orientation, setOrientation] = useState('');
  const [condition, setCondition] = useState('');

  // Ausstattung
  const [hasElevator, setHasElevator] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasPool, setHasPool] = useState(false);
  const [hasGarden, setHasGarden] = useState(false);
  const [gardenM2, setGardenM2] = useState('');
  const [isFurnished, setIsFurnished] = useState(false);
  const [hasGarage, setHasGarage] = useState(false);
  const [garageSpaces, setGarageSpaces] = useState('');
  const [hasTerrace, setHasTerrace] = useState(false);
  const [terraceM2, setTerraceM2] = useState('');
  const [hasAc, setHasAc] = useState(false);
  const [hasHeating, setHasHeating] = useState(false);
  const [heatingType, setHeatingType] = useState('');
  const [hasStorage, setHasStorage] = useState(false);
  const [hasSeaView, setHasSeaView] = useState(false);

  // Rechtliches
  const [referenciaCatastral, setReferenciaCatastral] = useState('');
  const [ibiAnnual, setIbiAnnual] = useState('');
  const [communityFeesMonthly, setCommunityFeesMonthly] = useState('');
  const [hasMortgage, setHasMortgage] = useState(false);
  const [mortgageOutstanding, setMortgageOutstanding] = useState('');
  const [legalStatus, setLegalStatus] = useState('');
  const [notaSimpleDate, setNotaSimpleDate] = useState('');

  // Vermietung
  const [rentalPrice, setRentalPrice] = useState('');
  const [rentalPeriod, setRentalPeriod] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [isRented, setIsRented] = useState(false);
  const [rentalYield, setRentalYield] = useState('');

  // Beschreibung
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!property) return;
    setTitle(property.title ?? '');
    setPropertyType(property.property_type ?? '');
    setOfferType(property.offer_type ?? '');
    setStatus(property.status ?? 'available');
    setAddress(property.address ?? '');
    setCity(property.city ?? '');
    setProvince(property.province ?? '');
    setPostalCode(property.postal_code ?? '');
    setCountry(property.country ?? '');
    setPrice(property.price != null ? String(property.price) : '');
    setPriceNegotiable(property.price_negotiable ?? true);
    setSizeM2(property.size_m2 != null ? String(property.size_m2) : '');
    setRooms(property.rooms != null ? String(property.rooms) : '');
    setBathrooms(property.bathrooms != null ? String(property.bathrooms) : '');
    setFloor(property.floor != null ? String(property.floor) : '');
    setPropertySubtype(property.property_subtype ?? '');
    setOrientation(property.orientation ?? '');
    setCondition(property.condition ?? '');
    setHasElevator(property.has_elevator ?? false);
    setHasParking(property.has_parking ?? false);
    setHasPool(property.has_pool ?? false);
    setHasGarden(property.has_garden ?? false);
    setGardenM2(property.garden_m2 != null ? String(property.garden_m2) : '');
    setIsFurnished(property.is_furnished ?? false);
    setHasGarage(property.has_garage ?? false);
    setGarageSpaces(property.garage_spaces != null ? String(property.garage_spaces) : '');
    setHasTerrace(property.has_terrace ?? false);
    setTerraceM2(property.terrace_m2 != null ? String(property.terrace_m2) : '');
    setHasAc(property.has_ac ?? false);
    setHasHeating(property.has_heating ?? false);
    setHeatingType(property.heating_type ?? '');
    setHasStorage(property.has_storage ?? false);
    setHasSeaView(property.has_sea_view ?? false);
    setReferenciaCatastral(property.referencia_catastral ?? '');
    setIbiAnnual(property.ibi_annual != null ? String(property.ibi_annual) : '');
    setCommunityFeesMonthly(property.community_fees_monthly != null ? String(property.community_fees_monthly) : '');
    setHasMortgage(property.has_mortgage ?? false);
    setMortgageOutstanding(property.mortgage_outstanding != null ? String(property.mortgage_outstanding) : '');
    setLegalStatus(property.legal_status ?? '');
    setNotaSimpleDate(property.nota_simple_date ?? '');
    setRentalPrice(property.rental_price != null ? String(property.rental_price) : '');
    setRentalPeriod(property.rental_period ?? '');
    setAvailableFrom(property.available_from ?? '');
    setIsRented(property.is_rented ?? false);
    setRentalYield(property.rental_yield != null ? String(property.rental_yield) : '');
    setDescription(property.description ?? '');
    setNotes(property.notes ?? '');
  }, [property]);

  if (isLoading) return <LoadingScreen />;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = t('prop_titleRequired');
    if (!propertyType) newErrors.propertyType = t('prop_typeRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload: Record<string, unknown> = {
      id: id!,
      title: title.trim(),
      property_type: propertyType,
      status: status || 'available',
      offer_type: offerType || null,
      address: address.trim() || null,
      city: city.trim() || null,
      province: province.trim() || null,
      postal_code: postalCode.trim() || null,
      country: country.trim() || null,
      price: price ? parseFloat(price) : null,
      price_negotiable: priceNegotiable,
      size_m2: sizeM2 ? parseFloat(sizeM2) : null,
      rooms: rooms ? parseInt(rooms, 10) : null,
      bathrooms: bathrooms ? parseInt(bathrooms, 10) : null,
      floor: floor ? parseInt(floor, 10) : null,
      property_subtype: propertySubtype.trim() || null,
      orientation: orientation || null,
      condition: condition || null,
      has_elevator: hasElevator,
      has_parking: hasParking,
      has_pool: hasPool,
      has_garden: hasGarden,
      garden_m2: hasGarden && gardenM2 ? parseFloat(gardenM2) : null,
      is_furnished: isFurnished,
      has_garage: hasGarage,
      garage_spaces: hasGarage && garageSpaces ? parseInt(garageSpaces, 10) : null,
      has_terrace: hasTerrace,
      terrace_m2: hasTerrace && terraceM2 ? parseFloat(terraceM2) : null,
      has_ac: hasAc,
      has_heating: hasHeating,
      heating_type: hasHeating && heatingType ? heatingType : null,
      has_storage: hasStorage,
      has_sea_view: hasSeaView,
      referencia_catastral: referenciaCatastral.trim() || null,
      ibi_annual: ibiAnnual ? parseFloat(ibiAnnual) : null,
      community_fees_monthly: communityFeesMonthly ? parseFloat(communityFeesMonthly) : null,
      has_mortgage: hasMortgage,
      mortgage_outstanding: hasMortgage && mortgageOutstanding ? parseFloat(mortgageOutstanding) : null,
      legal_status: legalStatus || null,
      nota_simple_date: notaSimpleDate.trim() || null,
      rental_price: rentalPrice ? parseFloat(rentalPrice) : null,
      rental_period: rentalPeriod || null,
      available_from: availableFrom.trim() || null,
      is_rented: isRented,
      rental_yield: rentalYield ? parseFloat(rentalYield) : null,
      description: description.trim() || null,
      notes: notes.trim() || null,
    };

    updateProperty.mutate(payload as any, {
      onSuccess: () => router.back(),
      onError: () => {
        Alert.alert(t('error'), t('properties_updateError'));
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerTitle: t('properties_edit'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Grunddaten — always visible */}
        <SectionLabel text={t('propSection_basic')} />
        <FormInput
          label={t('prop_title')}
          required
          value={title}
          onChangeText={setTitle}
          placeholder={t('prop_titlePlaceholder')}
          error={errors.title}
        />
        <FormSelect
          label={t('prop_type')}
          required
          options={typeOptions}
          value={propertyType}
          onChange={setPropertyType}
          placeholder={t('prop_typePlaceholder')}
          error={errors.propertyType}
        />
        <FormSelect
          label={t('prop_offerType')}
          options={offerTypeOptions}
          value={offerType}
          onChange={setOfferType}
          placeholder={t('prop_offerTypePlaceholder')}
        />
        <FormSelect
          label={t('prop_status')}
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />

        {/* Adresse */}
        <SectionLabel text={t('propSection_address')} />
        <FormInput
          label={t('prop_street')}
          value={address}
          onChangeText={setAddress}
          placeholder={t('prop_streetPlaceholder')}
        />
        <FormInput
          label={t('prop_city')}
          value={city}
          onChangeText={setCity}
          placeholder={t('prop_cityPlaceholder')}
        />
        <FormInput
          label={t('prop_province')}
          value={province}
          onChangeText={setProvince}
          placeholder={t('prop_provincePlaceholder')}
        />
        <FormInput
          label={t('prop_postalCode')}
          value={postalCode}
          onChangeText={setPostalCode}
          placeholder={t('prop_postalCodePlaceholder')}
          keyboardType="numeric"
        />
        <FormInput
          label={t('prop_country')}
          value={country}
          onChangeText={setCountry}
          placeholder={t('prop_countryPlaceholder')}
        />

        {/* Preis & Fläche */}
        <SectionLabel text={t('propSection_priceArea')} />
        <FormInput
          label={t('prop_price')}
          value={price}
          onChangeText={setPrice}
          placeholder={t('prop_pricePlaceholder')}
          keyboardType="numeric"
        />
        <FormToggle
          label={t('prop_priceNegotiable')}
          value={priceNegotiable}
          onChange={setPriceNegotiable}
        />
        <FormInput
          label={t('prop_area')}
          value={sizeM2}
          onChangeText={setSizeM2}
          placeholder={t('prop_areaPlaceholder')}
          keyboardType="numeric"
        />
        <FormInput
          label={t('prop_rooms')}
          value={rooms}
          onChangeText={setRooms}
          placeholder={t('prop_roomsPlaceholder')}
          keyboardType="numeric"
        />
        <FormInput
          label={t('prop_bathrooms')}
          value={bathrooms}
          onChangeText={setBathrooms}
          placeholder={t('prop_bathroomsPlaceholder')}
          keyboardType="numeric"
        />
        <FormInput
          label={t('prop_floor')}
          value={floor}
          onChangeText={setFloor}
          placeholder={t('prop_floorPlaceholder')}
          keyboardType="numeric"
        />

        {/* Typ & Zustand — collapsible */}
        <CollapsibleSection title={t('propSection_typeCondition')}>
          <FormInput
            label={t('prop_subtype')}
            value={propertySubtype}
            onChangeText={setPropertySubtype}
            placeholder={t('prop_subtypePlaceholder')}
          />
          <FormSelect
            label={t('prop_orientation')}
            options={orientationOptions}
            value={orientation}
            onChange={setOrientation}
            placeholder={t('prop_orientationPlaceholder')}
          />
          <FormSelect
            label={t('prop_condition')}
            options={conditionOptions}
            value={condition}
            onChange={setCondition}
            placeholder={t('prop_conditionPlaceholder')}
          />
        </CollapsibleSection>

        {/* Ausstattung — collapsible */}
        <CollapsibleSection title={t('propSection_features')}>
          <FormToggle label={t('feature_elevator')} value={hasElevator} onChange={setHasElevator} />
          <FormToggle label={t('feature_parking')} value={hasParking} onChange={setHasParking} />
          <FormToggle label={t('feature_pool')} value={hasPool} onChange={setHasPool} />
          <FormToggle label={t('feature_garden')} value={hasGarden} onChange={setHasGarden} />
          {hasGarden && (
            <FormInput
              label={t('feature_gardenArea')}
              value={gardenM2}
              onChangeText={setGardenM2}
              placeholder={t('prop_areaPlaceholder')}
              keyboardType="numeric"
            />
          )}
          <FormToggle label={t('feature_furnished')} value={isFurnished} onChange={setIsFurnished} />
          <FormToggle label={t('feature_garage')} value={hasGarage} onChange={setHasGarage} />
          {hasGarage && (
            <FormInput
              label={t('feature_garageSpaces')}
              value={garageSpaces}
              onChangeText={setGarageSpaces}
              placeholder={t('prop_roomsPlaceholder')}
              keyboardType="numeric"
            />
          )}
          <FormToggle label={t('feature_terrace')} value={hasTerrace} onChange={setHasTerrace} />
          {hasTerrace && (
            <FormInput
              label={t('feature_terraceArea')}
              value={terraceM2}
              onChangeText={setTerraceM2}
              placeholder={t('prop_areaPlaceholder')}
              keyboardType="numeric"
            />
          )}
          <FormToggle label={t('feature_ac')} value={hasAc} onChange={setHasAc} />
          <FormToggle label={t('feature_heating')} value={hasHeating} onChange={setHasHeating} />
          {hasHeating && (
            <FormSelect
              label={t('feature_heatingType')}
              options={heatingTypeOptions}
              value={heatingType}
              onChange={setHeatingType}
              placeholder={t('feature_heatingTypePlaceholder')}
            />
          )}
          <FormToggle label={t('feature_storage')} value={hasStorage} onChange={setHasStorage} />
          <FormToggle label={t('feature_seaView')} value={hasSeaView} onChange={setHasSeaView} />
        </CollapsibleSection>

        {/* Rechtliches — collapsible */}
        <CollapsibleSection title={t('propSection_legal')}>
          <FormInput
            label={t('legal_cadastralRef')}
            value={referenciaCatastral}
            onChangeText={setReferenciaCatastral}
            placeholder={t('legal_cadastralRefPlaceholder')}
          />
          <FormInput
            label={t('legal_ibiAnnual')}
            value={ibiAnnual}
            onChangeText={setIbiAnnual}
            placeholder={t('legal_ibiAnnualPlaceholder')}
            keyboardType="numeric"
          />
          <FormInput
            label={t('legal_communityFees')}
            value={communityFeesMonthly}
            onChangeText={setCommunityFeesMonthly}
            placeholder={t('legal_communityFeesPlaceholder')}
            keyboardType="numeric"
          />
          <FormToggle label={t('legal_mortgage')} value={hasMortgage} onChange={setHasMortgage} />
          {hasMortgage && (
            <FormInput
              label={t('legal_mortgageOutstanding')}
              value={mortgageOutstanding}
              onChangeText={setMortgageOutstanding}
              placeholder={t('legal_mortgageOutstandingPlaceholder')}
              keyboardType="numeric"
            />
          )}
          <FormSelect
            label={t('legal_legalStatus')}
            options={legalStatusOptions}
            value={legalStatus}
            onChange={setLegalStatus}
            placeholder={t('legal_legalStatusPlaceholder')}
          />
          <FormInput
            label={t('legal_notaSimple')}
            value={notaSimpleDate}
            onChangeText={setNotaSimpleDate}
            placeholder={t('legal_notaSimplePlaceholder')}
          />
        </CollapsibleSection>

        {/* Vermietung — collapsible, show if offer_type=rent */}
        {offerType === 'rent' && (
          <CollapsibleSection title={t('propSection_rental')} defaultOpen>
            <FormInput
              label={t('rental_price')}
              value={rentalPrice}
              onChangeText={setRentalPrice}
              placeholder={t('rental_pricePlaceholder')}
              keyboardType="numeric"
            />
            <FormSelect
              label={t('rental_period')}
              options={rentalPeriodOptions}
              value={rentalPeriod}
              onChange={setRentalPeriod}
              placeholder={t('rental_periodPlaceholder')}
            />
            <FormInput
              label={t('rental_availableFrom')}
              value={availableFrom}
              onChangeText={setAvailableFrom}
              placeholder={t('rental_availableFromPlaceholder')}
            />
            <FormToggle label={t('rental_currentlyRented')} value={isRented} onChange={setIsRented} />
            <FormInput
              label={t('rental_yield')}
              value={rentalYield}
              onChangeText={setRentalYield}
              placeholder={t('rental_yieldPlaceholder')}
              keyboardType="numeric"
            />
          </CollapsibleSection>
        )}

        {/* Beschreibung */}
        <SectionLabel text={t('propSection_description')} />
        <FormInput
          label={t('prop_description')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('prop_descriptionPlaceholder')}
          multiline
          numberOfLines={4}
        />
        <FormInput
          label={t('prop_internalNotes')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('prop_internalNotesPlaceholder')}
          multiline
          numberOfLines={3}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={t('prop_saveButton')}
            onPress={handleSubmit}
            loading={updateProperty.isPending}
            disabled={updateProperty.isPending}
          />
          <Button
            title={t('cancel')}
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  sectionLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  buttonContainer: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
