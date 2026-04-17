import { supabase, getFreshAccessToken } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import * as FileSystem from 'expo-file-system/legacy';

const SUPABASE_URL = 'https://vddfghfvmnrbotmxhvvi.supabase.co';
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/property-images`;

// ─── Types ───────────────────────────────────────────────────────────

export interface PropertyImage {
  id: string;
  property_id: number;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  is_cover: boolean;
  sort_order: number | null;
  uploaded_by: string | null;
  created_at: string;
  url: string;
}

export interface PropertyDocument {
  id: string;
  property_id: number;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  document_type: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
  signed_url?: string;
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  expose: 'Expose',
  floor_plan: 'Grundriss',
  energy_cert: 'Energieausweis',
  purchase_contract: 'Kaufvertrag',
  land_registry: 'Grundbuchauszug',
  partition: 'Teilungserklärung',
  appraisal: 'Gutachten',
  other: 'Sonstige',
};

// ─── Upload via Edge Function ────────────────────────────────────────
// React Native's fetch() cannot correctly send binary data (ArrayBuffer,
// Blob, FormData all produce 0-byte files with supabase-js).
// Solution: read file as base64, send as JSON to an Edge Function that
// decodes and uploads server-side. JSON fetch works 100% in RN.

async function uploadViaEdgeFunction(
  bucket: string,
  storagePath: string,
  fileUri: string,
  contentType: string,
): Promise<{ size: number }> {
  const accessToken = await getFreshAccessToken();

  // Read file as base64 — this always works reliably in RN
  const base64Data = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (!base64Data || base64Data.length === 0) {
    throw new Error('Could not read file');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/upload-media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
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

// ─── Images ──────────────────────────────────────────────────────────

export function usePropertyImages(propertyId: string | number) {
  return useQuery({
    queryKey: ['property-images', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId)
        .order('is_cover', { ascending: false })
        .order('sort_order')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((img: any) => ({
        ...img,
        url: `${STORAGE_BASE}/${img.storage_path}`,
      })) as PropertyImage[];
    },
    enabled: !!propertyId,
  });
}

export function useUploadPropertyImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      uri,
      index,
    }: {
      propertyId: string | number;
      uri: string;
      index: number;
    }) => {
      const userId = useAuthStore.getState().user?.id;
      const timestamp = Date.now();
      const fileName = `${timestamp}-${index}.jpeg`;
      const storagePath = `${propertyId}/${fileName}`;

      // Upload via Edge Function (sends base64 as JSON — works in RN)
      const { size } = await uploadViaEdgeFunction(
        'property-images',
        storagePath,
        uri,
        'image/jpeg',
      );

      const { data, error: insertError } = await supabase
        .from('property_images')
        .insert({
          property_id: propertyId,
          storage_path: storagePath,
          file_name: fileName,
          file_size: size,
          uploaded_by: userId,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['property-images', variables.propertyId],
      });
    },
  });
}

export function useDeletePropertyImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageId,
      storagePath,
      propertyId,
    }: {
      imageId: string;
      storagePath: string;
      propertyId: string | number;
    }) => {
      const { error: storageError } = await supabase.storage
        .from('property-images')
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from('property_images')
        .delete()
        .eq('id', imageId);

      if (deleteError) throw deleteError;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['property-images', variables.propertyId],
      });
    },
  });
}

export function useSetCoverImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      imageId,
      propertyId,
    }: {
      imageId: string;
      propertyId: string | number;
    }) => {
      const { error: resetError } = await supabase
        .from('property_images')
        .update({ is_cover: false })
        .eq('property_id', propertyId);

      if (resetError) throw resetError;

      const { error: setError } = await supabase
        .from('property_images')
        .update({ is_cover: true })
        .eq('id', imageId);

      if (setError) throw setError;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['property-images', variables.propertyId],
      });
    },
  });
}

// ─── Documents ───────────────────────────────────────────────────────

export function usePropertyDocuments(propertyId: string | number) {
  return useQuery({
    queryKey: ['property-documents', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const docs = data ?? [];
      const withUrls = await Promise.all(
        docs.map(async (doc: any) => {
          const { data: urlData } = await supabase.storage
            .from('property-documents')
            .createSignedUrl(doc.storage_path, 3600);
          return {
            ...doc,
            signed_url: urlData?.signedUrl ?? undefined,
          } as PropertyDocument;
        }),
      );

      return withUrls;
    },
    enabled: !!propertyId,
  });
}

export function useUploadPropertyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      uri,
      fileName,
      fileSize,
      mimeType,
      documentType,
    }: {
      propertyId: string | number;
      uri: string;
      fileName: string;
      fileSize: number | null;
      mimeType: string;
      documentType: string;
    }) => {
      const userId = useAuthStore.getState().user?.id;
      const timestamp = Date.now();
      const storagePath = `${propertyId}/${timestamp}-${fileName}`;

      // Upload via Edge Function (sends base64 as JSON — works in RN)
      const { size } = await uploadViaEdgeFunction(
        'property-documents',
        storagePath,
        uri,
        mimeType,
      );

      const { data, error: insertError } = await supabase
        .from('property_documents')
        .insert({
          property_id: propertyId,
          storage_path: storagePath,
          file_name: fileName,
          file_size: fileSize ?? size,
          document_type: documentType,
          uploaded_by: userId,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['property-documents', variables.propertyId],
      });
    },
  });
}

export function useDeletePropertyDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      storagePath,
      propertyId,
    }: {
      documentId: string;
      storagePath: string;
      propertyId: string | number;
    }) => {
      const { error: storageError } = await supabase.storage
        .from('property-documents')
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from('property_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['property-documents', variables.propertyId],
      });
    },
  });
}
