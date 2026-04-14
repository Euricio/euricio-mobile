import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Card } from '../../../components/common/Card';
import { Colors } from '../../../constants/colors';

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Guten Morgen!</Text>
      <Text style={styles.date}>{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

      {/* Verpasste Anrufe */}
      <Card title="Verpasste Anrufe" onPress={() => router.push('/(app)/(tabs)/tasks')}>
        <View style={styles.statRow}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Rückrufe offen</Text>
        </View>
      </Card>

      {/* Heutige Aufgaben */}
      <Card title="Heutige Aufgaben">
        <View style={styles.taskItem}>
          <View style={[styles.dot, { backgroundColor: Colors.error }]} />
          <Text style={styles.taskText}>Rückruf: +49 170 123 4567</Text>
        </View>
        <View style={styles.taskItem}>
          <View style={[styles.dot, { backgroundColor: Colors.warning }]} />
          <Text style={styles.taskText}>Besichtigung Villa Marbella vorbereiten</Text>
        </View>
        <View style={styles.taskItem}>
          <View style={[styles.dot, { backgroundColor: Colors.info }]} />
          <Text style={styles.taskText}>Exposé an Hr. Müller senden</Text>
        </View>
      </Card>

      {/* Neue Leads */}
      <Card title="Neue Leads" onPress={() => router.push('/(app)/(tabs)/leads')}>
        <View style={styles.statRow}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>diese Woche</Text>
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionText}>Anruf starten</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Text style={styles.quickActionText}>Lead anlegen</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { padding: 16 },
  greeting: { fontSize: 28, fontWeight: '700', color: Colors.text, marginTop: 8 },
  date: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  statNumber: { fontSize: 32, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: 14, color: Colors.textSecondary },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  taskText: { fontSize: 14, color: Colors.text, flex: 1 },
  quickActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  quickAction: { flex: 1, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  quickActionText: { color: Colors.textInverse, fontSize: 14, fontWeight: '600' },
});
