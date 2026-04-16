import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAudioAssets,
  uploadAudioAsset,
  deleteAudioAsset,
  AudioAsset,
} from '../../../lib/voice/voiceApi';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useI18n } from '../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme';

export default function AudioScreen() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['voice-audio'],
    queryFn: fetchAudioAssets,
  });

  const uploadMut = useMutation({
    mutationFn: async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'audio/mpeg',
      } as unknown as Blob);

      return uploadAudioAsset(formData);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice-audio'] }),
    onError: () => Alert.alert(t('voice_error'), t('voice_uploadFailed')),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAudioAsset,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voice-audio'] }),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerTitle: t('voice_audioAssets') }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const assets = data?.assets || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('voice_audioAssets') }} />

      <Button
        title={t('voice_uploadAudio')}
        onPress={() => uploadMut.mutate()}
        loading={uploadMut.isPending}
        icon={<Ionicons name="cloud-upload-outline" size={18} color={colors.white} />}
        style={{ marginBottom: spacing.md }}
      />

      {assets.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="musical-notes-outline" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>{t('voice_noAudioAssets')}</Text>
        </View>
      ) : (
        assets.map((asset) => (
          <Card key={asset.id} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.audioIcon}>
                <Ionicons name="musical-note" size={20} color={colors.primary} />
              </View>
              <View style={styles.audioInfo}>
                <Text style={styles.audioName}>{asset.name}</Text>
                <Text style={styles.audioMeta}>
                  {asset.type}
                  {asset.duration ? ` · ${Math.round(asset.duration)}s` : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    t('voice_deleteAudio'),
                    t('voice_deleteAudioConfirm'),
                    [
                      { text: t('cancel'), style: 'cancel' },
                      {
                        text: t('voice_delete'),
                        style: 'destructive',
                        onPress: () => deleteMut.mutate(asset.id),
                      },
                    ]
                  )
                }
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  card: { marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioInfo: { flex: 1 },
  audioName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  audioMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
});
