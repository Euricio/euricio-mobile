import { supabase, uploadToStorage } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import * as FileSystem from 'expo-file-system/legacy';

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
 * Images should already be persisted to our cache directory at pick time
 * (see scanner/index.tsx persistToCache). This is a safety-net that verifies
 * the file exists and falls back to copying if needed.
 */
async function ensureReadableUri(uri: string): Promise<string> {
  // Check if file exists at the given URI
  if (uri.startsWith('file://')) {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      console.error('[scanner] File exists and readable:', uri, `(${info.size} bytes)`);
      return uri;
    }
    console.error('[scanner] File does NOT exist at:', uri);
  }

  // Fallback: try to copy to our own cache
  const fileName = `scan-copy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
  const dest = `${FileSystem.cacheDirectory}${fileName}`;
  try {
    await FileSystem.copyAsync({ from: uri, to: dest });
    console.error('[scanner] Fallback: copied to own cache:', dest);
    return dest;
  } catch (copyErr) {
    console.error('[scanner] copyAsync also failed:', uri, copyErr);
    throw new Error(`Cannot access image file: ${uri}`);
  }
}

export function useUploadScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileUris, mode, contractId }: UploadScanParams) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Not authenticated');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const bucket = contractId ? 'contracts' : 'scanned-documents';

      if (mode === 'pdf') {
        const storagePath = contractId
          ? `${userId}/contracts/${contractId}/signed.pdf`
          : `${userId}/scans/${timestamp}.pdf`;

        console.error('[scanner] Uploading PDF:', storagePath);
        const readablePdfUri = await ensureReadableUri(fileUris[0]);
        await uploadToStorage(bucket, storagePath, readablePdfUri, 'application/pdf');

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
        const readableImageUri = await ensureReadableUri(fileUris[i]);
        await uploadToStorage(bucket, storagePath, readableImageUri, 'image/jpeg');
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

