import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../../../constants/colors';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Objekt-Details', headerShown: true }} />
      <Text style={styles.placeholder}>Immobilien-Details für ID: {id}</Text>
      <Text style={styles.hint}>Fotos, Beschreibung, Preis, Standort, zugeordnete Leads.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center', padding: 32 },
  placeholder: { fontSize: 18, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  hint: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
