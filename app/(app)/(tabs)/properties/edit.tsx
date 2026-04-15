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
import { colors, spacing, fontSize, fontWeight } from '../../../../constants/theme';

const typeOptions = [
  { value: 'apartment', label: 'Wohnung' },
  { value: 'house', label: 'Haus' },
  { value: 'villa', label: 'Villa' },
  { value: 'chalet', label: 'Chalet' },
  { value: 'finca', label: 'Finca' },
  { value: 'commercial', label: 'Gewerbe' },
  { value: 'land', label: 'Grundstück' },
  { value: 'garage', label: 'Garage' },
  { value: 'other', label: 'Sonstige' },
];

const statusOptions = [
  { value: 'available', label: 'Verfügbar' },
  { value: 'reserved', label: 'Reserviert' },
  { value: 'sold', label: 'Verkauft' },
  { value: 'rented', label: 'Vermietet' },
  { value: 'withdrawn', label: 'Zurückgezogen' },
];

const offerTypeOptions = [
  { value: 'sale', label: 'Verkauf' },
  { value: 'rent', label: 'Vermietung' },
];

const orientationOptions = [
  { value: 'north', label: 'Nord' },
  { value: 'south', label: 'Süd' },
  { value: 'east', label: 'Ost' },
  { value: 'west', label: 'West' },
  { value: 'southeast', label: 'Südost' },
  { value: 'southwest', label: 'Südwest' },
  { value: 'northeast', label: 'Nordost' },
  { value: 'northwest', label: 'Nordwest' },
];

const conditionOptions = [
  { value: 'new', label: 'Neubau' },
  { value: 'like_new', label: 'Neuwertig' },
  { value: 'good', label: 'Gut' },
  { value: 'needs_renovation', label: 'Renovierungsbedürftig' },
  { value: 'ruin', label: 'Ruine' },
];

const heatingTypeOptions = [
  { value: 'electric', label: 'Elektrisch' },
  { value: 'gas', label: 'Gas' },
  { value: 'oil', label: 'Öl' },
  { value: 'heat_pump', label: 'Wärmepumpe' },
  { value: 'solar', label: 'Solar' },
  { value: 'none', label: 'Keine' },
];

const legalStatusOptions = [
  { value: 'free', label: 'Frei' },
  { value: 'occupied', label: 'Besetzt' },
  { value: 'tenant', label: 'Vermietet' },
  { value: 'legal_dispute', label: 'Rechtsstreit' },
];

