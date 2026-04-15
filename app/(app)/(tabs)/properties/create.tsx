import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useCreateProperty } from '../../../../lib/api/properties';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { colors, spacing } from '../../../../constants/theme';

const typeOptions = [
  { value: 'apartment', label: 'Wohnung' },
  { value: 'house', label: 'Haus' },
  { value: 'villa', label: 'Villa' },
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

export default function CreatePropertyScreen() {
  const createProperty = useCreateProperty();

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [rooms, setRooms] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('available');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    createProperty.mutate(
      {
        title: title.trim(),
        address: address.trim() || null,
        city: city.trim() || null,
        price: price ? parseFloat(price) : null,
        size_m2: size ? parseFloat(size) : null,
        rooms: rooms ? parseInt(rooms, 10) : null,
        property_type: type || null,
        status: status || 'available',
        description: description.trim() || null,
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: () => {
          Alert.alert('Fehler', 'Immobilie konnte nicht erstellt werden. Bitte versuchen Sie es erneut.');
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerTitle: 'Neue Immobilie',
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <FormInput
          label="Titel"
          required
          value={title}
          onChangeText={setTitle}
          placeholder="z.B. 3-Zimmer-Wohnung in Mitte"
          error={errors.title}
        />
        <FormInput
          label="Adresse"
          value={address}
          onChangeText={setAddress}
          placeholder="Straße und Hausnummer"
        />
        <FormInput
          label="Stadt"
          value={city}
          onChangeText={setCity}
          placeholder="z.B. Berlin"
        />
        <FormInput
          label="Preis (EUR)"
          value={price}
          onChangeText={setPrice}
          placeholder="z.B. 350000"
          keyboardType="numeric"
        />
        <FormInput
          label="Fläche (m²)"
          value={size}
          onChangeText={setSize}
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
        <FormSelect
          label="Typ"
          options={typeOptions}
          value={type}
          onChange={setType}
          placeholder="Immobilientyp auswählen..."
        />
        <FormSelect
          label="Status"
          options={statusOptions}
          value={status}
          onChange={setStatus}
        />
        <FormInput
          label="Beschreibung"
          value={description}
          onChangeText={setDescription}
          placeholder="Beschreibung der Immobilie..."
          multiline
          numberOfLines={4}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Immobilie erstellen"
            onPress={handleSubmit}
            loading={createProperty.isPending}
            disabled={createProperty.isPending}
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
  buttonContainer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
