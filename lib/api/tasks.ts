import { supabase } from './client';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  type: 'callback' | 'follow_up' | 'meeting' | 'general';
  status: 'open' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  lead_id: string | null;
  assigned_to: string;
  created_at: string;
}

export async function getTasks(status?: Task['status']) {
  let query = supabase
    .from('tasks')
    .select('*, leads(name, phone)')
    .order('due_date', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  return query;
}

export async function getTask(id: string) {
  return supabase
    .from('tasks')
    .select('*, leads(name, phone, email)')
    .eq('id', id)
    .single();
}

export async function updateTaskStatus(id: string, status: Task['status']) {
  return supabase
    .from('tasks')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
}

export async function createCallbackTask(leadId: string, phoneNumber: string) {
  return supabase.from('tasks').insert({
    title: `Rückruf: ${phoneNumber}`,
    type: 'callback',
    status: 'open',
    priority: 'high',
    lead_id: leadId,
  }).select().single();
}
