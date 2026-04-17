import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  position: string | null;
  is_active: boolean;
  is_internal: boolean;
  tenant_id: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  plan_id: string | null;
  plan_name: string | null;
}

export function useAllUsers(search?: string, role?: string) {
  return useQuery({
    queryKey: ['admin-users', search, role],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, position, is_active, is_internal, tenant_id, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (role && role !== 'all') {
        query = query.eq('role', role);
      }

      if (search && search.length >= 2) {
        query = query.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (profileError) throw profileError;

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('owner_id', id)
        .eq('status', 'active')
        .maybeSingle();

      return {
        ...profile,
        plan_id: subscription?.plan_id ?? null,
      } as AdminUser;
    },
    enabled: !!id,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', vars.id] });
    },
  });
}
