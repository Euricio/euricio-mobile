import { supabase, uploadToStorage } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  buildAgentSignaturePayload,
  EmptySignatureError,
} from './agentSignaturePayload';

export { buildAgentSignaturePayload, EmptySignatureError };

export interface SavedClause {
  key: string;
  title_de: string;
  title_es: string;
  text: string;
  enabled: boolean;
}

export interface Contract {
  id: string;
  created_by: string;
  contract_type: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  client_id_number: string | null;
  property_id: string | null;
  property_address: string | null;
  selected_clauses: SavedClause[];
  mandate_type: string | null;
  commission_percentage: number | null;
  status: string;
  signature_status: string | null;
  signature_token: string | null;
  pdf_url: string | null;
  pdf_stored_url: string | null;
  signed_pdf_url: string | null;
  contract_date: string | null;
  signing_location: string | null;
  agent_signature_png: string | null;
  agent_signed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  property?: {
    id: string;
    title: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    price: number | null;
  } | null;
}

export type ContractStatus = 'draft' | 'signed' | 'archived';

export function useContracts(status?: ContractStatus, search?: string) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['contracts', status, search],
    queryFn: async () => {
      let query = supabase
        .from('contracts')
        .select('*, property:properties(id, title, address, city, province, price)')
        .eq('created_by', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (status) {
        query = query.eq('status', status);
      }

      if (search && search.length >= 2) {
        query = query.or(
          `client_name.ilike.%${search}%,property_address.ilike.%${search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Contract[];
    },
    enabled: !!user,
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, property:properties(id, title, address, city, province, price)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Contract;
    },
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;

  return useMutation({
    mutationFn: async (contract: Partial<Contract>) => {
      const { data, error } = await supabase
        .from('contracts')
        .insert({ ...contract, created_by: user?.id, status: 'draft' })
        .select()
        .single();
      if (error) throw error;
      return data as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contract> & { id: string }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Contract;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', data.id] });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useGeneratePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string): Promise<{ uri: string; filename: string }> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';
      const res = await fetch(`${apiUrl}/api/contracts/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ contract_id: contractId, language: 'es' }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'PDF generation failed');
      }

      // Extract filename from Content-Disposition (fallback: generic name)
      const disposition = res.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const filename = match?.[1] || `contract-${contractId}.pdf`;

      // Write PDF bytes to cache directory
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const file = new File(Paths.cache, filename);
      if (file.exists) {
        file.delete();
      }
      file.create();
      file.write(bytes);

      // Open native share sheet: user can Save to Files, AirDrop, open in Preview, etc.
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: filename,
          UTI: 'com.adobe.pdf',
        });
      }

      return { uri: file.uri, filename };
    },
    onSuccess: (_data, contractId) => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useProperties() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['properties-picker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, address, city, province, price')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

// ─── Agent (broker) Signature ───────────────────────────────────────

export interface AgentSignParams {
  contractId: string;
  /**
   * Agent signature as a PNG. Accepts either a raw base64 string or a full
   * `data:image/png;base64,…` data URL — the request to the WebCRM endpoint
   * is always normalized to a data URL since that is what is stored in
   * `contracts.agent_signature_png` and re-served as-is.
   */
  signaturePngBase64: string;
  /** Optional override of the signer name (defaults to the auth user). */
  signerName?: string;
}

export interface AgentSignResult {
  success: boolean;
  agent_signed_at?: string | null;
}

/**
 * POSTs the broker/agent signature to the WebCRM endpoint
 * `/api/contracts/[id]/agent-sign`. The signature is a separate image,
 * NOT drawn into the generated PDF — that part is handled server-side
 * (or, today, only stored alongside the contract row).
 *
 * Throws an `EmptySignatureError` before the request leaves the device when
 * the canvas export was empty/failed, so the user sees a local message
 * rather than the server's `missing_signature` reply.
 */
export function useAgentSignContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      signaturePngBase64,
      signerName,
    }: AgentSignParams): Promise<AgentSignResult> => {
      const signatureData = buildAgentSignaturePayload(signaturePngBase64);
      if (!signatureData) {
        throw new EmptySignatureError();
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl =
        process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';
      const res = await fetch(
        `${apiUrl}/api/contracts/${contractId}/agent-sign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            signatureData,
            ...(signerName ? { signerName } : {}),
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Agent sign failed (${res.status})`);
      }

      // Endpoint may return JSON or empty body; tolerate both.
      const body = await res.text();
      if (!body) return { success: true };
      try {
        return JSON.parse(body) as AgentSignResult;
      } catch {
        return { success: true };
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['contract', vars.contractId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

// ─── Signed PDF Upload ──────────────────────────────────────────────

export interface SignedPdfUploadParams {
  contractId: string;
  fileUris: string[];
  mode: 'images' | 'pdf';
}

export function useUploadSignedPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractId, fileUris, mode }: SignedPdfUploadParams) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Not authenticated');

      const storagePath = `${userId}/contracts/${contractId}/signed.pdf`;

      if (mode === 'pdf') {
        await uploadToStorage(
          'contracts',
          storagePath,
          fileUris[0],
          'application/pdf',
        );
      } else {
        // Upload each image individually
        for (let i = 0; i < fileUris.length; i++) {
          const pagePath = i === 0
            ? storagePath
            : storagePath.replace(/\.pdf$/, `-page${i + 1}.jpeg`);

          await uploadToStorage('contracts', pagePath, fileUris[i], 'image/jpeg');
        }
      }

      const { data: urlData } = await supabase.storage
        .from('contracts')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

      const signedUrl = urlData?.signedUrl;

      const { error: updateError } = await supabase
        .from('contracts')
        .update({ signed_pdf_url: signedUrl ?? storagePath })
        .eq('id', contractId);

      if (updateError) throw updateError;

      return { url: signedUrl ?? storagePath };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract', variables.contractId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}
