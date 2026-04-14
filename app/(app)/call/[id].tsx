import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CallScreen } from '../../../components/call/CallScreen';
import { Colors } from '../../../constants/colors';

export default function ActiveCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // In der vollständigen Implementierung: Lead-Daten laden und anzeigen
  return (
    <View style={styles.container}>
      <CallScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primaryDark },
});
