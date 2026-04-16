import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import * as FileSystem from 'expo-file-system';

const SUPABASE_URL = 'https://vddfghfvmnrbotmxhvvi.supabase.co';

export interface ScannedDocument {
  name: string;
  id: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
  url?: string;
}

export function useScannedDocuments() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['scanned-documents'],
    queryFn: async () => {
      const prefix = `${user!.id}/scans/`;
      const { data, error } = await supabase.storage
        .from('scanned-documents')
        .list(prefix, { sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      // Generate signed URLs
      const docs: ScannedDocument[] = [];
      for (const file of data ?? []) {
        const { data: urlData } = await supabase.storage
          .from('scanned-documents')
          .createSignedUrl(`${prefix}${file.name}`, 60 * 60);
        docs.push({
          ...file,
          url: urlData?.signedUrl ?? undefined,
        });
      }
      return docs;
    },
    enabled: !!user,
  });
}

export interface UploadScanParams {
  fileUris: string[];
  mode: 'images' | 'pdf';
  contractId?: string;
}

export function useUploadScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileUris, mode, contractId }: UploadScanParams) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Not authenticated');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const bucket = contractId ? 'contract-uploads' : 'scanned-documents';
      const storagePath = contractId
        ? `${userId}/contracts/${contractId}/signed.pdf`
        : `${userId}/scans/${timestamp}.pdf`;

      if (mode === 'pdf') {
        await uploadViaEdgeFunction(bucket, storagePath, fileUris[0], 'application/pdf');
      } else {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) throw new Error('Not authenticated');

        const imagePayloads: { base64Data: string; index: number }[] = [];
        for (let i = 0; i < fileUris.length; i++) {
          const base64Data = await FileSystem.readAsStringAsync(fileUris[i], {
            encoding: FileSystem.EncodingType.Base64,
          });
          imagePayloads.push({ base64Data, index: i });
        }

        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/upload-media`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bucket,
              path: storagePath,
              base64Data: imagePayloads[0].base64Data,
              contentType: 'image/jpeg',
              additionalPages: imagePayloads.slice(1).map((p) => p.base64Data),
            }),
          },
        );

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || `Upload failed (${response.status})`);
        }
      }

      // If attached to a contract, update the contract record
      if (contractId) {
        const { data: urlData } = await supabase.storage
          .from(bucket)
          .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

        const signedUrl = urlData?.signedUrl;
        const { error: updateError } = await supabase
          .from('contracts')
          .update({ signed_pdf_url: signedUrl ?? storagePath })
          .eq('id', contractId);
        if (updateError) throw updateError;

        queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
        queryClient.invalidateQueries({ queryKey: ['contracts'] });
      }

      return { storagePath };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
    },
  });
}

async function uploadViaEdgeFunction(
  bucket: string,
  storagePath: string,
  fileUri: string,
  contentType: string,
): Promise<{ size: number }> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Not authenticated');

  const base64Data = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (!base64Data || base64Data.length === 0) {
    throw new Error('Could not read file');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/upload-media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucket,
      path: storagePath,
      base64Data,
      contentType,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || `Upload failed (${response.status})`);
  }

  return { size: result.size ?? 0 };
}
