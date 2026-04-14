import { supabase } from './client';

export interface AppNotification {
  id: string;
  type: 'missed_call' | 'new_lead' | 'task_due' | 'message' | 'system';
  title: string;
  body: string;
  read: boolean;
  data: Record<string, unknown> | null;
  user_id: string;
  created_at: string;
}

export async function getNotifications(unreadOnly = false) {
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  return query;
}

export async function markAsRead(id: string) {
  return supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
}

export async function markAllAsRead(userId: string) {
  return supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}
