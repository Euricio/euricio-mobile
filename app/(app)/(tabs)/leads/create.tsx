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
import { useCreateLead } from '../../../../lib/api/leads';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { colors, spacing } from '../../../../constants/theme';

const sourceOptions = [
  { value: 'website', label: 'Website' },
  { value: 'telefon', label: 'Telefon' },
  { value: 'empfehlung', label: 'Empfehlung' },
  { value: 'portal', label: 'Portal' },
  { value: 'sonstige', label: 'Sonstige' },
];

export default function CreateLeadScreen() {
  const createLead = useCreateLead();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload: Record<string, unknown> = {
      full_name: name.trim(),
      status: 'new',
    };
    if (email.trim()) payload.email = email.trim();
    if (phone.trim()) payload.phone = phone.trim();
    if (source) payload.source = source;
    if (notes.trim()) payload.notes = notes.trim();

    createLead.mutate(
      payload as any,
      {
        onSuccess: () => {
          router.back();
        },
        onError: (error) => {
          Alert.alert('Fehler', 'Lead konnte nicht erstellt werden. Bitte versuchen Sie es erneut.');
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
          headerTitle: 'Neuer Lead',
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
          label="Name"
          required
          value={name}
          onChangeText={setName}
          placeholder="Vor- und Nachname"
          error={errors.name}
          autoCapitalize="words"
        />
        <FormInput
          label="E-Mail"
          value={email}
          onChangeText={setEmail}
          placeholder="email@beispiel.de"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormInput
          label="Telefon"
          value={phone}
          onChangeText={setPhone}
          placeholder="+49 123 456789"
          keyboardType="phone-pad"
        />
        <FormSelect
          label="Quelle"
          options={sourceOptions}
          value={source}
          onChange={setSource}
          placeholder="Quelle auswählen..."
        />
        <FormInput
          label="Notizen"
          value={notes}
          onChangeText={setNotes}
          placeholder="Zusätzliche Informationen..."
          multiline
          numberOfLines={4}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Lead erstellen"
            onPress={handleSubmit}
            loading={createLead.isPending}
            disabled={createLead.isPending}
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
