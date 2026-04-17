import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateProperty } from '../../../../lib/api/properties';
import { useLeads } from '../../../../lib/api/leads';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { FormToggle } from '../../../../components/ui/FormToggle';
import { Button } from '../../../../components/ui/Button';
import { CollapsibleSection } from '../../../../components/ui/CollapsibleSection';
import { useI18n } from '../../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../../constants/theme';

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

export default function CreatePropertyScreen() {
  const createProperty = useCreateProperty();
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
  const [country, setCountry] = useState('ES');

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
      title: title.trim(),
      property_type: propertyType,
      status: status || 'available',
    };

    // Only include fields with values
    if (offerType) payload.offer_type = offerType;
    if (operationType) payload.operation_type = operationType;
    if (address.trim()) payload.address = address.trim();
    if (city.trim()) payload.city = city.trim();
    if (province.trim()) payload.province = province.trim();
    if (postalCode.trim()) payload.postal_code = postalCode.trim();
    if (country.trim()) payload.country = country.trim();
    if (price) payload.price = parseFloat(price);
    payload.price_negotiable = priceNegotiable;
    if (sizeM2) payload.size_m2 = parseFloat(sizeM2);
    // Note: plot_size_m2, built_size_m2, useful_size_m2, total_floors,
    // year_built, energy_certificate do not exist in the DB yet
    if (rooms) payload.rooms = parseInt(rooms, 10);
    if (bathrooms) payload.bathrooms = parseInt(bathrooms, 10);
    if (floor) payload.floor = parseInt(floor, 10);
    if (propertySubtype.trim()) payload.property_subtype = propertySubtype.trim();
    if (orientation) payload.orientation = orientation;
    if (condition) payload.condition = condition;

    // Features (booleans)
    if (hasElevator) payload.has_elevator = true;
    if (hasParking) payload.has_parking = true;
    if (hasPool) payload.has_pool = true;
    if (hasGarden) {
      payload.has_garden = true;
      if (gardenM2) payload.garden_m2 = parseFloat(gardenM2);
    }
    if (isFurnished) payload.is_furnished = true;
    if (hasGarage) {
      payload.has_garage = true;
      if (garageSpaces) payload.garage_spaces = parseInt(garageSpaces, 10);
    }
    if (hasTerrace) {
      payload.has_terrace = true;
      if (terraceM2) payload.terrace_m2 = parseFloat(terraceM2);
    }
    if (hasAc) payload.has_ac = true;
    if (hasHeating) {
      payload.has_heating = true;
      if (heatingType) payload.heating_type = heatingType;
    }
    if (hasStorage) payload.has_storage = true;
    if (hasSeaView) payload.has_sea_view = true;
    // Note: has_balcony, balcony_m2, parking_spaces do not exist in the DB yet

    // Owner fields are stored in property_owners table, not properties

    // Lead
    if (leadId) payload.lead_id = parseInt(leadId, 10);

    // Land breakdown
    // Note: land_classification, land_buildable_m2 do not exist in DB yet
    if (terrenoUrbanoM2) payload.terreno_urbano_m2 = parseFloat(terrenoUrbanoM2);
    if (terrenoAgricolaM2) payload.terreno_agricola_m2 = parseFloat(terrenoAgricolaM2);
    if (terrenoForestalM2) payload.terreno_forestal_m2 = parseFloat(terrenoForestalM2);
    if (terrenoPastizalM2) payload.terreno_pastizal_m2 = parseFloat(terrenoPastizalM2);

    // Legal
    if (referenciaCatastral.trim()) payload.referencia_catastral = referenciaCatastral.trim();
    if (ibiAnnual) payload.ibi_annual = parseFloat(ibiAnnual);
    if (communityFeesMonthly) payload.community_fees_monthly = parseFloat(communityFeesMonthly);
    if (hasMortgage) {
      payload.has_mortgage = true;
      if (mortgageOutstanding) payload.mortgage_outstanding = parseFloat(mortgageOutstanding);
    }
    if (legalStatus) payload.legal_status = legalStatus;
    if (notaSimpleDate.trim()) payload.nota_simple_date = notaSimpleDate.trim();

    // Rental
    if (rentalPrice) payload.rental_price = parseFloat(rentalPrice);
    if (rentalPeriod) payload.rental_period = rentalPeriod;
    if (availableFrom.trim()) payload.available_from = availableFrom.trim();
    if (isRented) payload.is_rented = true;
    if (rentalYield) payload.rental_yield = parseFloat(rentalYield);

    // Description
    if (description.trim()) payload.description = description.trim();
    if (notes.trim()) payload.notes = notes.trim();

    createProperty.mutate(payload as any, {
      onSuccess: () => router.back(),
      onError: () => {
        Alert.alert(t('error'), t('properties_createError'));
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
          headerTitle: t('properties_new'),
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
        <FormInput
          label={t('prop_totalFloors')}
          value={totalFloors}
          onChangeText={setTotalFloors}
          placeholder="z.B. 5"
          keyboardType="numeric"
        />
        <FormInput
          label={t('prop_plotSize')}
          value={plotSizeM2}
          onChangeText={setPlotSizeM2}
          placeholder={t('prop_areaPlaceholder')}
          keyboardType="numeric"
        />
        <FormInput
          label={t('prop_builtSize')}
          value={builtSizeM2}
          onChangeText={setBuiltSizeM2}
          placeholder={t('prop_areaPlaceholder')}
          keyboardType="numeric"
        />
        <FormInput
          label={t('prop_usefulSize')}
          value={usefulSizeM2}
          onChangeText={setUsefulSizeM2}
          placeholder={t('prop_areaPlaceholder')}
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
          <FormInput
            label={t('prop_yearBuilt')}
            value={yearBuilt}
            onChangeText={setYearBuilt}
            placeholder="z.B. 2005"
            keyboardType="numeric"
          />
          <FormSelect
            label={t('prop_energyCertificate')}
            options={energyCertOptions}
            value={energyCertificate}
            onChange={setEnergyCertificate}
            placeholder={t('prop_orientationPlaceholder')}
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
          <FormToggle label={t('prop_balcony')} value={hasBalcony} onChange={setHasBalcony} />
          {hasBalcony && (
            <FormInput
              label={t('prop_balconyArea')}
              value={balconyM2}
              onChangeText={setBalconyM2}
              placeholder={t('prop_areaPlaceholder')}
              keyboardType="numeric"
            />
          )}
          {hasParking && (
            <FormInput
              label={t('prop_parkingSpaces')}
              value={parkingSpaces}
              onChangeText={setParkingSpaces}
              placeholder="z.B. 2"
              keyboardType="numeric"
            />
          )}
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

        {/* Land breakdown — collapsible */}
        <CollapsibleSection title={t('propSection_land')}>
          <FormInput
            label={t('land_classification')}
            value={landClassification}
            onChangeText={setLandClassification}
            placeholder={t('land_classificationPlaceholder')}
          />
          <FormInput
            label={t('land_buildable')}
            value={landBuildableM2}
            onChangeText={setLandBuildableM2}
            placeholder={t('land_buildablePlaceholder')}
            keyboardType="numeric"
          />
          <FormInput
            label={t('land_terreno_urbano')}
            value={terrenoUrbanoM2}
            onChangeText={setTerrenoUrbanoM2}
            placeholder={t('prop_areaPlaceholder')}
            keyboardType="numeric"
          />
          <FormInput
            label={t('land_terreno_agricola')}
            value={terrenoAgricolaM2}
            onChangeText={setTerrenoAgricolaM2}
            placeholder={t('prop_areaPlaceholder')}
            keyboardType="numeric"
          />
          <FormInput
            label={t('land_terreno_forestal')}
            value={terrenoForestalM2}
            onChangeText={setTerrenoForestalM2}
            placeholder={t('prop_areaPlaceholder')}
            keyboardType="numeric"
          />
          <FormInput
            label={t('land_terreno_pastizal')}
            value={terrenoPastizalM2}
            onChangeText={setTerrenoPastizalM2}
            placeholder={t('prop_areaPlaceholder')}
            keyboardType="numeric"
          />
        </CollapsibleSection>

        {/* Owner — collapsible */}
        <CollapsibleSection title={t('prop_ownerSection')}>
          <FormInput
            label={t('prop_ownerName')}
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder={t('ownership_namePlaceholder')}
          />
          <FormInput
            label={t('prop_ownerPhone')}
            value={ownerPhone}
            onChangeText={setOwnerPhone}
            placeholder={t('ownership_phonePlaceholder')}
            keyboardType="phone-pad"
          />
          <FormInput
            label={t('prop_ownerEmail')}
            value={ownerEmail}
            onChangeText={setOwnerEmail}
            placeholder={t('ownership_emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </CollapsibleSection>

        {/* Lead picker */}
        <SectionLabel text={t('prop_linkedLead')} />
        {leadId ? (
          <View style={styles.leadSelectedRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.leadSelectedName}>{leadName}</Text>
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
            title={t('prop_createButton')}
            onPress={handleSubmit}
            loading={createProperty.isPending}
            disabled={createProperty.isPending}
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
