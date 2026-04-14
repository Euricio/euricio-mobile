import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { LeadActions } from '../../../../components/leads/LeadActions';
import { Badge } from '../../../../components/common/Badge';
import { Card } from '../../../../components/common/Card';
import { getLead, Lead } from '../../../../lib/api/leads';
import { useVoice } from '../../../../hooks/useVoice';
import { Colors } from '../../../../constants/colors';

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const { makeCall } = useVoice();

  useEffect(() => {
    if (id) {
      getLead(id).then(({ data }) => {
        setLead(data as Lead);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1, justifyContent: 'center' }} />;
  }

  if (!lead) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Lead nicht gefunden.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: lead.name, headerShown: true }} />

      <View style={styles.header}>
        <Text style={styles.name}>{lead.name}</Text>
        <Badge label={lead.status} variant="info" />
      </View>

      <LeadActions
        onCall={() => lead.phone && makeCall(lead.phone)}
        onWhatsApp={() => { /* TODO: WhatsApp Deep Link */ }}
        onEmail={() => { /* TODO: Email */ }}
        onTask={() => { /* TODO: Aufgabe erstellen */ }}
      />

      <Card title="Kontaktdaten">
        {lead.phone && <DetailRow label="Telefon" value={lead.phone} />}
        {lead.email && <DetailRow label="E-Mail" value={lead.email} />}
        {lead.source && <DetailRow label="Quelle" value={lead.source} />}
      </Card>

      <Card title="Aktivität">
        <Text style={styles.placeholder}>Aktivitäts-Timeline wird hier angezeigt...</Text>
      </Card>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 24, fontWeight: '700', color: Colors.text },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  detailLabel: { fontSize: 14, color: Colors.textSecondary },
  detailValue: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  placeholder: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic', paddingVertical: 16 },
  error: { fontSize: 16, color: Colors.error, textAlign: 'center', marginTop: 48 },
});
