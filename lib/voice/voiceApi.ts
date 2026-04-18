import { supabase } from '../supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers = await authHeaders();
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: { ...headers, ...opts.headers },
  });
  if (!res.ok) {
    // Read the error body so we can surface the actual backend error
    // instead of a generic "API 500: Internal Server Error".
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    console.error('[voiceApi] request failed', {
      url,
      method: opts.method || 'GET',
      status: res.status,
      statusText: res.statusText,
      body: body.slice(0, 500),
    });
    // Try to parse a JSON error message if the backend returned one.
    let detail = res.statusText;
    try {
      const parsed = JSON.parse(body);
      detail = parsed.error || parsed.message || parsed.detail || detail;
    } catch { /* not JSON — keep the raw body snippet */
      if (body) detail = body.slice(0, 200);
    }
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return res.json();
}

/* ── Connection ──────────────────────────────────────────────── */

export interface VoiceStatusResponse {
  connected: boolean;
  connected_at?: string;
  enabled_users?: number;
  account_sid?: string;
}

export const fetchVoiceStatus = () =>
  api<VoiceStatusResponse>('/api/twilio/voice/status');

export const connectVoice = (data: {
  account_sid: string;
  auth_token: string;
  twiml_app_sid: string;
}) => api('/api/twilio/voice/connect', { method: 'POST', body: JSON.stringify(data) });

export const disconnectVoice = () =>
  api('/api/twilio/voice/disconnect', { method: 'POST' });

/* ── Numbers ─────────────────────────────────────────────────── */

export interface VoiceNumber {
  id: string;
  phone_number: string;
  friendly_name: string;
  is_default: boolean;
}

export const fetchVoiceNumbers = () =>
  api<{ numbers: VoiceNumber[] }>('/api/twilio/voice/numbers');

export const fetchDefaultNumber = () =>
  api<{ number: VoiceNumber | null }>('/api/twilio/voice/default-number');

/* ── Permissions ─────────────────────────────────────────────── */

export interface TeamMemberPermission {
  id: string;
  full_name: string | null;
  email: string | null;
  voice_enabled: boolean;
  mobile_number?: string | null;
  routing_mode?: string;
  timeout_seconds?: number;
}

export const fetchPermissions = () =>
  api<{ members: TeamMemberPermission[] }>('/api/twilio/voice/permissions');

export const updatePermissions = (data: {
  user_id: string;
  enabled: boolean;
  mobile_number?: string;
}) =>
  api('/api/twilio/voice/permissions', {
    method: 'POST',
    body: JSON.stringify(data),
  });

/* ── Call Logs ───────────────────────────────────────────────── */

export interface CallLog {
  id: string;
  call_sid: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  status: string;
  duration: number;
  started_at: string;
  ended_at: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  entity_name?: string | null;
  user_id: string;
}

export async function fetchCallLogs(limit = 50): Promise<CallLog[]> {
  const { data, error } = await supabase
    .from('voice_call_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as CallLog[];
}

export const assignCallLog = (data: {
  call_sid: string;
  entity_type: string;
  entity_id: string;
}) =>
  api('/api/voice/call-log-assign', {
    method: 'POST',
    body: JSON.stringify(data),
  });

/* ── Entity Search / Caller Lookup ───────────────────────────── */

export interface CallerMatch {
  entity_type: string;
  entity_id: string;
  name: string;
  email?: string;
  status?: string;
  property_id?: string;
  property_info?: string;
}

export const lookupCaller = (phone: string) =>
  api<{ matches: CallerMatch[] }>('/api/voice/caller-lookup', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });

export const searchEntities = (query: string) =>
  api<{ results: CallerMatch[] }>('/api/voice/entity-search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });

/* ── Flows ───────────────────────────────────────────────────── */

export interface VoiceFlow {
  id: string;
  name: string;
  description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlowNode {
  id: string;
  flow_id: string;
  type: string;
  label: string;
  config: Record<string, unknown>;
  position_x: number;
  position_y: number;
}

export interface FlowEdge {
  id: string;
  flow_id: string;
  source_node_id: string;
  target_node_id: string;
  label?: string;
}

export interface FlowDetail extends VoiceFlow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export const fetchFlows = () =>
  api<{ flows: VoiceFlow[] }>('/api/twilio/voice/flows');

export const fetchFlow = (id: string) =>
  api<FlowDetail>(`/api/twilio/voice/flows/${id}`);

export const createFlow = (data: { name: string; description?: string }) =>
  api<VoiceFlow>('/api/twilio/voice/flows', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const saveFlow = (
  id: string,
  data: { nodes: Omit<FlowNode, 'id' | 'flow_id'>[]; edges: Omit<FlowEdge, 'id' | 'flow_id'>[] }
) =>
  api(`/api/twilio/voice/flows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const publishFlow = (id: string) =>
  api(`/api/twilio/voice/flows/${id}/publish`, { method: 'POST' });

/* ── Schedules ───────────────────────────────────────────────── */

export interface VoiceSchedule {
  id: string;
  name: string;
  timezone: string;
  rules: ScheduleRule[];
  created_at: string;
}

export interface ScheduleRule {
  day: number; // 0=Sun..6=Sat
  start: string; // "HH:mm"
  end: string;
  enabled: boolean;
}

export const fetchSchedules = () =>
  api<{ schedules: VoiceSchedule[] }>('/api/twilio/voice/schedules');

export const createSchedule = (data: { name: string; timezone: string; rules: ScheduleRule[] }) =>
  api<VoiceSchedule>('/api/twilio/voice/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const saveSchedule = (id: string, data: Partial<VoiceSchedule>) =>
  api(`/api/twilio/voice/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteSchedule = (id: string) =>
  api(`/api/twilio/voice/schedules/${id}`, { method: 'DELETE' });

/* ── Audio Assets ────────────────────────────────────────────── */

export interface AudioAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  duration?: number;
  created_at: string;
}

export const fetchAudioAssets = () =>
  api<{ assets: AudioAsset[] }>('/api/twilio/voice/audio');

export async function uploadAudioAsset(formData: FormData): Promise<AudioAsset> {
  const headers = await authHeaders();
  delete (headers as Record<string, string | undefined>)['Content-Type'];
  const res = await fetch(`${API_URL}/api/twilio/voice/audio`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export const deleteAudioAsset = (id: string) =>
  api(`/api/twilio/voice/audio/${id}`, { method: 'DELETE' });

/* ── Test Call ───────────────────────────────────────────────── */

export const makeTestCall = (phoneNumber: string) =>
  api('/api/twilio/voice/test-call', {
    method: 'POST',
    // Backend expects { phoneNumber } — not { to }. Sending the wrong
    // field produced a silent 400 "phoneNumber is required" that surfaced
    // in the UI as the generic "Llamada de prueba fallida" alert.
    body: JSON.stringify({ phoneNumber }),
  });
