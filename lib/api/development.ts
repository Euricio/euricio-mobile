import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

export interface DevelopmentPlan {
  id: string;
  tenant_id: string;
  user_id: string;
  area: string;
  trigger_category: string | null;
  current_situation: string | null;
  target_state: string | null;
  success_criteria: string | null;
  planned_measures: string | null;
  progress: number;
  status: 'draft' | 'active' | 'completed' | 'blocked';
  start_date: string | null;
  target_date: string | null;
  review_date: string | null;
  created_by: string | null;
  created_at: string;
  profile?: { id: string; full_name: string; role: string; position: string | null };
}

export function useDevelopmentPlans(status?: string, search?: string) {
  return useQuery({
    queryKey: ['development-plans', status, search],
    queryFn: async () => {
      let query = supabase
        .from('development_plans')
        .select('*, profile:profiles!user_id(id, full_name, role, position)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (search && search.length >= 2) {
        query = query.or(
          `area.ilike.%${search}%,current_situation.ilike.%${search}%,target_state.ilike.%${search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as DevelopmentPlan[];
    },
  });
}

export function useDevelopmentPlan(id: string) {
  return useQuery({
    queryKey: ['development-plan', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('development_plans')
        .select('*, profile:profiles!user_id(id, full_name, role, position)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as DevelopmentPlan;
    },
    enabled: !!id,
  });
}

export function useCreateDevelopmentPlan() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (plan: Partial<DevelopmentPlan>) => {
      const { data, error } = await supabase
        .from('development_plans')
        .insert({ ...plan, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as DevelopmentPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['development-plans'] });
    },
  });
}

export function useUpdateDevelopmentPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DevelopmentPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from('development_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DevelopmentPlan;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['development-plans'] });
      queryClient.invalidateQueries({ queryKey: ['development-plan', data.id] });
    },
  });
}

export function useDeleteDevelopmentPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('development_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['development-plans'] });
    },
  });
}