const rentalPeriodOptions = [
  { value: 'monthly', label: 'Monatlich' },
  { value: 'weekly', label: 'Wöchentlich' },
  { value: 'daily', label: 'Täglich' },
];

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id!);
  const updateProperty = useUpdateProperty();

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
    if (!title.trim()) newErrors.title = 'Titel ist erforderlich';
    if (!propertyType) newErrors.propertyType = 'Immobilientyp ist erforderlich';
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
        Alert.alert('Fehler', 'Immobilie konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.');
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
          headerTitle: 'Immobilie bearbeiten',
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
        <SectionLabel text="Grunddaten" />
        <FormInput
          label="Titel"
          required
          value={title}
          onChangeText={setTitle}
          placeholder="z.B. 3-Zimmer-Wohnung in Mitte"
          error={errors.title}
        />
        <FormSelect
          label="Immobilientyp"
          required
          options={typeOptions}
          value={propertyType}
          onChange={setPropertyType}
          placeholder="Typ auswählen..."
          error={errors.propertyType}
        />
        <FormSelect
          label="Angebotsart"
          options={offerTypeOptions}
          value={offerType}
          onChange={setOfferType}
          placeholder="Angebotsart auswählen..."
        />
        <FormSelect
          label="Status"
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />

        {/* Adresse */}
        <SectionLabel text="Adresse" />
        <FormInput
          label="Straße"
          value={address}
          onChangeText={setAddress}
          placeholder="Straße und Hausnummer"
        />
        <FormInput
          label="Stadt"
          value={city}
          onChangeText={setCity}
          placeholder="z.B. Marbella"
        />
        <FormInput
          label="Provinz"
          value={province}
          onChangeText={setProvince}
          placeholder="z.B. Málaga"
        />
        <FormInput
          label="PLZ"
          value={postalCode}
          onChangeText={setPostalCode}
          placeholder="z.B. 29601"
          keyboardType="numeric"
        />
        <FormInput
          label="Land"
          value={country}
          onChangeText={setCountry}
          placeholder="z.B. ES"
        />

        {/* Preis & Fläche */}
        <SectionLabel text="Preis & Fläche" />
        <FormInput
          label="Preis (EUR)"
          value={price}
          onChangeText={setPrice}
          placeholder="z.B. 350000"
          keyboardType="numeric"
        />
        <FormToggle
          label="Verhandlungsbasis"
          value={priceNegotiable}
          onChange={setPriceNegotiable}
        />
        <FormInput
          label="Fläche (m²)"
          value={sizeM2}
          onChangeText={setSizeM2}
          placeholder="z.B. 85"
          keyboardType="numeric"
        />
        <FormInput
          label="Zimmer"
          value={rooms}
          onChangeText={setRooms}
          placeholder="z.B. 3"
          keyboardType="numeric"
        />
        <FormInput
          label="Badezimmer"
          value={bathrooms}
          onChangeText={setBathrooms}
          placeholder="z.B. 2"
          keyboardType="numeric"
        />
        <FormInput
          label="Etage"
          value={floor}
          onChangeText={setFloor}
          placeholder="z.B. 3"
          keyboardType="numeric"
        />

        {/* Typ & Zustand — collapsible */}
        <CollapsibleSection title="Typ & Zustand">
          <FormInput
            label="Untertyp"
            value={propertySubtype}
            onChangeText={setPropertySubtype}
            placeholder="z.B. Penthouse, Reihenhaus"
          />
          <FormSelect
            label="Ausrichtung"
            options={orientationOptions}
            value={orientation}
            onChange={setOrientation}
            placeholder="Ausrichtung auswählen..."
          />
          <FormSelect
            label="Zustand"
            options={conditionOptions}
            value={condition}
            onChange={setCondition}
            placeholder="Zustand auswählen..."
          />
        </CollapsibleSection>

        {/* Ausstattung — collapsible */}
        <CollapsibleSection title="Ausstattung">
          <FormToggle label="Aufzug" value={hasElevator} onChange={setHasElevator} />
          <FormToggle label="Parkplatz" value={hasParking} onChange={setHasParking} />
          <FormToggle label="Pool" value={hasPool} onChange={setHasPool} />
          <FormToggle label="Garten" value={hasGarden} onChange={setHasGarden} />
          {hasGarden && (
            <FormInput
              label="Gartenfläche (m²)"
              value={gardenM2}
              onChangeText={setGardenM2}
              placeholder="z.B. 50"
              keyboardType="numeric"
            />
          )}
          <FormToggle label="Möbliert" value={isFurnished} onChange={setIsFurnished} />
          <FormToggle label="Garage" value={hasGarage} onChange={setHasGarage} />
          {hasGarage && (
            <FormInput
              label="Stellplätze"
              value={garageSpaces}
              onChangeText={setGarageSpaces}
              placeholder="z.B. 1"
              keyboardType="numeric"
            />
          )}
          <FormToggle label="Terrasse" value={hasTerrace} onChange={setHasTerrace} />
          {hasTerrace && (
            <FormInput
              label="Terrassenfläche (m²)"
              value={terraceM2}
              onChangeText={setTerraceM2}
              placeholder="z.B. 20"
              keyboardType="numeric"
            />
          )}
          <FormToggle label="Klimaanlage" value={hasAc} onChange={setHasAc} />
          <FormToggle label="Heizung" value={hasHeating} onChange={setHasHeating} />
          {hasHeating && (
            <FormSelect
              label="Heizungsart"
              options={heatingTypeOptions}
              value={heatingType}
              onChange={setHeatingType}
              placeholder="Heizungsart auswählen..."
            />
          )}
          <FormToggle label="Abstellraum" value={hasStorage} onChange={setHasStorage} />
          <FormToggle label="Meerblick" value={hasSeaView} onChange={setHasSeaView} />
        </CollapsibleSection>

        {/* Rechtliches — collapsible */}
        <CollapsibleSection title="Rechtliches & Kosten">
          <FormInput
            label="Katasterreferenz"
            value={referenciaCatastral}
            onChangeText={setReferenciaCatastral}
            placeholder="Referencia catastral"
          />
          <FormInput
            label="IBI jährlich (EUR)"
            value={ibiAnnual}
            onChangeText={setIbiAnnual}
            placeholder="z.B. 800"
            keyboardType="numeric"
          />
          <FormInput
            label="Gemeinschaftskosten monatlich (EUR)"
            value={communityFeesMonthly}
            onChangeText={setCommunityFeesMonthly}
            placeholder="z.B. 150"
            keyboardType="numeric"
          />
          <FormToggle label="Hypothek vorhanden" value={hasMortgage} onChange={setHasMortgage} />
          {hasMortgage && (
            <FormInput
              label="Offene Hypothek (EUR)"
              value={mortgageOutstanding}
              onChangeText={setMortgageOutstanding}
              placeholder="z.B. 150000"
              keyboardType="numeric"
            />
          )}
          <FormSelect
            label="Rechtsstatus"
            options={legalStatusOptions}
            value={legalStatus}
            onChange={setLegalStatus}
            placeholder="Status auswählen..."
          />
          <FormInput
            label="Nota Simple Datum"
            value={notaSimpleDate}
            onChangeText={setNotaSimpleDate}
            placeholder="JJJJ-MM-TT"
          />
        </CollapsibleSection>

        {/* Vermietung — collapsible, show if offer_type=rent */}
        {offerType === 'rent' && (
          <CollapsibleSection title="Vermietung" defaultOpen>
            <FormInput
              label="Mietpreis (EUR)"
              value={rentalPrice}
              onChangeText={setRentalPrice}
              placeholder="z.B. 1200"
              keyboardType="numeric"
            />
            <FormSelect
              label="Mietzeitraum"
              options={rentalPeriodOptions}
              value={rentalPeriod}
              onChange={setRentalPeriod}
              placeholder="Zeitraum auswählen..."
            />
            <FormInput
              label="Verfügbar ab"
              value={availableFrom}
              onChangeText={setAvailableFrom}
              placeholder="JJJJ-MM-TT"
            />
            <FormToggle label="Aktuell vermietet" value={isRented} onChange={setIsRented} />
            <FormInput
              label="Mietrendite (%)"
              value={rentalYield}
              onChangeText={setRentalYield}
              placeholder="z.B. 5.5"
              keyboardType="numeric"
            />
          </CollapsibleSection>
        )}

        {/* Beschreibung */}
        <SectionLabel text="Beschreibung & Notizen" />
        <FormInput
          label="Beschreibung"
          value={description}
          onChangeText={setDescription}
          placeholder="Beschreibung der Immobilie..."
          multiline
          numberOfLines={4}
        />
        <FormInput
          label="Interne Notizen"
          value={notes}
          onChangeText={setNotes}
          placeholder="Notizen für interne Verwendung..."
          multiline
          numberOfLines={3}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Änderungen speichern"
            onPress={handleSubmit}
            loading={updateProperty.isPending}
            disabled={updateProperty.isPending}
          />
          <Button
            title="Abbrechen"
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
