import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../i18n';
import type { Locale } from '../i18n';

export interface PipelineStage {
  id: string;
  tenant_id: string;
  stage_key: string;
  name_de: string;
  name_en: string;
  name_es: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
}

export interface PipelineLead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  priority: string | null;
  source: string | null;
  pipeline_stage: string | null;
  budget: number | null;
  intent: string | null;
  created_at: string;
  properties?: { id: string; price: number | null }[] | null;
}

export function getStageName(stage: PipelineStage, locale: Locale): string {
  const key = `name_${locale}` as keyof PipelineStage;
  return (stage[key] as string) || stage.name_de || stage.stage_key;
}

export function usePipelineStages() {
  return useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PipelineStage[];
    },
  });
}

export function usePipelineLeads() {
  return useQuery({
    queryKey: ['pipeline-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, full_name, email, phone, status, priority, source, pipeline_stage, budget, intent, created_at, properties(id, price)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as PipelineLead[];
    },
  });
}

export function useMoveLeadToStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, stageKey }: { leadId: string; stageKey: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ pipeline_stage: stageKey })
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useCreateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stage: Partial<PipelineStage>) => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .insert(stage)
        .select()
        .single();
      if (error) throw error;
      return data as PipelineStage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
    },
  });
}

export function useUpdateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PipelineStage> & { id: string }) => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PipelineStage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
    },
  });
}

export function useDeleteStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] });
    },
  });
}
