import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useCreateTicket } from '../../../lib/api/feedback';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import { Button } from '../../../components/ui/Button';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
} from '../../../constants/theme';

export default function CreateFeedbackScreen() {
  const { t } = useI18n();
  const createTicket = useCreateTicket();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('bug');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryOptions = [
    { value: 'bug', label: t('feedback_category_bug') },
    { value: 'feature', label: t('feedback_category_feature') },
    { value: 'question', label: t('feedback_category_question') },
    { value: 'other', label: t('feedback_category_other') },
  ];

  const priorityOptions = [
    { value: 'low', label: t('priority_low') },
    { value: 'medium', label: t('priority_medium') },
    { value: 'high', label: t('priority_high') },
    { value: 'urgent', label: t('priority_urgent') },
  ];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!subject.trim()) e.subject = t('feedback_subjectRequired');
    if (!description.trim()) e.description = t('feedback_descriptionRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createTicket.mutate(
      {
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('error'), t('feedback_createError')),
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerTitle: t('feedback_create') }} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <FormInput
          label={t('feedback_subject')}
          required
          value={subject}
          onChangeText={setSubject}
          placeholder={t('feedback_subjectPlaceholder')}
          error={errors.subject}
        />

        <FormSelect
          label={t('feedback_category')}
          options={categoryOptions}
          value={category}
          onChange={setCategory}
        />

        <FormSelect
          label={t('feedback_priority')}
          options={priorityOptions}
          value={priority}
          onChange={setPriority}
        />

        <FormInput
          label={t('feedback_description')}
          required
          value={description}
          onChangeText={setDescription}
          placeholder={t('feedback_descriptionPlaceholder')}
          error={errors.description}
          multiline
          numberOfLines={5}
        />

        <View style={styles.buttons}>
          <Button
            title={t('feedback_submit')}
            onPress={handleSubmit}
            loading={createTicket.isPending}
            disabled={createTicket.isPending}
            size="lg"
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
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120 },
  buttons: { gap: spacing.sm, marginTop: spacing.md },
});
