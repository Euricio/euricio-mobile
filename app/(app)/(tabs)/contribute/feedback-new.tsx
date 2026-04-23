import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, spacing } from '../../../../constants/theme';
import { ContributionForm } from '../../../../components/contributor/ContributionForm';

export default function FeedbackNew() {
  return (
    <>
      <Stack.Screen options={{ title: 'Nueva contribución' }} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <ContributionForm
            mode="feedback"
            onSubmitted={(id) => router.replace(`/contribute/feedback/${id}` as never)}
          />
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md },
});
