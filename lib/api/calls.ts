import { supabase } from './client';

export interface CallLog {
  id: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  status: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'missed' | 'failed';
  duration: number | null;
  lead_id: string | null;
  agent_id: string;
  started_at: string;
  ended_at: string | null;
  recording_url: string | null;
}

export async function getCallLogs(page = 0, pageSize = 20) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  return supabase
    .from('call_logs')
    .select('*, leads(name)', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range(from, to);
}

export async function getMissedCalls() {
  return supabase
    .from('call_logs')
    .select('*, leads(name, phone)')
    .eq('status', 'missed')
    .order('started_at', { ascending: false })
    .limit(20);
}

export async function logCall(call: Omit<CallLog, 'id'>) {
  return supabase.from('call_logs').insert(call).select().single();
}
