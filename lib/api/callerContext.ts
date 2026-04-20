import { supabase } from '../supabase';
import { useQuery } from '@tanstack/react-query';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';

export interface CallerContextMatch {
  entity_type: 'lead' | 'property_owner' | 'partner';
  entity_id: number;
  name: string;
  phone: string;
  email: string | null;
  status: string | null;
  language_code: string | null;
  warmth: number | null;
  is_cold_callback: boolean;
  next_action: string | null;
  property: { id: number; title: string } | null;
  relationship_owner: { id: string; name: string } | null;
  last_agent: { id: string; name: string; at: string } | null;
  last_interaction: { type: string; summary: string; at: string } | null;
  open_tasks_count: number;
}

export interface CallerContextResponse {
  matches: CallerContextMatch[];
  unknown: boolean;
  phone: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Low-level caller-context fetch. Use `useCallerContext` in React components;
 * use this directly (with queryClient.prefetchQuery) from voice event handlers
 * so the overlay has data by the time it renders.
 */
export async function fetchCallerContext(phone: string): Promise<CallerContextResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/voice/caller-context`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body.slice(0, 200) || `caller-context ${res.status}`);
  }
  return res.json();
}

export function useCallerContext(phone: string | null | undefined) {
  return useQuery<CallerContextResponse>({
    queryKey: ['callerContext', phone],
    enabled: !!phone && phone.length >= 3,
    staleTime: 30_000,
    queryFn: () => fetchCallerContext(phone as string),
  });
}
