import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  position: string | null;
  language: string | null;
  is_active: boolean;
  is_internal: boolean;
  tenant_id: string | null;
  created_at: string;
}

export function useTeamMembers(status?: string, search?: string) {
  return useQuery({
    queryKey: ['admin-team', status, search],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, position, language, is_active, is_internal, tenant_id, created_at')
        .order('full_name', { ascending: true })
        .limit(200);

      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (search && search.length >= 2) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,position.ilike.%${search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
  });
}

export function useTeamMember(id: string) {
  return useQuery({
    queryKey: ['admin-team-member', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as TeamMember;
    },
    enabled: !!id,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (member: Partial<TeamMember>) => {
      const { data, error } = await supabase
        .from('profiles')
        .insert(member)
        .select()
        .single();
      if (error) throw error;
      return data as TeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamMember> & { id: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as TeamMember;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      queryClient.invalidateQueries({ queryKey: ['admin-team-member', data.id] });
    },
  });
}

export function useToggleTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as TeamMember;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      queryClient.invalidateQueries({ queryKey: ['admin-team-member', data.id] });
    },
  });
}
