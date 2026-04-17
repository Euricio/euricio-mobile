import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

export interface Partner {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  alias: string | null;
  email: string | null;
  email_alt: string | null;
  phone: string | null;
  phone_alt: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  nif: string | null;
  language: string | null;
  category: string;
  organization: string | null;
  status: string;
  commission_type: string | null;
  commission_value: number | null;
  commission_notes: string | null;
  notes: string | null;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Commission {
  id: string;
  partner_id: string;
  property_id: string | null;
  lead_id: string | null;
  description: string | null;
  property_price: number | null;
  commission_type: string;
  commission_value: number;
  commission_amount: number | null;
  status: string;
  paid_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  property?: { id: string; title: string } | null;
  lead?: { id: string; full_name: string } | null;
}

export function usePartners(search?: string) {
  return useQuery({
    queryKey: ['partners', search],
    queryFn: async () => {
      let query = supabase
        .from('partners')
        .select('id, first_name, last_name, alias, email, phone, city, category, organization, status, commission_type, commission_value, created_at')
        .order('last_name', { ascending: true })
        .limit(100);

      if (search && search.length >= 2) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,organization.ilike.%${search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Partner[];
    },
  });
}

export function usePartner(id: string) {
  return useQuery({
    queryKey: ['partner', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Partner;
    },
    enabled: !!id,
  });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (partner: Partial<Partner>) => {
      const { data, error } = await supabase
        .from('partners')
        .insert({ ...partner, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as Partner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Partner> & { id: string }) => {
      const { data, error } = await supabase
        .from('partners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Partner;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner', data.id] });
    },
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });
}

export function usePartnerCommissions(partnerId: string) {
  return useQuery({
    queryKey: ['partner-commissions', partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_commissions')
        .select('*, property:properties(id, title), lead:leads(id, full_name)')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Commission[];
    },
    enabled: !!partnerId,
  });
}

export function useCreateCommission() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (commission: Partial<Commission>) => {
      const { data, error } = await supabase
        .from('partner_commissions')
        .insert({ ...commission, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as Commission;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partner-commissions', data.partner_id] });
    },
  });
}

export function useUpdateCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Commission> & { id: string }) => {
      const { data, error } = await supabase
        .from('partner_commissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Commission;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partner-commissions', data.partner_id] });
    },
  });
}
