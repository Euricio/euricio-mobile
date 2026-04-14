import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface ChatBubbleProps {
  message: string;
  timestamp: string;
  isOutgoing: boolean;
  channel?: 'whatsapp' | 'telegram' | 'sms';
}

export function ChatBubble({ message, timestamp, isOutgoing, channel }: ChatBubbleProps) {
  return (
    <View style={[styles.container, isOutgoing ? styles.outgoing : styles.incoming]}>
      {channel && (
        <Text style={styles.channel}>
          {channel === 'whatsapp' ? 'WhatsApp' : channel === 'telegram' ? 'Telegram' : 'SMS'}
        </Text>
      )}
      <Text style={[styles.message, isOutgoing && styles.outgoingText]}>{message}</Text>
      <Text style={[styles.time, isOutgoing && styles.outgoingTime]}>{timestamp}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { maxWidth: '80%', padding: 12, borderRadius: 16, marginVertical: 4, marginHorizontal: 16 },
  incoming: { backgroundColor: Colors.backgroundSecondary, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  outgoing: { backgroundColor: Colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  channel: { fontSize: 10, color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase' },
  message: { fontSize: 15, color: Colors.text, lineHeight: 20 },
  outgoingText: { color: Colors.textInverse },
  time: { fontSize: 11, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  outgoingTime: { color: 'rgba(255,255,255,0.7)' },
});
