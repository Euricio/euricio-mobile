import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  useTelegramMessages,
  useTelegramConversations,
  useSendTelegramMessage,
  useAssignTelegramConversation,
} from '../../../lib/api/telegram';
import type { TelegramMessage } from '../../../lib/api/telegram';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

const TELEGRAM_BLUE = '#0088cc';

export default function TelegramChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, formatDate } = useI18n();
  const [message, setMessage] = useState('');

  const { data: conversations } = useTelegramConversations();
  const conversation = conversations?.find((c) => c.id === id);
  const { data: messages, isLoading } = useTelegramMessages(id);
  const sendMessage = useSendTelegramMessage();

  const contactName = conversation?.contact_name || conversation?.chat_id || '—';

  const handleSend = useCallback(() => {
    if (!message.trim() || !id) return;
    sendMessage.mutate(
      { conversationId: id, body: message.trim() },
      {
        onSuccess: () => setMessage(''),
        onError: () => Alert.alert(t('error'), t('telegram_sendError')),
      },
    );
  }, [message, id, sendMessage, t]);

  const renderMessage = useCallback(
    ({ item }: { item: TelegramMessage }) => {
      const isOutgoing = item.direction === 'outbound';
      return (
        <View
          style={[
            styles.bubbleWrapper,
            isOutgoing ? styles.bubbleRight : styles.bubbleLeft,
          ]}
        >
          <View
            style={[
              styles.bubble,
              isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
            ]}
          >
            {item.body && (
              <Text
                style={[
                  styles.bubbleText,
                  isOutgoing && styles.bubbleTextOutgoing,
                ]}
              >
                {item.body}
              </Text>
            )}
            <Text
              style={[
                styles.bubbleTime,
                isOutgoing && styles.bubbleTimeOutgoing,
              ]}
            >
              {formatDate(item.created_at, {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      );
    },
    [formatDate],
  );

  if (isLoading) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          headerTitle: contactName,
          headerRight: () => (
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons
                name="person-add-outline"
                size={22}
                color={colors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {conversation?.entity_type && (
        <View style={styles.linkedBanner}>
          <Ionicons name="link-outline" size={14} color={colors.info} />
          <Text style={styles.linkedText}>
            {conversation.entity_type}
          </Text>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.messageList}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder={t('telegram_messageHint')}
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={4096}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!message.trim() || sendMessage.isPending}
          style={[
            styles.sendButton,
            (!message.trim() || sendMessage.isPending) && styles.sendButtonDisabled,
          ]}
        >
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBtn: { paddingHorizontal: spacing.sm },
  linkedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.info + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  linkedText: { fontSize: fontSize.xs, color: colors.info },
  messageList: { padding: spacing.md, paddingBottom: spacing.sm },
  bubbleWrapper: { marginBottom: spacing.sm, maxWidth: '80%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleIncoming: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleOutgoing: {
    backgroundColor: TELEGRAM_BLUE,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 20,
  },
  bubbleTextOutgoing: { color: colors.white },
  bubbleTime: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeOutgoing: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TELEGRAM_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
});
