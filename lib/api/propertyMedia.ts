import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import * as FileSystem from 'expo-file-system';
import { decode as base64Decode } from 'base64-arraybuffer';

const STORAGE_BASE =
  'https://vddfghfvmnrbotmxhvvi.supabase.co/storage/v1/object/public/property-images';

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
  partition: 'Teilungserkl\u00e4rung',
  appraisal: 'Gutachten',
  other: 'Sonstige',
};

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

      // Read file as base64 and decode to ArrayBuffer for reliable Supabase upload
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = base64Decode(base64);

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(storagePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('property_images')
        .insert({
          property_id: propertyId,
          storage_path: storagePath,
          file_name: fileName,
          file_size: arrayBuffer.byteLength,
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
      // Reset all cover flags for this property
      const { error: resetError } = await supabase
        .from('property_images')
        .update({ is_cover: false })
        .eq('property_id', propertyId);

      if (resetError) throw resetError;

      // Set new cover
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

      // Get signed URLs for the private bucket
      const docs = data ?? [];
      const withUrls = await Promise.all(
        docs.map(async (doc: any) => {
          const { data: urlData } = await supabase.storage
            .from('property-documents')
            .createSignedUrl(doc.storage_path, 3600); // 1 hour
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

      // Read file as base64 and decode to ArrayBuffer for reliable Supabase upload
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = base64Decode(base64);

      const { error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(storagePath, arrayBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('property_documents')
        .insert({
          property_id: propertyId,
          storage_path: storagePath,
          file_name: fileName,
          file_size: fileSize ?? arrayBuffer.byteLength,
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
