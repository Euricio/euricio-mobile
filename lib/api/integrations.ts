import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface ApiKey {
  id: string;
  key: string;
  tenant_id: string;
  created_at: string;
}

export interface WidgetConfig {
  id: string;
  tenant_id: string;
  widget_type: string;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
}

export function useApiKey() {
  return useQuery({
    queryKey: ['api-key'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ApiKey | null;
    },
  });
}

export function useRegenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const newKey = 'eur_' + Array.from({ length: 32 }, () =>
        'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))
      ).join('');

      const { data: existing } = await supabase
        .from('api_keys')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('api_keys')
          .update({ key: newKey })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as ApiKey;
      } else {
        const { data, error } = await supabase
          .from('api_keys')
          .insert({ key: newKey })
          .select()
          .single();
        if (error) throw error;
        return data as ApiKey;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-key'] });
    },
  });
}

export function useWidgets() {
  return useQuery({
    queryKey: ['widgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('widget_configurations')
        .select('*')
        .order('widget_type', { ascending: true });
      if (error) throw error;
      return (data ?? []) as WidgetConfig[];
    },
  });
}

export function useUpdateWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WidgetConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from('widget_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as WidgetConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
    },
  });
}
