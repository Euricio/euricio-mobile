import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, fontSize, fontWeight, borderRadius, spacing, shadow } from '../../../../constants/theme';
import { ScoreCard } from '../../../../components/contributor/ScoreCard';
import { VisibilityToggle } from '../../../../components/contributor/VisibilityToggle';
import { apiGet, apiPatch } from '../../../../lib/contributor/api';
import type {
  ContributorProfile, ContributorScore, ProfileVisibility, Contribution, RewardGrant,
} from '../../../../lib/contributor/types';

type MeResponse = {
  user_id: string;
  profile: ContributorProfile;
  score: ContributorScore;
  rank: { id: number; name: string };
  grants: RewardGrant[];
};

export default function Profile() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [mine, setMine] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [region, setRegion] = useState('');
  const [visibility, setVisibility] = useState<ProfileVisibility>('private');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGet<MeResponse>('/api/contributor/me'),
      apiGet<{ items: Contribution[] }>('/api/contributions?author=me').catch(() => ({ items: [] })),
    ]).then(([meJson, mineJson]) => {
      setMe(meJson);
      setMine(mineJson.items ?? []);
      setDisplayName(meJson.profile?.display_name ?? '');
      setBio(meJson.profile?.bio ?? '');
      setRegion(meJson.profile?.region ?? '');
      setVisibility(meJson.profile?.visibility ?? 'private');
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiPatch('/api/contributor/me', { display_name: displayName, bio, region, visibility });
      Alert.alert('Guardado', 'Tu perfil se ha actualizado.');
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally { setSaving(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!me) return <View style={styles.center}><Text style={styles.dim}>No se ha podido cargar.</Text></View>;

  return (
    <>
      <Stack.Screen options={{ title: 'Mi perfil' }} />
      <ScrollView style={styles.root} contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <ScoreCard score={me.score} />

        <View style={styles.card}>
          <Text style={styles.section}>Perfil</Text>
          <Text style={styles.label}>Nombre público</Text>
          <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Cómo quieres aparecer" placeholderTextColor={colors.textTertiary} />
          <Text style={styles.label}>Bio</Text>
          <TextInput style={[styles.input, styles.textarea]} value={bio} onChangeText={setBio} placeholder="Breve descripción" placeholderTextColor={colors.textTertiary} multiline />
          <Text style={styles.label}>Región</Text>
          <TextInput style={styles.input} value={region} onChangeText={setRegion} placeholder="Ej. Madrid" placeholderTextColor={colors.textTertiary} />
          <Text style={[styles.label, { marginBottom: spacing.sm }]}>Visibilidad</Text>
          <VisibilityToggle value={visibility} onChange={setVisibility} />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={save}
            disabled={saving}
            style={[styles.save, saving && { opacity: 0.6 }]}
          >
            <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>

        {me.grants && me.grants.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.section}>Mis recompensas</Text>
            {me.grants.map((g) => (
              <View key={g.id} style={styles.grantRow}>
                <View>
                  <Text style={styles.grantTitle}>{g.discount_pct}% de descuento — Rango {g.rank_id}</Text>
                  {g.stripe_coupon_id && <Text style={styles.grantCoupon}>Cupón: {g.stripe_coupon_id}</Text>}
                </View>
                <Text style={styles.grantStatus}>{g.status}</Text>
              </View>
            ))}
          </View>
        )}

        {mine.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.section}>Mis contribuciones</Text>
            {mine.slice(0, 10).map((c) => {
              const isIdea = c.type === 'feature_idea' || c.type === 'workflow_idea';
              const href = isIdea ? `/contribute/ideas/${c.id}` : `/contribute/feedback/${c.id}`;
              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.7}
                  onPress={() => router.push(href as never)}
                  style={styles.mineRow}
                >
                  <Text style={styles.mineTitle} numberOfLines={1}>{c.title}</Text>
                  <Text style={styles.mineMeta}>
                    {c.type} · {new Date(c.created_at).toLocaleDateString('es-ES')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  dim: { color: colors.textTertiary },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, ...shadow.sm,
  },
  section: {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5,
    color: colors.textTertiary, marginBottom: spacing.sm,
  },
  label: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium, marginTop: spacing.sm, marginBottom: 5 },
  input: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.sm, padding: spacing.sm, fontSize: fontSize.sm, color: colors.text,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  save: {
    marginTop: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.sm,
    padding: spacing.md, alignItems: 'center',
  },
  saveText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  grantRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  grantTitle: { fontSize: fontSize.sm, color: colors.text },
  grantCoupon: { fontSize: 11, color: colors.textTertiary, marginTop: 2, fontFamily: 'monospace' },
  grantStatus: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  mineRow: {
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  mineTitle: { fontSize: fontSize.sm, color: colors.text },
  mineMeta: { fontSize: 11, color: colors.textTertiary, marginTop: 3 },
});
