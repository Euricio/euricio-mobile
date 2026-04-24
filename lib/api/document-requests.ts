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
  storage_path: string | null;
  mime_type: string | null;
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
      // Property-scoped only — uploads are visible regardless of which agent
      // created the portal access. RLS is already property-aware.
      const { data, error } = await supabase
        .from('document_requests')
        .select('*')
        .eq('property_id', propertyId);
      if (error) throw error;
      return (data ?? []) as DocumentRequest[];
    },
    enabled: !!propertyId && !!user,
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  });
}

export function usePortalAccesses(propertyId: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['portal-accesses', propertyId],
    queryFn: async () => {
      // Property-scoped only — mirror of useDocumentRequests so all team
      // members see accesses created by any agent on this property.
      const { data, error } = await supabase
        .from('document_portal_access')
        .select('id, property_id, agent_user_id, client_email, is_active, access_token, created_at, last_login_at')
        .eq('property_id', propertyId);
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
      selectedDocs,
      propertyName,
      propertyAddress,
      language,
      customTypes,
    }: {
      propertyId: string;
      clientEmail: string;
      customerName: string;
      selectedDocs: string[];
      propertyName: string;
      propertyAddress: string;
      language: 'de' | 'en' | 'es';
      customTypes: CustomDocType[];
    }) => {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';

      const createRes = await fetch(`${apiUrl}/api/portal/create-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session!.access_token}`,
        },
        body: JSON.stringify({
          property_id: propertyId,
          client_email: clientEmail,
          requested_documents: selectedDocs,
        }),
      });

      const createBody = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error((createBody as { error?: string })?.error || 'create_access_failed');
      }
      const { access_token, password } = createBody as { access_token?: string; password?: string };
      if (!access_token || !password) {
        throw new Error('missing_password_in_response');
      }

      const portalLink = `https://crm.euricio.es/portal/${access_token}`;

      const documentLabels = selectedDocs.map((docKey) => {
        if (docKey.startsWith('custom:')) {
          const ct = customTypes.find((c) => `custom:${c.id}` === docKey);
          return ct?.name || docKey;
        }
        return docKey;
      });

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

/**
 * Kombinierter Flow: legt Portal-Zugang UND Dokumenten-Anforderungen
 * in einem einzigen Backend-Call an. Sendet anschließend die Invite-Mail.
 *
 * Nutzt den neuen Endpoint /api/portal/create-access-with-requests.
 *
 * Wichtig: Wenn für (property_id, client_email) bereits ein Zugang
 * existiert, gibt der Server password='' zurück. In dem Fall:
 *   - schicken wir KEINE Mail (wir haben kein Passwort zum Versenden)
 *   - emailResult.smtpWarning=false, sent=false, error='reused_existing_access'
 * Das UI soll das erkennen und den Makler darauf hinweisen, dass dem
 * Kunden die alten Zugangsdaten erneut zugestellt werden müssen (oder
 * der bestehende Zugang zuerst gelöscht werden muss).
 */
export function useCreateAccessWithRequests() {
  const queryClient = useQueryClient();
  const session = useAuthStore((s) => s.session);
  return useMutation({
    mutationFn: async ({
      propertyId,
      clientEmail,
      customerName,
      selectedDocs,
      propertyName,
      propertyAddress,
      language,
      customTypes,
    }: {
      propertyId: string;
      clientEmail: string;
      customerName: string;
      selectedDocs: string[];
      propertyName: string;
      propertyAddress: string;
      language: 'de' | 'en' | 'es';
      customTypes: CustomDocType[];
    }) => {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';

      const createRes = await fetch(
        `${apiUrl}/api/portal/create-access-with-requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session!.access_token}`,
          },
          body: JSON.stringify({
            property_id: propertyId,
            client_email: clientEmail,
            requested_documents: selectedDocs,
          }),
        },
      );

      const createBody = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error(
          (createBody as { error?: string })?.error || 'create_access_failed',
        );
      }
      const {
        access_token,
        password,
        reused_existing_access,
        requests_upserted,
      } = createBody as {
        access_token?: string;
        password?: string;
        reused_existing_access?: boolean;
        requests_upserted?: number;
      };
      if (!access_token) {
        throw new Error('missing_access_token_in_response');
      }

      const portalLink = `https://crm.euricio.es/portal/${access_token}`;

      const documentLabels = selectedDocs.map((docKey) => {
        if (docKey.startsWith('custom:')) {
          const ct = customTypes.find((c) => `custom:${c.id}` === docKey);
          return ct?.name || docKey;
        }
        return docKey;
      });

      const emailResult = { sent: false, error: '', smtpWarning: false };

      // Reused access → wir haben kein Klartext-Passwort und schicken daher
      // KEINE Mail. Das UI zeigt stattdessen einen Hinweis an.
      if (reused_existing_access || !password) {
        emailResult.error = 'reused_existing_access';
      } else {
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
            agentName:
              session!.user.user_metadata?.full_name || session!.user.email || '',
            agentEmail: session!.user.email || '',
            portalLink,
            lang: language,
            userId: session!.user.id,
          }),
        });

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
      }

      return {
        email: clientEmail,
        password: password ?? '',
        link: portalLink,
        emailResult,
        reusedExistingAccess: !!reused_existing_access,
        requestsUpserted: requests_upserted ?? 0,
      };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portal-accesses', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['document-requests', variables.propertyId] });
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

