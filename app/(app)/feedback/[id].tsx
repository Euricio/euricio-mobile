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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  useFeedbackTicket,
  useAddComment,
  useUpdateTicketStatus,
} from '../../../lib/api/feedback';
import type { FeedbackComment } from '../../../lib/api/feedback';
import { useProfile } from '../../../lib/api/profile';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { FormSelect } from '../../../components/ui/FormSelect';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../constants/theme';

const CATEGORY_VARIANT: Record<string, 'error' | 'info' | 'warning' | 'default'> = {
  bug: 'error',
  feature: 'info',
  question: 'warning',
  other: 'default',
};

const PRIORITY_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  urgent: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default',
};

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'default',
};

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

function CommentItem({ comment, formatDate }: { comment: FeedbackComment; formatDate: (date: string, opts?: Intl.DateTimeFormatOptions) => string }) {
  const initial = comment.user_name
    ? comment.user_name.charAt(0).toUpperCase()
    : '?';

  return (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>{initial}</Text>
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUser}>{comment.user_name || '—'}</Text>
          <Text style={styles.commentDate}>
            {formatDate(comment.created_at, {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <Text style={styles.commentBody}>{comment.body}</Text>
      </View>
    </View>
  );
}

export default function FeedbackDetailScreen() {
  const { t, formatDate } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useFeedbackTicket(id!);
  const addComment = useAddComment();
  const updateStatus = useUpdateTicketStatus();
  const { data: profile } = useProfile();

  const [commentText, setCommentText] = useState('');
  const [statusValue, setStatusValue] = useState('');

  const ticket = data?.ticket;
  const comments = data?.comments ?? [];

  // Initialize status value when ticket loads
  React.useEffect(() => {
    if (ticket && !statusValue) {
      setStatusValue(ticket.status);
    }
  }, [ticket, statusValue]);

  const handleSendComment = useCallback(() => {
    const body = commentText.trim();
    if (!body || !id) return;
    addComment.mutate(
      { ticket_id: id, body },
      { onSuccess: () => setCommentText('') },
    );
  }, [commentText, id, addComment]);

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      setStatusValue(newStatus);
      if (id) {
        updateStatus.mutate({ id, status: newStatus });
      }
    },
    [id, updateStatus],
  );

  const renderComment = useCallback(
    ({ item }: { item: FeedbackComment }) => (
      <CommentItem comment={item} formatDate={formatDate} />
    ),
    [formatDate],
  );

  if (isLoading) return <LoadingScreen />;
  if (!ticket) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ headerTitle: ticket.subject }} />

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Ticket info header */}
            <Card style={styles.headerCard}>
              <Text style={styles.ticketSubject}>{ticket.subject}</Text>
              <View style={styles.badgeRow}>
                <Badge
                  label={t(`feedback_category_${ticket.category}`)}
                  variant={CATEGORY_VARIANT[ticket.category] || 'default'}
                />
                <Badge
                  label={t(`priority_${ticket.priority}`)}
                  variant={PRIORITY_VARIANT[ticket.priority] || 'default'}
                />
                <Badge
                  label={t(`feedback_status_${ticket.status}`)}
                  variant={STATUS_VARIANT[ticket.status] || 'default'}
                />
              </View>
              {ticket.description ? (
                <Text style={styles.description}>{ticket.description}</Text>
              ) : null}
              <Text style={styles.ticketDate}>
                {formatDate(ticket.created_at, {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </Card>

            {/* Admin actions */}
            {profile?.role === 'admin' && (
              <Card style={styles.adminCard}>
                <Text style={styles.adminTitle}>{t('feedback_adminActions')}</Text>
                <FormSelect
                  label={t('feedback_changeStatus')}
                  options={STATUS_OPTIONS}
                  value={statusValue}
                  onChange={handleStatusChange}
                />
              </Card>
            )}

            {/* Comments section header */}
            <Text style={styles.commentsTitle}>
              {t('feedback_comments')} ({comments.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="chatbubble-outline"
            title={t('feedback_noComments')}
          />
        }
      />

      {/* Add comment input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.commentInput}
          value={commentText}
          onChangeText={setCommentText}
          placeholder={t('feedback_addComment')}
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!commentText.trim() || addComment.isPending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || addComment.isPending}
        >
          <Ionicons
            name="send"
            size={20}
            color={commentText.trim() ? colors.white : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.md, paddingBottom: 120 },
  headerCard: { marginBottom: spacing.md },
  ticketSubject: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  ticketDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  adminCard: { marginBottom: spacing.md },
  adminTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  commentsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  commentContent: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    ...shadow.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  commentUser: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  commentDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  commentBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
});
