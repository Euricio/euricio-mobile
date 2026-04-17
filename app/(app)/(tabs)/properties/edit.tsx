import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProperty, useUpdateProperty } from '../../../../lib/api/properties';
import { useLeads } from '../../../../lib/api/leads';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { FormToggle } from '../../../../components/ui/FormToggle';
import { Button } from '../../../../components/ui/Button';
import { CollapsibleSection } from '../../../../components/ui/CollapsibleSection';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { useI18n } from '../../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../../constants/theme';

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

  const operationTypeOptions = [
    { value: 'buy', label: t('operationType_buy') },
    { value: 'sell', label: t('operationType_sell') },
    { value: 'rent_out', label: t('operationType_rent_out') },
    { value: 'rent_in', label: t('operationType_rent_in') },
    { value: 'investment', label: t('operationType_investment') },
  ];

  const energyCertOptions = [
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
    { value: 'D', label: 'D' },
    { value: 'E', label: 'E' },
    { value: 'F', label: 'F' },
    { value: 'G', label: 'G' },
    { value: 'pending', label: t('energyCert_pending') },
    { value: 'exempt', label: t('energyCert_exempt') },
  ];

  // Lead picker
  const [leadSearch, setLeadSearch] = useState('');
  const [showLeadPicker, setShowLeadPicker] = useState(false);
  const { data: leads } = useLeads(leadSearch);

  // Grunddaten
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [offerType, setOfferType] = useState('');
  const [status, setStatus] = useState('available');
  const [operationType, setOperationType] = useState('');

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
  const [plotSizeM2, setPlotSizeM2] = useState('');
  const [builtSizeM2, setBuiltSizeM2] = useState('');
  const [usefulSizeM2, setUsefulSizeM2] = useState('');
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [floor, setFloor] = useState('');
  const [totalFloors, setTotalFloors] = useState('');

  // Typ & Zustand
  const [propertySubtype, setPropertySubtype] = useState('');
  const [orientation, setOrientation] = useState('');
  const [condition, setCondition] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [energyCertificate, setEnergyCertificate] = useState('');

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
  const [hasBalcony, setHasBalcony] = useState(false);
  const [balconyM2, setBalconyM2] = useState('');
  const [parkingSpaces, setParkingSpaces] = useState('');

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

  // Land breakdown
  const [landClassification, setLandClassification] = useState('');
  const [landBuildableM2, setLandBuildableM2] = useState('');
  const [terrenoUrbanoM2, setTerrenoUrbanoM2] = useState('');
  const [terrenoAgricolaM2, setTerrenoAgricolaM2] = useState('');
  const [terrenoForestalM2, setTerrenoForestalM2] = useState('');
  const [terrenoPastizalM2, setTerrenoPastizalM2] = useState('');

  // Owner
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  // Lead
  const [leadId, setLeadId] = useState('');
  const [leadName, setLeadName] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!property) return;
    setTitle(property.title ?? '');
    setPropertyType(property.property_type ?? '');
    setOfferType(property.offer_type ?? '');
    setStatus(property.status ?? 'available');
    setOperationType(property.operation_type ?? '');
    setAddress(property.address ?? '');
    setCity(property.city ?? '');
    setProvince(property.province ?? '');
    setPostalCode(property.postal_code ?? '');
    setCountry(property.country ?? '');
    setPrice(property.price != null ? String(property.price) : '');
    setPriceNegotiable(property.price_negotiable ?? true);
    setSizeM2(property.size_m2 != null ? String(property.size_m2) : '');
    setPlotSizeM2(property.plot_size_m2 != null ? String(property.plot_size_m2) : '');
    setBuiltSizeM2(property.built_size_m2 != null ? String(property.built_size_m2) : '');
    setUsefulSizeM2(property.useful_size_m2 != null ? String(property.useful_size_m2) : '');
    setRooms(property.rooms != null ? String(property.rooms) : '');
    setBathrooms(property.bathrooms != null ? String(property.bathrooms) : '');
    setFloor(property.floor != null ? String(property.floor) : '');
    setTotalFloors(property.total_floors != null ? String(property.total_floors) : '');
    setPropertySubtype(property.property_subtype ?? '');
    setOrientation(property.orientation ?? '');
    setCondition(property.condition ?? '');
    setYearBuilt(property.year_built != null ? String(property.year_built) : '');
    setEnergyCertificate(property.energy_certificate ?? '');
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
    setHasBalcony(property.has_balcony ?? false);
    setBalconyM2(property.balcony_m2 != null ? String(property.balcony_m2) : '');
    setParkingSpaces(property.parking_spaces != null ? String(property.parking_spaces) : '');
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
    setLandClassification(property.land_classification ?? '');
    setLandBuildableM2(property.land_buildable_m2 != null ? String(property.land_buildable_m2) : '');
    setTerrenoUrbanoM2(property.terreno_urbano_m2 != null ? String(property.terreno_urbano_m2) : '');
    setTerrenoAgricolaM2(property.terreno_agricola_m2 != null ? String(property.terreno_agricola_m2) : '');
    setTerrenoForestalM2(property.terreno_forestal_m2 != null ? String(property.terreno_forestal_m2) : '');
    setTerrenoPastizalM2(property.terreno_pastizal_m2 != null ? String(property.terreno_pastizal_m2) : '');
    setOwnerName(property.owner_name ?? '');
    setOwnerPhone(property.owner_phone ?? '');
    setOwnerEmail(property.owner_email ?? '');
    setLeadId(property.lead_id ?? '');
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

    // Only include columns that exist in the DB properties table
    const payload: Record<string, unknown> = {
      id: id!,
      title: title.trim(),
      property_type: propertyType,
      status: status || 'available',
      offer_type: offerType || null,
      operation_type: operationType || null,
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
      terreno_urbano_m2: terrenoUrbanoM2 ? parseFloat(terrenoUrbanoM2) : null,
      terreno_agricola_m2: terrenoAgricolaM2 ? parseFloat(terrenoAgricolaM2) : null,
      terreno_forestal_m2: terrenoForestalM2 ? parseFloat(terrenoForestalM2) : null,
      terreno_pastizal_m2: terrenoPastizalM2 ? parseFloat(terrenoPastizalM2) : null,
      lead_id: leadId ? parseInt(leadId, 10) : null,
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
        <FormSelect
          label={t('prop_operationType')}
          options={operationTypeOptions}
          value={operationType}
          onChange={setOperationType}
          placeholder={t('prop_operationTypePlaceholder')}
        />

        {/* Adresse */}
        <SectionLabel text={t('propSection_address')} />
        <FormInput label={t('prop_street')} value={address} onChangeText={setAddress} placeholder={t('prop_streetPlaceholder')} />
        <FormInput label={t('prop_city')} value={city} onChangeText={setCity} placeholder={t('prop_cityPlaceholder')} />
        <FormInput label={t('prop_province')} value={province} onChangeText={setProvince} placeholder={t('prop_provincePlaceholder')} />
        <FormInput label={t('prop_postalCode')} value={postalCode} onChangeText={setPostalCode} placeholder={t('prop_postalCodePlaceholder')} keyboardType="numeric" />
        <FormInput label={t('prop_country')} value={country} onChangeText={setCountry} placeholder={t('prop_countryPlaceholder')} />

        {/* Preis & Fläche */}
        <SectionLabel text={t('propSection_priceArea')} />
        <FormInput label={t('prop_price')} value={price} onChangeText={setPrice} placeholder={t('prop_pricePlaceholder')} keyboardType="numeric" />
        <FormToggle label={t('prop_priceNegotiable')} value={priceNegotiable} onChange={setPriceNegotiable} />
        <FormInput label={t('prop_area')} value={sizeM2} onChangeText={setSizeM2} placeholder={t('prop_areaPlaceholder')} keyboardType="numeric" />
        <FormInput label={t('prop_rooms')} value={rooms} onChangeText={setRooms} placeholder={t('prop_roomsPlaceholder')} keyboardType="numeric" />
        <FormInput label={t('prop_bathrooms')} value={bathrooms} onChangeText={setBathrooms} placeholder={t('prop_bathroomsPlaceholder')} keyboardType="numeric" />
        <FormInput label={t('prop_floor')} value={floor} onChangeText={setFloor} placeholder={t('prop_floorPlaceholder')} keyboardType="numeric" />
        <FormInput label={t('prop_totalFloors')} value={totalFloors} onChangeText={setTotalFloors} placeholder="z.B. 5" keyboardType="numeric" />
        <FormInput label={t('prop_plotSize')} value={plotSizeM2} onChangeText={setPlotSizeM2} placeholder={t('prop_areaPlaceholder')} keyboardType="numeric" />
        <FormInput label={t('prop_builtSize')} value={builtSizeM2} onChangeText={setBuiltSizeM2} placeholder={t('prop_areaPlaceholder')} keyboardType="numeric" />
        <FormInput label={t('prop_usefulSize')} value={usefulSizeM2} onChangeText={setUsefulSizeM2} placeholder={t('prop_areaPlaceholder')} keyboardType="numeric" />

        {/* Typ & Zustand — collapsible */}
        <CollapsibleSection title={t('propSection_typeCondition')}>
          <FormInput label={t('prop_subtype')} value={propertySubtype} onChangeText={setPropertySubtype} placeholder={t('prop_subtypePlaceholder')} />
          <FormSelect label={t('prop_orientation')} options={orientationOptions} value={orientation} onChange={setOrientation} placeholder={t('prop_orientationPlaceholder')} />
          <FormSelect label={t('prop_condition')} options={conditionOptions} value={condition} onChange={setCondition} placeholder={t('prop_conditionPlaceholder')} />
          <FormInput label={t('prop_yearBuilt')} value={yearBuilt} onChangeText={setYearBuilt} placeholder="z.B. 2005" keyboardType="numeric" />
          <FormSelect label={t('prop_energyCertificate')} options={energyCertOptions} value={energyCertificate} onChange={setEnergyCertificate} placeholder={t('prop_orientationPlaceholder')} />
        </CollapsibleSection>

        {/* Ausstattung — collapsible */}
        <CollapsibleSection title={t('propSection_features')}>
          <FormToggle label={t('feature_elevator')} value={hasElevator} onChange={setHasElevator} />
          <FormToggle label={t('feature_parking')} value={hasParking} onChange={setHasParking} />
          {hasParking && (
            <FormInput label={t('prop_parkingSpaces')} value={parkingSpaces} onChangeText={setParkingSpaces} placeholder="z.B. 2" keyboardType="numeric" />
          )}
          <FormToggle label={t('feature_pool')} value={hasPool} onChange={setHasPool} />
          <FormToggle label={t('feature_garden')} value={hasGarden} onChange={setHasGarden} />
          {hasGarden && (
            <FormInput label={t('feature_gardenArea')} value={gardenM2} onChangeText={setGardenM2} placeholder={t('prop_areaPlaceholder')} keyboardType="numeric" />
          )}
          <FormToggle label={t('feature_furnished')} value={isFurnished} onChange={setIsFurnished} />
          <FormToggle label={t('feature_garage')} value={hasGarage} onChange={setHasGarage} />
          {hasGarage && (
            <FormInput label={t('feature_garageSpaces')} value={garageSpaces} onChangeText={setGarageSpaces} placeholder={t('prop_roomsPlaceholder')} keyboardType="numeric" />
          )}
          <FormToggle label={t('feature_terrace')} value={hasTerrace} onChange={setHasTerrace} />
          {hasTerrace && (
            <FormInput label={t('feature_terraceArea')} value={terraceM2} onChangeText={setTerraceM2} placeholder={t('prop_areaPlaceholder')} keyboardType="numeric" />
          )}
          <FormToggle label={t('feature_ac')} value={hasAc} onChange={setHasAc} />
          <FormToggle label={t('feature_heating')} value={hasHeating} onChange={setHasHeating} />
          {hasHeating && (
            <FormSelect label={t('feature_heatingType')} options={heatingTypeOptions} value={heatingType} onChange={setHeatingType} placeholder={t('feature_heatingTypePlaceholder')} />
          )}
          <FormToggle label={t('feature_storage')} value={hasStorage} onChange={setHasStorage} />
          <FormToggle label={t('feature_seaView')} value={hasSeaView} onChange={setHasSeaView} />
          <FormToggle label={t('prop_balcony')} value={hasBalcony} onChange={setHasBalcony} />
          {hasBalcony && (
            <FormInput label={t('prop_balconyArea')} value={balconyM2} onChangeText={setBalconyM2} placeholder={t('prop_areaPlaceholder')} keyboardType="numeric" />
          )}
        </CollapsibleSection>

        {/* Rechtliches — collapsible */}
        <CollapsibleSection title={t('propSection_legal')}>
          <FormInput label={t('legal_cadastralRef')} value={referenciaCatastral} onChangeText={setReferenciaCatastral} placeholder={t('legal_cadastralRefPlaceholder')} />
          <FormInput label={t('legal_ibiAnnual')} value={ibiAnnual} onChangeText={setIbiAnnual} placeholder={t('legal_ibiAnnualPlaceholder')} keyboardType="numeric" />
          <FormInput label={t('legal_communityFees')} value={communityFeesMonthly} onChangeText={setCommunityFeesMonthly} placeholder={t('legal_communityFeesPlaceholder')} keyboardType="numeric" />
          <FormToggle label={t('legal_mortgage')} value={hasMortgage} onChange={setHasMortgage} />
          {hasMortgage && (
            <FormInput label={t('legal_mortgageOutstanding')} value={mortgageOutstanding} onChangeText={setMortgageOutstanding} placeholder={t('legal_mortgageOutstandingPlaceholder')} keyboardType="numeric" />
          )}
          <FormSelect label={t('legal_legalStatus')} options={legalStatusOptions} value={legalStatus} onChange={setLegalStatus} placeholder={t('legal_legalStatusPlaceholder')} />
          <FormInput label={t('legal_notaSimple')} value={notaSimpleDate} onChangeText={setNotaSimpleDate} placeholder={t('legal_notaSimplePlaceholder')} />
        </CollapsibleSection>

        {/* Vermietung — collapsible, show if offer_type=rent */}
        {offerType === 'rent' && (
          <CollapsibleSection title={t('propSection_rental')} defaultOpen>
            <FormInput label={t('rental_price')} value={rentalPrice} onChangeText={setRentalPrice} placeholder={t('rental_pricePlaceholder')} keyboardType="numeric" />
            <FormSelect label={t('rental_period')} options={rentalPeriodOptions} value={rentalPeriod} onChange={setRentalPeriod} placeholder={t('rental_periodPlaceholder')} />
            <FormInput label={t('rental_availableFrom')} value={availableFrom} onChangeText={setAvailableFrom} placeholder={t('rental_availableFromPlaceholder')} />
            <FormToggle label={t('rental_currentlyRented')} value={isRented} onChange={setIsRented} />
            <FormInput label={t('rental_yield')} value={rentalYield} onChangeText={setRentalYield} placeholder={t('rental_yieldPlaceholder')} keyboardType="numeric" />
          </CollapsibleSection>
        )}

        {/* Land breakdown — collapsible */}
        <CollapsibleSection title={t('propSection_land')}>
          <FormInput label={t('land_classification')} value={landClassification} onChangeText={setLandClassification} placeholder={t('land_classificationPlaceholder')} />
          <FormInput label={t('land_buildable')} value={landBuildableM2} onChangeText={setLandBuildableM2} placeholder={t('land_buildablePlaceholder')} keyboardType="numeric" />
          <FormInput label={t('land_terreno_urbano')} value={terrenoUrbanoM2} onChangeText={setTerrenoUrbanoM2} placeholder={t('prop_areaPlaceholder')} keyboardType="numeric" />
          <FormInput label={t('land_terreno_agricola')} value={terrenoAgricolaM2} onChangeText={setTerrenoAgricolaM2} placeholder={t('prop_areaPlaceholder')} keyboardType="numeric" />
          <FormInput label={t('land_terreno_forestal')} value={terrenoForestalM2} onChangeText={setTerrenoForestalM2} placeholder={t('prop_areaPlaceholder')} keyboardType="numeric" />
          <FormInput label={t('land_terreno_pastizal')} value={terrenoPastizalM2} onChangeText={setTerrenoPastizalM2} placeholder={t('prop_areaPlaceholder')} keyboardType="numeric" />
        </CollapsibleSection>

        {/* Owner — collapsible */}
        <CollapsibleSection title={t('prop_ownerSection')}>
          <FormInput label={t('prop_ownerName')} value={ownerName} onChangeText={setOwnerName} placeholder={t('ownership_namePlaceholder')} />
          <FormInput label={t('prop_ownerPhone')} value={ownerPhone} onChangeText={setOwnerPhone} placeholder={t('ownership_phonePlaceholder')} keyboardType="phone-pad" />
          <FormInput label={t('prop_ownerEmail')} value={ownerEmail} onChangeText={setOwnerEmail} placeholder={t('ownership_emailPlaceholder')} keyboardType="email-address" autoCapitalize="none" />
        </CollapsibleSection>

        {/* Lead picker */}
        <SectionLabel text={t('prop_linkedLead')} />
        {leadId ? (
          <View style={styles.leadSelectedRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.leadSelectedName}>{leadName || leadId}</Text>
            </View>
            <TouchableOpacity onPress={() => { setLeadId(''); setLeadName(''); }}>
              <Ionicons name="close-circle" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TouchableOpacity
              style={styles.leadPickerButton}
              onPress={() => setShowLeadPicker(!showLeadPicker)}
            >
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <Text style={styles.leadPickerButtonText}>{t('prop_selectLead')}</Text>
            </TouchableOpacity>
            {showLeadPicker && (
              <View style={styles.leadPickerDropdown}>
                <TextInput
                  style={styles.leadSearchInput}
                  placeholder={t('prop_searchLead')}
                  value={leadSearch}
                  onChangeText={setLeadSearch}
                  placeholderTextColor={colors.textTertiary}
                />
                {leads && leads.length > 0 ? (
                  leads.slice(0, 10).map((lead) => (
                    <TouchableOpacity
                      key={lead.id}
                      style={styles.leadOption}
                      onPress={() => {
                        setLeadId(lead.id);
                        setLeadName(lead.full_name);
                        setShowLeadPicker(false);
                        setLeadSearch('');
                      }}
                    >
                      <Text style={styles.leadOptionText}>{lead.full_name}</Text>
                      {lead.phone && <Text style={styles.leadOptionSub}>{lead.phone}</Text>}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.leadEmptyText}>{t('prop_noLeadsFound')}</Text>
                )}
              </View>
            )}
          </View>
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
  leadSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  leadSelectedName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  leadPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  leadPickerButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  leadPickerDropdown: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
    maxHeight: 300,
  },
  leadSearchInput: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  leadOption: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  leadOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  leadOptionSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  leadEmptyText: {
    padding: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
});
