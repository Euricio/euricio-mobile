import { useEffect } from 'react';
import { supabase } from '../lib/api/client';
import { useNotificationStore } from '../store/notificationStore';

/**
 * Hook für Supabase Realtime-Subscriptions.
 * Empfängt Live-Updates für Benachrichtigungen, Leads und Tasks.
 */
export function useRealtime(userId: string | undefined) {
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('realtime-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const record = payload.new as {
            id: string;
            type: 'missed_call' | 'new_lead' | 'task_due' | 'message' | 'system';
            title: string;
            body: string;
            created_at: string;
          };
          addNotification({
            id: record.id,
            type: record.type,
            title: record.title,
            body: record.body,
            read: false,
            createdAt: record.created_at,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, addNotification]);
}
