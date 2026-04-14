import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

export type PushPayload = {
  type: 'missed_call' | 'new_lead' | 'task_due' | 'message';
  entityId?: string;
};

/**
 * Verarbeitet eingehende Push-Benachrichtigungen
 * und navigiert zum entsprechenden Screen.
 */
export function setupPushHandler(): () => void {
  // Foreground-Benachrichtigung
  const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[Push] Foreground:', notification.request.content.title);
  });

  // Benutzer tippt auf Benachrichtigung
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as PushPayload;
    handlePushNavigation(data);
  });

  return () => {
    foregroundSub.remove();
    responseSub.remove();
  };
}

function handlePushNavigation(data: PushPayload): void {
  switch (data.type) {
    case 'missed_call':
      if (data.entityId) {
        router.push(`/(app)/call/${data.entityId}`);
      }
      break;
    case 'new_lead':
      if (data.entityId) {
        router.push(`/(app)/(tabs)/leads/${data.entityId}`);
      }
      break;
    case 'task_due':
      router.push('/(app)/(tabs)/tasks');
      break;
    case 'message':
      if (data.entityId) {
        router.push(`/(app)/(tabs)/leads/${data.entityId}`);
      }
      break;
  }
}
