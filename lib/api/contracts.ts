import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

export interface SavedClause {
  key: string;
  title_de: string;
  title_es: string;
  text: string;
  enabled: boolean;
}

export interface Contract {
  id: string;
  user_id: string;
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
  pdf_url: string | null;
  pdf_stored_url: string | null;
  contract_date: string | null;
  signing_location: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  property?: {
    id: string;
    title: string | null;
    street: string | null;
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
        .select('*, property:properties(id, title, street, city, province, price)')
        .eq('user_id', user!.id)
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
        .select('*, property:properties(id, title, street, city, province, price)')
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
        .insert({ ...contract, user_id: user?.id, status: 'draft' })
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
    mutationFn: async (contractId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
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

      return res;
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
        .select('id, title, street, city, province, price')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}
