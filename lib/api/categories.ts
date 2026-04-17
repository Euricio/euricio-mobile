import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface TimeCategory {
  id: string;
  tenant_id: string;
  name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ['time-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TimeCategory[];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Partial<TimeCategory>) => {
      const { data, error } = await supabase
        .from('time_categories')
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data as TimeCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TimeCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('time_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as TimeCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('time_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-categories'] });
    },
  });
}
