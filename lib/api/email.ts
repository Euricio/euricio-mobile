import { supabase } from '../supabase';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

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
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...headers, ...opts.headers },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 503) {
      throw new EmailNotConfiguredError(body || 'SMTP not configured');
    }
    throw new Error(body || `API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/* ── Error types ────────────────────────────────────────────── */

export class EmailNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailNotConfiguredError';
  }
}

/* ── Email Settings (Supabase direct) ───────────────────────── */

export interface EmailSettings {
  user_id: string;
  sender_name: string | null;
  sender_email: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_password: string | null;
  use_ssl: boolean | null;
  portal_url: string | null;
  company_logo_url: string | null;
  company_name: string | null;
  agent_photo_url: string | null;
  brand_color: string | null;
  updated_at: string | null;
}

export function useEmailSettings() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_email_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as EmailSettings | null;
    },
    enabled: !!user,
  });
}

/* ── Test SMTP ──────────────────────────────────────────────── */

export interface TestSmtpParams {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  use_ssl: boolean;
  sender_name: string;
  sender_email: string;
}

export interface TestSmtpResult {
  success: boolean;
  sentTo?: string;
  errorKey?: string;
}

export function useTestSmtp() {
  return useMutation({
    mutationFn: async (params: TestSmtpParams): Promise<TestSmtpResult> => {
      // test-smtp doesn't require auth, but we use the same base URL
      const res = await fetch(`${API_URL}/api/test-smtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.errorKey || json.error || 'SMTP test failed');
      }
      return json;
    },
  });
}

/* ── Send Contract Email ────────────────────────────────────── */

export interface SendContractEmailParams {
  contractId: string;
  recipientEmail: string;
  language: 'de' | 'en' | 'es';
}

export function useSendContractEmail() {
  return useMutation({
    mutationFn: async (params: SendContractEmailParams) => {
      const user = useAuthStore.getState().user;
      return api<{ success: boolean }>('/api/send-contract-email', {
        method: 'POST',
        body: JSON.stringify({
          contractId: params.contractId,
          recipientEmail: params.recipientEmail,
          userId: user?.id,
          language: params.language,
        }),
      });
    },
  });
}

/* ── Send Signature Request ─────────────────────────────────── */

export interface SendSignatureParams {
  contractId: string;
  signerIds: string[];
}

export function useSendSignatureRequest() {
  return useMutation({
    mutationFn: async (params: SendSignatureParams) =>
      api<{ success: boolean }>(
        `/api/contracts/${params.contractId}/send-signature`,
        {
          method: 'POST',
          body: JSON.stringify({
            signerIds: params.signerIds,
            channel: 'email',
          }),
        },
      ),
  });
}

/* ── Send Portal Invite ─────────────────────────────────────── */

export interface SendPortalInviteParams {
  customerEmail: string;
  customerName?: string;
  portalPassword: string;
  propertyAddress: string;
  requiredDocuments: string[];
}

export function useSendPortalInvite() {
  return useMutation({
    mutationFn: async (params: SendPortalInviteParams) => {
      const user = useAuthStore.getState().user;
      return api<{ success: boolean }>('/api/send-portal-invite', {
        method: 'POST',
        body: JSON.stringify({
          customerEmail: params.customerEmail,
          customerName: params.customerName,
          password: params.portalPassword,
          propertyName: params.propertyAddress,
          propertyAddress: params.propertyAddress,
          documents: params.requiredDocuments,
          agentName: user?.user_metadata?.name || '',
          agentEmail: user?.email || '',
          portalLink: `${API_URL}/portal`,
          lang: 'de',
          userId: user?.id,
        }),
      });
    },
  });
}

/* ── Send Appointment Reminder ──────────────────────────────── */

export interface SendAppointmentReminderParams {
  recipientEmail: string;
  recipientName: string;
  appointmentDate: string;
  appointmentTime: string;
  propertyAddress: string;
}

export function useSendAppointmentReminder() {
  return useMutation({
    mutationFn: async (params: SendAppointmentReminderParams) => {
      const user = useAuthStore.getState().user;
      return api<{ success: boolean }>('/api/appointment-reminder', {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: params.recipientEmail,
          recipientName: params.recipientName,
          appointmentDate: params.appointmentDate,
          appointmentTime: params.appointmentTime,
          propertyAddress: params.propertyAddress,
          agentName: user?.user_metadata?.name || '',
          userId: user?.id,
        }),
      });
    },
  });
}
