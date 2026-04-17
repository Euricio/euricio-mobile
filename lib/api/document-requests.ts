import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DocumentRequest {
  id: string;
  property_id: number;
  agent_user_id: string;
  document_type: string;
  status: 'requested' | 'uploaded' | 'verified';
  file_url: string | null;
  file_name: string | null;
  uploaded_at: string | null;
  created_at: string;
}

export interface PortalAccess {
  id: string;
  property_id: number;
  agent_user_id: string;
  client_email: string;
  is_active: boolean;
  access_token: string;
  created_at: string;
  last_login_at: string | null;
}

export interface CustomDocType {
  id: string;
  user_id: string;
  name: string;
  category: string;
  created_at: string;
}

export const DOCUMENT_TYPES = [
  { key: 'land_register', category: 'legal' },
  { key: 'energy_cert', category: 'technical' },
  { key: 'ibi_tax', category: 'tax' },
  { key: 'community_rules', category: 'legal' },
  { key: 'utility_bill', category: 'financial' },
  { key: 'id_document', category: 'identification' },
  { key: 'purchase_deed', category: 'legal' },
  { key: 'mortgage_docs', category: 'financial' },
  { key: 'habitability_cert', category: 'technical' },
  { key: 'floor_plan', category: 'technical' },
  { key: 'property_photos', category: 'visual' },
  { key: 'other', category: 'other' },
] as const;

// ─── Queries ────────────────────────────────────────────────────────────────

export function useDocumentRequests(propertyId: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['document-requests', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_requests')
        .select('*')
        .eq('property_id', propertyId)
        .eq('agent_user_id', user!.id);
      if (error) throw error;
      return (data ?? []) as DocumentRequest[];
    },
    enabled: !!propertyId && !!user,
  });
}

export function usePortalAccesses(propertyId: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['portal-accesses', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_portal_access')
        .select('id, property_id, agent_user_id, client_email, is_active, access_token, created_at, last_login_at')
        .eq('property_id', propertyId)
        .eq('agent_user_id', user!.id);
      if (error) throw error;
      return (data ?? []) as PortalAccess[];
    },
    enabled: !!propertyId && !!user,
  });
}

export function useCustomDocTypes() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['custom-doc-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_document_types')
        .select('id, user_id, name, category, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CustomDocType[];
    },
    enabled: !!user,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useSaveDocumentRequests() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async ({
      propertyId,
      selected,
      existingRequests,
    }: {
      propertyId: string;
      selected: string[];
      existingRequests: DocumentRequest[];
    }) => {
      const selectedSet = new Set(selected);

      // Upsert new selections as requested (skip already uploaded/verified)
      for (const docType of selected) {
        const existing = existingRequests.find((r) => r.document_type === docType);
        if (!existing) {
          await supabase.from('document_requests').upsert(
            {
              property_id: propertyId,
              agent_user_id: user!.id,
              document_type: docType,
              status: 'requested',
            },
            { onConflict: 'property_id,document_type' },
          );
        }
      }

      // Delete deselected docs that are still in 'requested' status
      const toDelete = existingRequests.filter(
        (r) => !selectedSet.has(r.document_type) && r.status === 'requested',
      );
      for (const item of toDelete) {
        await supabase.from('document_requests').delete().eq('id', item.id);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-requests', variables.propertyId] });
    },
  });
}

export function useAddCustomDocType() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('custom_document_types')
        .insert({ user_id: user!.id, name, category: 'custom' })
        .select('id, user_id, name, category, created_at')
        .single();
      if (error) throw error;
      return data as CustomDocType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-doc-types'] });
    },
  });
}

export function useRemoveCustomDocType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customId,
      propertyId,
      existingRequest,
    }: {
      customId: string;
      propertyId: string;
      existingRequest?: DocumentRequest;
    }) => {
      if (existingRequest) {
        await supabase.from('document_requests').delete().eq('id', existingRequest.id);
      }
      await supabase.from('custom_document_types').delete().eq('id', customId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custom-doc-types'] });
      queryClient.invalidateQueries({ queryKey: ['document-requests', variables.propertyId] });
    },
  });
}

export function useCreatePortalAccess() {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  return useMutation({
    mutationFn: async ({
      propertyId,
      clientEmail,
      customerName,
      passwordHash,
      password,
      selectedDocs,
      propertyName,
      propertyAddress,
      language,
      customTypes,
    }: {
      propertyId: string;
      clientEmail: string;
      customerName: string;
      passwordHash: string;
      password: string;
      selectedDocs: string[];
      propertyName: string;
      propertyAddress: string;
      language: 'de' | 'en' | 'es';
      customTypes: CustomDocType[];
    }) => {
      const { data: insertedAccess, error } = await supabase
        .from('document_portal_access')
        .insert({
          property_id: propertyId,
          agent_user_id: session!.user.id,
          client_email: clientEmail,
          client_password_hash: passwordHash,
          requested_documents: selectedDocs,
          status: 'active',
        })
        .select('access_token')
        .single();

      if (error) throw error;

      const portalLink = `https://crm.euricio.es/portal/${insertedAccess.access_token}`;

      // Send invitation email
      const documentLabels = selectedDocs.map((docKey) => {
        if (docKey.startsWith('custom:')) {
          const ct = customTypes.find((c) => `custom:${c.id}` === docKey);
          return ct?.name || docKey;
        }
        return docKey;
      });

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://app.euricio.es';
      const emailRes = await fetch(`${apiUrl}/api/send-portal-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session!.access_token}`,
        },
        body: JSON.stringify({
          customerEmail: clientEmail,
          customerName: customerName || undefined,
          password,
          propertyName,
          propertyAddress,
          documents: documentLabels,
          agentName: session!.user.user_metadata?.full_name || session!.user.email || '',
          agentEmail: session!.user.email || '',
          portalLink,
          lang: language,
          userId: session!.user.id,
        }),
      });

      const emailResult = { sent: false, error: '', smtpWarning: false };
      if (emailRes.ok) {
        emailResult.sent = true;
      } else {
        const body = await emailRes.json().catch(() => ({}));
        if (body.error === 'smtp_not_configured') {
          emailResult.smtpWarning = true;
        } else {
          emailResult.error = body.error || 'email_error';
        }
      }

      return {
        email: clientEmail,
        password,
        link: portalLink,
        emailResult,
      };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portal-accesses', variables.propertyId] });
    },
  });
}

export function useTogglePortalAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      accessId,
      isActive,
      propertyId,
    }: {
      accessId: string;
      isActive: boolean;
      propertyId: string;
    }) => {
      const { error } = await supabase
        .from('document_portal_access')
        .update({ is_active: !isActive })
        .eq('id', accessId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portal-accesses', variables.propertyId] });
    },
  });
}

export function useDeletePortalAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      accessId,
      propertyId,
    }: {
      accessId: string;
      propertyId: string;
    }) => {
      const { error } = await supabase
        .from('document_portal_access')
        .delete()
        .eq('id', accessId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portal-accesses', variables.propertyId] });
    },
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function hashPassword(password: string): Promise<string> {
  // Simple hash using character codes — production would use edge function with bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Convert to hex-like string
  const hexParts: string[] = [];
  const bytes = new TextEncoder().encode(password);
  for (const byte of bytes) {
    hexParts.push(byte.toString(16).padStart(2, '0'));
  }
  return hexParts.join('');
}
