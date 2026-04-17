import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://euricio.es';

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
    throw new Error(body || `API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/* ── Types ──────────────────────────────────────────────────── */

export interface WhatsAppConversation {
  id: string;
  tenant_id: string;
  contact_number: string;
  contact_name: string | null;
  assigned_to: string | null;
  entity_type: string | null;
  entity_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  body: string | null;
  media_url: string | null;
  status: string | null;
  created_at: string;
}

/* ── Queries ────────────────────────────────────────────────── */

export function useWhatsAppConversations(filter?: string, search?: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['whatsapp-conversations', filter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter && filter !== 'all') params.set('filter', filter);
      if (search && search.length >= 2) params.set('search', search);
      const qs = params.toString();
      return api<WhatsAppConversation[]>(
        `/api/twilio/whatsapp/conversations${qs ? `?${qs}` : ''}`,
      );
    },
    enabled: !!user,
  });
}

export function useWhatsAppMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['whatsapp-messages', conversationId],
    queryFn: async () =>
      api<WhatsAppMessage[]>(
        `/api/twilio/whatsapp/conversations/${conversationId}/messages`,
      ),
    enabled: !!conversationId,
  });
}

/* ── Mutations ──────────────────────────────────────────────── */

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      conversationId: string;
      body: string;
    }) =>
      api<{ success: boolean }>('/api/twilio/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: params.conversationId,
          body: params.body,
        }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['whatsapp-messages', variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['whatsapp-conversations'],
      });
    },
  });
}

export function useAssignWhatsAppConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      conversationId: string;
      assignedTo: string | null;
    }) =>
      api<{ success: boolean }>(
        `/api/twilio/whatsapp/conversations/${params.conversationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ assigned_to: params.assignedTo }),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['whatsapp-conversations'],
      });
    },
  });
}

export function useLinkWhatsAppEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      conversationId: string;
      entityType: string;
      entityId: string;
    }) =>
      api<{ success: boolean }>(
        `/api/twilio/whatsapp/conversations/${params.conversationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            entity_type: params.entityType,
            entity_id: params.entityId,
          }),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['whatsapp-conversations'],
      });
    },
  });
}
