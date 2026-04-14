import { supabase } from './client';

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  source: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export async function getLeads(page = 0, pageSize = 20) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  return supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
}

export async function getLead(id: string) {
  return supabase.from('leads').select('*').eq('id', id).single();
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  return supabase
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

export async function searchLeads(query: string) {
  return supabase
    .from('leads')
    .select('*')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);
}
