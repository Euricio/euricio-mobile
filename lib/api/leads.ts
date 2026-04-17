import { supabase, uploadToStorage } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

export interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  assigned_to: string | null;
  notes: string | null;
  pipeline_stage: string | null;
  preferred_language: string | null;
  budget: number | null;
  created_at: string;
  updated_at: string;
}

export function useLeads(search?: string) {
  return useQuery({
    queryKey: ['leads', search],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (search && search.length >= 2) {
        query = query.or(
          `full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert({ ...lead, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', data.id] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useLeadCount() {
  return useQuery({
    queryKey: ['lead-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useUploadLeadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      pdfUri,
      fileName,
    }: {
      leadId: string;
      pdfUri: string;
      fileName: string;
    }) => {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Not authenticated');

      const storagePath = `${userId}/leads/${leadId}/${fileName}`;
      const { size } = await uploadToStorage(
        'scanned-documents',
        storagePath,
        pdfUri,
        'application/pdf',
      );

      const { error } = await supabase.from('lead_documents').insert({
        lead_id: leadId,
        storage_path: storagePath,
        file_name: fileName,
        file_size: size,
        document_type: 'scan',
        uploaded_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
