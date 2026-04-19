import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...headers, ...(opts.headers as Record<string, string> | undefined) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `API ${res.status}: ${res.statusText}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

export type RedirectMode = 'next_in_flow' | 'specific_agent' | 'external_number';

export type BusyPresetKey =
  | 'in_appointment'
  | 'at_notary'
  | 'at_viewing'
  | 'on_call'
  | 'in_meeting'
  | 'off_duty'
  | 'on_vacation'
  | 'sick_leave'
  | 'custom';

export interface BusyStatus {
  is_busy: boolean;
  busy_reason: string | null;
  busy_set_at: string | null;
  busy_announcement: string | null;
  busy_redirect_mode: RedirectMode;
  busy_redirect_agent_id: string | null;
  busy_redirect_number: string | null;
  busy_preset: BusyPresetKey | null;
  busy_callback_time: string | null;
  display_name: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  blocks_calls: boolean;
  announcement: string | null;
  redirect_mode: RedirectMode;
  redirect_agent_id: string | null;
  redirect_number: string | null;
  created_at: string;
}

export interface BusyMissedCall {
  id: string;
  user_id: string;
  caller_number: string | null;
  caller_name: string | null;
  call_sid: string | null;
  received_at: string;
  busy_source: 'manual_toggle' | 'calendar_event' | 'appointment' | null;
  calendar_event_id: string | null;
  appointment_id: number | null;
  read_at: string | null;
  created_at: string;
}

// ── Busy Status ─────────────────────────────────────────────
export function useBusyStatus() {
  return useQuery<BusyStatus>({
    queryKey: ['busy-status'],
    queryFn: () => api<BusyStatus>('/api/voice/busy-status'),
    staleTime: 30_000,
  });
}

export function useSetBusy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<BusyStatus> & { is_busy: boolean }) =>
      api<BusyStatus>('/api/voice/busy-status', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => qc.setQueryData(['busy-status'], data),
  });
}

// ── Calendar Events ──────────────────────────────────────────
export function useCalendarEvents() {
  return useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events'],
    queryFn: () => api<CalendarEvent[]>('/api/calendar/events'),
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<CalendarEvent, 'id' | 'created_at'>) =>
      api<CalendarEvent>('/api/calendar/events', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<CalendarEvent> & { id: string }) =>
      api<CalendarEvent>(`/api/calendar/events/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<null>(`/api/calendar/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });
}

// ── Missed Calls ────────────────────────────────────────────
export function useBusyMissedCalls() {
  return useQuery<{ items: BusyMissedCall[]; unread_count: number }>({
    queryKey: ['busy-missed-calls'],
    queryFn: () => api<{ items: BusyMissedCall[]; unread_count: number }>('/api/voice/missed-calls'),
    refetchInterval: 60_000,
  });
}

export function useMarkMissedCallRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<BusyMissedCall>(`/api/voice/missed-calls/${id}`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['busy-missed-calls'] }),
  });
}

export interface TeamMember { user_id: string; full_name: string | null; email: string | null }

export function useVoiceTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ['voice-team-members'],
    queryFn: () => api<TeamMember[]>('/api/voice/team-members'),
    staleTime: 5 * 60_000,
  });
}
