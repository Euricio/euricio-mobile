import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useLead, useUpdateLead } from '../../../../lib/api/leads';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import { colors, spacing } from '../../../../constants/theme';

const sourceOptions = [
  { value: 'website', label: 'Website' },
  { value: 'telefon', label: 'Telefon' },
  { value: 'empfehlung', label: 'Empfehlung' },
  { value: 'portal', label: 'Portal' },
  { value: 'sonstige', label: 'Sonstige' },
];

const statusOptions = [
  { value: 'new', label: 'Neu' },
  { value: 'contacted', label: 'Kontaktiert' },
  { value: 'qualified', label: 'Qualifiziert' },
  { value: 'lost', label: 'Verloren' },
];

export default function EditLeadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lead, isLoading } = useLead(id!);
  const updateLead = useUpdateLead();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('new');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (lead) {
      setName(lead.full_name ?? '');
      setEmail(lead.email ?? '');
      setPhone(lead.phone ?? '');
      setSource(lead.source ?? '');
      setNotes(lead.notes ?? '');
      setStatus(lead.status ?? 'new');
    }
  }, [lead]);

  if (isLoading) {
    return <LoadingScreen />;
  }

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

    updateLead.mutate(
      {
        id: id!,
        full_name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        source: source || null,
        notes: notes.trim() || null,
        status,
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: () => {
          Alert.alert(
            'Fehler',
            'Lead konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.',
          );
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
          headerTitle: 'Lead bearbeiten',
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
          label="Status"
          options={statusOptions}
          value={status}
          onChange={setStatus}
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
            title="Speichern"
            onPress={handleSubmit}
            loading={updateLead.isPending}
            disabled={updateLead.isPending}
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
