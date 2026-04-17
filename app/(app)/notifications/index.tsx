import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  Notification,
} from '../../../lib/api/notifications';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { Button } from '../../../components/ui/Button';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

function getNotificationIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'missed_call': return 'call-outline';
    case 'task_assigned': return 'checkbox-outline';
    case 'lead': return 'person-outline';
    case 'appointment': return 'calendar-outline';
    default: return 'notifications-outline';
  }
}

function getNotificationColor(type: string): string {
  switch (type) {
    case 'missed_call': return colors.error;
    case 'task_assigned': return colors.primary;
    case 'lead': return colors.success;
    case 'appointment': return '#bf5af2';
    default: return colors.info;
  }
}

function navigateToEntity(notification: Notification) {
  if (!notification.entity_type || !notification.entity_id) return;
  switch (notification.entity_type) {
    case 'lead':
      router.push(`/(app)/(tabs)/leads/${notification.entity_id}`);
      break;
    case 'task':
      router.push({ pathname: '/(app)/(tabs)/tasks', params: { highlight: notification.entity_id } });
      break;
    case 'appointment':
      router.push('/(app)/calendar/');
      break;
    case 'property':
      router.push(`/(app)/(tabs)/properties/${notification.entity_id}`);
      break;
  }
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const { formatDate } = useI18n();
  const icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);

  const handlePress = () => {
    if (!notification.read) onRead();
    navigateToEntity(notification);
  };

  return (
    <TouchableOpacity
      style={[styles.item, !notification.read && styles.itemUnread]}
      activeOpacity={0.7}
      onPress={handlePress}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, !notification.read && styles.itemTitleUnread]} numberOfLines={1}>
          {notification.title}
        </Text>
        {notification.body && (
          <Text style={styles.itemBody} numberOfLines={2}>
            {notification.body}
          </Text>
        )}
        <Text style={styles.itemTime}>
          {formatDate(notification.created_at, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { t } = useI18n();
  const { data: notifications, isLoading, refetch, isRefetching } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const hasUnread = (notifications ?? []).some((n) => !n.read);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('notifications_title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(app)/(tabs)/more');
                }
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ paddingRight: 8 }}
            >
              <Ionicons name="chevron-back" size={26} color={colors.primary} />
            </TouchableOpacity>
          ),
          headerRight: () =>
            hasUnread ? (
              <TouchableOpacity
                onPress={() => markAllAsRead.mutate()}
                style={{ paddingRight: spacing.md }}
              >
                <Ionicons name="checkmark-done-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            ) : null,
        }}
      />

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onRead={() => markAsRead.mutate(item.id)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title={t('notifications_empty')}
              message={t('notifications_emptyDefault')}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: 120 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemUnread: { backgroundColor: colors.primary + '08' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemContent: { flex: 1 },
  itemTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  itemTitleUnread: { fontWeight: fontWeight.semibold },
  itemBody: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});
