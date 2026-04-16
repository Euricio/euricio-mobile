import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchVoiceStatus,
  connectVoice,
  disconnectVoice,
  fetchVoiceNumbers,
  fetchPermissions,
  updatePermissions,
  makeTestCall,
  VoiceNumber,
  TeamMemberPermission,
} from '../../../lib/voice/voiceApi';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { useI18n } from '../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme';

export default function VoiceSettings() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['voice-status'],
    queryFn: fetchVoiceStatus,
  });

  const { data: numbersData } = useQuery({
    queryKey: ['voice-numbers'],
    queryFn: fetchVoiceNumbers,
    enabled: !!status?.connected,
  });

  const { data: permsData } = useQuery({
    queryKey: ['voice-permissions'],
    queryFn: fetchPermissions,
    enabled: !!status?.connected,
  });

  // Connection form
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [twimlAppSid, setTwimlAppSid] = useState('');
  const [testNumber, setTestNumber] = useState('');

  const connectMut = useMutation({
    mutationFn: () =>
      connectVoice({
        account_sid: accountSid,
        auth_token: authToken,
        twiml_app_sid: twimlAppSid,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voice-status'] });
      qc.invalidateQueries({ queryKey: ['voice-numbers'] });
      Alert.alert(t('voice_success'), t('voice_connectionSuccess'));
    },
    onError: () => Alert.alert(t('voice_error'), t('voice_connectionFailed')),
  });

  const disconnectMut = useMutation({
    mutationFn: disconnectVoice,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voice-status'] });
      Alert.alert(t('voice_success'), t('voice_disconnectedSuccess'));
    },
  });

  const testCallMut = useMutation({
    mutationFn: () => makeTestCall(testNumber),
    onSuccess: () => Alert.alert(t('voice_success'), t('voice_testCallStarted')),
    onError: () => Alert.alert(t('voice_error'), t('voice_testCallFailed')),
  });

  const togglePermission = useMutation({
    mutationFn: (member: TeamMemberPermission) =>
      updatePermissions({
        user_id: member.id,
        enabled: !member.voice_enabled,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice-permissions'] }),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerTitle: t('voice_settings') }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('voice_settings') }} />

      {/* Connection status */}
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="link-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('voice_twilioConnection')}</Text>
        </View>

        {status?.connected ? (
          <View>
            <View style={styles.connectedRow}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={styles.connectedText}>{t('voice_connected')}</Text>
            </View>
            {status.account_sid && (
              <Text style={styles.sidText}>SID: ...{status.account_sid.slice(-6)}</Text>
            )}
            <Button
              title={t('voice_disconnect')}
              onPress={() =>
                Alert.alert(t('voice_disconnect'), t('voice_disconnectConfirm'), [
                  { text: t('cancel'), style: 'cancel' },
                  {
                    text: t('voice_disconnect'),
                    style: 'destructive',
                    onPress: () => disconnectMut.mutate(),
                  },
                ])
              }
              variant="danger"
              size="sm"
              style={{ marginTop: 12 }}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <FormInput
              label="Account SID"
              value={accountSid}
              onChangeText={setAccountSid}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              autoCapitalize="none"
            />
            <FormInput
              label="Auth Token"
              value={authToken}
              onChangeText={setAuthToken}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              secureTextEntry
              autoCapitalize="none"
            />
            <FormInput
              label="TwiML App SID"
              value={twimlAppSid}
              onChangeText={setTwimlAppSid}
              placeholder="APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              autoCapitalize="none"
            />
            <Button
              title={t('voice_connect')}
              onPress={() => connectMut.mutate()}
              loading={connectMut.isPending}
              disabled={!accountSid || !authToken || !twimlAppSid}
              size="lg"
              style={{ marginTop: 8 }}
            />
          </View>
        )}
      </Card>

      {/* Phone numbers */}
      {status?.connected && numbersData?.numbers && (
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('voice_phoneNumbers')}</Text>
          </View>
          {numbersData.numbers.length === 0 ? (
            <Text style={styles.emptyText}>{t('voice_noNumbers')}</Text>
          ) : (
            numbersData.numbers.map((num) => (
              <View key={num.id} style={styles.numberRow}>
                <Text style={styles.numberText}>{num.phone_number}</Text>
                <Text style={styles.numberName}>{num.friendly_name}</Text>
                {num.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </Card>
      )}

      {/* Team permissions */}
      {status?.connected && permsData?.members && (
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('voice_teamPermissions')}</Text>
          </View>
          {permsData.members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.full_name || member.email}
                </Text>
                {member.email && member.full_name && (
                  <Text style={styles.memberEmail}>{member.email}</Text>
                )}
              </View>
              <Switch
                value={member.voice_enabled}
                onValueChange={() => togglePermission.mutate(member)}
                trackColor={{ true: colors.success }}
              />
            </View>
          ))}
        </Card>
      )}

      {/* Test call */}
      {status?.connected && (
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flask-outline" size={20} color={colors.warning} />
            <Text style={styles.sectionTitle}>{t('voice_testCall')}</Text>
          </View>
          <FormInput
            label={t('voice_testNumber')}
            value={testNumber}
            onChangeText={setTestNumber}
            placeholder="+49..."
            keyboardType="phone-pad"
          />
          <Button
            title={t('voice_startTestCall')}
            onPress={() => testCallMut.mutate()}
            loading={testCallMut.isPending}
            disabled={!testNumber}
            size="sm"
            style={{ marginTop: 8 }}
          />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectedText: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: fontWeight.medium,
  },
  sidText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  form: {
    gap: 12,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  numberText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  numberName: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  defaultBadge: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  memberEmail: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
});
