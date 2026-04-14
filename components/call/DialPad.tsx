import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

interface DialPadProps {
  onDial: (number: string) => void;
  onDigitPress?: (digit: string) => void;
}

export function DialPad({ onDial, onDigitPress }: DialPadProps) {
  const [number, setNumber] = useState('');

  const handlePress = (digit: string) => {
    setNumber((prev) => prev + digit);
    onDigitPress?.(digit);
  };

  const handleDelete = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.display}>{number || 'Nummer eingeben'}</Text>

      {KEYS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((digit) => (
            <TouchableOpacity key={digit} style={styles.key} onPress={() => handlePress(digit)}>
              <Text style={styles.keyText}>{digit}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.row}>
        <TouchableOpacity style={styles.key} onPress={handleDelete}>
          <Text style={styles.keyText}>{'<'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.key, styles.callKey]}
          onPress={() => number && onDial(number)}
        >
          <Text style={[styles.keyText, styles.callKeyText]}>Anrufen</Text>
        </TouchableOpacity>
        <View style={styles.key} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  display: { fontSize: 28, textAlign: 'center', marginBottom: 24, color: Colors.text, fontWeight: '300', letterSpacing: 2 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12 },
  key: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 24, color: Colors.text, fontWeight: '500' },
  callKey: { backgroundColor: Colors.callActive },
  callKeyText: { fontSize: 14, color: Colors.textInverse },
});
