import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import CallLogList from '../../../components/voice/CallLogList';
import { useI18n } from '../../../lib/i18n';
import { colors } from '../../../constants/theme';

export default function CallLogsScreen() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: t('voice_callLogs') }} />
      <CallLogList limit={100} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
