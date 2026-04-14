import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Badge } from '../common/Badge';
import { Colors } from '../../constants/colors';

interface LeadCardProps {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  source: string | null;
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  new: 'info',
  contacted: 'default',
  qualified: 'warning',
  proposal: 'warning',
  won: 'success',
  lost: 'error',
};

const statusLabel: Record<string, string> = {
  new: 'Neu',
  contacted: 'Kontaktiert',
  qualified: 'Qualifiziert',
  proposal: 'Angebot',
  won: 'Gewonnen',
  lost: 'Verloren',
};

export function LeadCard({ id, name, phone, status, source }: LeadCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/(tabs)/leads/${id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Badge label={statusLabel[status] ?? status} variant={statusVariant[status] ?? 'default'} />
      </View>
      {phone && <Text style={styles.phone}>{phone}</Text>}
      {source && <Text style={styles.source}>Quelle: {source}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.borderLight },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text, flex: 1 },
  phone: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  source: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});
