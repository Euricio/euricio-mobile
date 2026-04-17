import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import * as FileSystem from 'expo-file-system';

const SUPABASE_URL = 'https://vddfghfvmnrbotmxhvvi.supabase.co';
const UPLOAD_TIMEOUT_MS = 30_000;

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

/**
 * Ensure the URI is readable by FileSystem.readAsStringAsync.
 * iOS image picker can return `ph://` or asset-library URIs that are not
 * directly readable. In that case, copy the file to the cache directory first.
 */
async function ensureReadableUri(uri: string): Promise<string> {
  if (uri.startsWith('file://')) return uri;

  console.error('[scanner] URI is not file://, copying to cache:', uri);
  const fileName = `scan-copy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
  const dest = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  console.error('[scanner] Copied to:', dest);
  return dest;
}

export function useUploadScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileUris, mode, contractId }: UploadScanParams) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Not authenticated');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const bucket = contractId ? 'contract-uploads' : 'scanned-documents';

      if (mode === 'pdf') {
        const storagePath = contractId
          ? `${userId}/contracts/${contractId}/signed.pdf`
          : `${userId}/scans/${timestamp}.pdf`;

        console.error('[scanner] Uploading PDF:', storagePath);
        await uploadViaEdgeFunction(bucket, storagePath, fileUris[0], 'application/pdf');

        if (contractId) {
          await updateContractRecord(bucket, storagePath, contractId, queryClient);
        }
        return { storagePath };
      }

      // ── Images mode: upload EACH image individually ──
      console.error(`[scanner] Uploading ${fileUris.length} image(s) individually`);
      const uploadedPaths: string[] = [];

      for (let i = 0; i < fileUris.length; i++) {
        const storagePath = contractId
          ? `${userId}/contracts/${contractId}/signed-${i}.jpeg`
          : `${userId}/scans/${timestamp}-${i}.jpeg`;

        console.error(`[scanner] Uploading image ${i + 1}/${fileUris.length}: ${storagePath}`);
        await uploadViaEdgeFunction(bucket, storagePath, fileUris[i], 'image/jpeg');
        uploadedPaths.push(storagePath);
      }

      // If attached to a contract, update with the first uploaded image
      if (contractId) {
        await updateContractRecord(bucket, uploadedPaths[0], contractId, queryClient);
      }

      return { storagePath: uploadedPaths[0] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanned-documents'] });
    },
  });
}

async function updateContractRecord(
  bucket: string,
  storagePath: string,
  contractId: string,
  queryClient: ReturnType<typeof useQueryClient>,
) {
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

async function uploadViaEdgeFunction(
  bucket: string,
  storagePath: string,
  fileUri: string,
  contentType: string,
): Promise<{ size: number }> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Not authenticated');

  // Ensure the URI is readable (copy from ph:// or asset-library:// if needed)
  let readableUri: string;
  try {
    readableUri = await ensureReadableUri(fileUri);
  } catch (err) {
    console.error('[scanner] Failed to prepare file URI:', fileUri, err);
    throw new Error(`Failed to prepare file for upload: ${fileUri}`);
  }

  // Read file as base64
  let base64Data: string;
  try {
    console.error('[scanner] Reading file as base64:', readableUri);
    base64Data = await FileSystem.readAsStringAsync(readableUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch (err) {
    console.error('[scanner] Failed to read file as base64:', readableUri, err);
    throw new Error(`Failed to read image file: ${readableUri}`);
  }

  if (!base64Data || base64Data.length === 0) {
    console.error('[scanner] base64Data is empty for:', readableUri);
    throw new Error('Could not read file — base64 data is empty');
  }

  console.error(
    `[scanner] base64 size: ${(base64Data.length / 1024 / 1024).toFixed(2)} MB, uploading to ${bucket}/${storagePath}`,
  );

  // Upload with a 30-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/upload-media`, {
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
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      console.error('[scanner] Upload timed out after', UPLOAD_TIMEOUT_MS, 'ms');
      throw new Error(`Upload timed out after ${UPLOAD_TIMEOUT_MS / 1000}s`);
    }
    console.error('[scanner] fetch() failed:', err);
    throw new Error(`Upload network error: ${err?.message || 'Unknown error'}`);
  }
  clearTimeout(timeoutId);

  let result: any;
  try {
    result = await response.json();
  } catch (err) {
    console.error('[scanner] Failed to parse response JSON:', err);
    throw new Error(`Upload failed — invalid response (${response.status})`);
  }

  if (!response.ok) {
    console.error('[scanner] Upload failed:', response.status, result);
    throw new Error(result.error || `Upload failed (${response.status})`);
  }

  console.error('[scanner] Upload success:', storagePath);
  return { size: result.size ?? 0 };
}
