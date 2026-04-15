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
  Modal,
  FlatList,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateTask } from '../../../../lib/api/tasks';
import { useLeads, Lead } from '../../../../lib/api/leads';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { Button } from '../../../../components/ui/Button';
import { SearchBar } from '../../../../components/ui/SearchBar';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';

const typeOptions = [
  { value: 'callback', label: 'Rückruf' },
  { value: 'follow_up', label: 'Nachfassen' },
  { value: 'meeting', label: 'Termin' },
  { value: 'general', label: 'Allgemein' },
];

const priorityOptions = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
];

function formatDateDE(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function CreateTaskScreen() {
  const createTask = useCreateTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadPickerOpen, setLeadPickerOpen] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: leads } = useLeads(leadSearch);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }
    if (dueDate && !/^\d{2}\.\d{2}\.\d{4}$/.test(dueDate)) {
      newErrors.dueDate = 'Format: TT.MM.JJJJ';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const parseDateDE = (dateStr: string): string | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    createTask.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        task_type: type,
        priority,
        status: 'open',
        due_date: parseDateDE(dueDate),
        lead_id: selectedLead?.id || null,
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: () => {
          Alert.alert('Fehler', 'Aufgabe konnte nicht erstellt werden. Bitte versuchen Sie es erneut.');
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
          headerTitle: 'Neue Aufgabe',
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
          placeholder="Aufgabe beschreiben..."
          error={errors.title}
        />
        <FormInput
          label="Beschreibung"
          value={description}
          onChangeText={setDescription}
          placeholder="Details zur Aufgabe..."
          multiline
          numberOfLines={4}
        />
        <FormSelect
          label="Typ"
          options={typeOptions}
          value={type}
          onChange={setType}
        />
        <FormSelect
          label="Priorität"
          options={priorityOptions}
          value={priority}
          onChange={setPriority}
        />
        <FormInput
          label="Fälligkeitsdatum"
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="TT.MM.JJJJ"
          keyboardType="numeric"
          error={errors.dueDate}
        />

        {/* Lead Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Kontakt (optional)</Text>
          <TouchableOpacity
            style={styles.leadSelector}
            activeOpacity={0.7}
            onPress={() => setLeadPickerOpen(true)}
          >
            <Text
              style={[
                styles.leadSelectorText,
                !selectedLead && styles.placeholder,
              ]}
            >
              {selectedLead ? selectedLead.full_name : 'Lead auswählen...'}
            </Text>
            {selectedLead ? (
              <TouchableOpacity
                onPress={() => setSelectedLead(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Aufgabe erstellen"
            onPress={handleSubmit}
            loading={createTask.isPending}
            disabled={createTask.isPending}
          />
          <Button
            title="Abbrechen"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>

      {/* Lead Picker Modal */}
      <Modal visible={leadPickerOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setLeadPickerOpen(false)}
        >
          <View style={styles.leadPickerModal}>
            <Text style={styles.leadPickerTitle}>Kontakt auswählen</Text>
            <View style={styles.leadPickerSearch}>
              <SearchBar
                value={leadSearch}
                onChangeText={setLeadSearch}
                placeholder="Lead suchen..."
              />
            </View>
            <FlatList
              data={leads}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.leadOption,
                    item.id === selectedLead?.id && styles.leadOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedLead(item);
                    setLeadPickerOpen(false);
                    setLeadSearch('');
                  }}
                >
                  <View>
                    <Text style={styles.leadOptionName}>{item.full_name}</Text>
                    {item.phone && (
                      <Text style={styles.leadOptionPhone}>{item.phone}</Text>
                    )}
                  </View>
                  {item.id === selectedLead?.id && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Keine Leads gefunden</Text>
              }
              style={styles.leadList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: spacing.xxl,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  leadSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  leadSelectorText: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textTertiary,
  },
  buttonContainer: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  leadPickerModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    maxHeight: 500,
    ...shadow.lg,
  },
  leadPickerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  leadPickerSearch: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  leadList: {
    maxHeight: 300,
  },
  leadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  leadOptionActive: {
    backgroundColor: colors.background,
  },
  leadOptionName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  leadOptionPhone: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
