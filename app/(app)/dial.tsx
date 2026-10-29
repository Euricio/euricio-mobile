import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../lib/i18n';
import { useCallChoice } from '../../lib/call/useCallChoice';
import { normalizePhone, readRawNumber } from '../../lib/call/phone';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

/**
 * Click-to-call entry point.
 *
 *   https://crm.euricio.es/dial?number=…   (Universal Link, see AASA "/dial")
 *   euricio://dial?number=…                (custom scheme)
 *
 * Pipedrive inserts the number as stored ("+34 922 12 34 56"). Query parsers
 * turn a literal "+" into a space, so we read the raw URL first and only fall
 * back to the parsed route param.
 *
 * The call is placed through the normal call-choice sheet, so the business
 * (Twilio) number is used exactly as for calls started inside the app, and the
 * backend logs it to Pipedrive automatically.
 */
export default function DialScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ number?: string }>();
  const url = Linking.useURL();
  const { promptCall, CallChoiceSheet } = useCallChoice();
  const prompted = useRef(false);

  const number = useMemo(() => {
    const fromUrl = url ? readRawNumber(url.slice(url.indexOf('?'))) : '';
    const raw = fromUrl || (typeof params.number === 'string' ? params.number : '');
    return normalizePhone(raw, '34');
  }, [url, params.number]);

  useEffect(() => {
    if (number && !prompted.current) {
      prompted.current = true;
      promptCall(number);
    }
  }, [number, promptCall]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('dial_title')}</Text>
      {number ? (
        <>
          <Text style={styles.number}>{number}</Text>
          <Text style={styles.hint}>{t('dial_hint_logging')}</Text>
          <TouchableOpacity style={styles.callButton} onPress={() => promptCall(number)} accessibilityRole="button">
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.callText}>{t('dial_call_now')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.error}>{t('dial_invalid_number')}</Text>
      )}
      <TouchableOpacity onPress={() => router.replace('/(app)/(tabs)')} style={styles.back}>
        <Text style={styles.backText}>{t('dial_back')}</Text>
      </TouchableOpacity>
      <CallChoiceSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.background },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  number: { fontSize: 30, fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.sm },
  hint: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.lg },
  error: { fontSize: fontSize.md, color: colors.error, marginTop: spacing.md },
  callButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.success, paddingVertical: spacing.md, borderRadius: borderRadius.lg,
  },
  callText: { color: '#fff', fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  back: { marginTop: spacing.lg, alignItems: 'center' },
  backText: { color: colors.textSecondary, fontSize: fontSize.sm },
});
