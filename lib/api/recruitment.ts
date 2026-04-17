import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

export type CandidateStage =
  | 'applied'
  | 'shortlisted'
  | 'interview_1'
  | 'interview_2'
  | 'offer'
  | 'hired'
  | 'rejected';

export const RECRUITMENT_STAGES: { key: CandidateStage; color: string }[] = [
  { key: 'applied', color: '#6B7280' },
  { key: 'shortlisted', color: '#3B82F6' },
  { key: 'interview_1', color: '#8B5CF6' },
  { key: 'interview_2', color: '#A855F7' },
  { key: 'offer', color: '#F59E0B' },
  { key: 'hired', color: '#10B981' },
  { key: 'rejected', color: '#EF4444' },
];

export interface Candidate {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  region: string | null;
  experience_years: number | null;
  languages: string[] | null;
  source: string | null;
  referred_by: string | null;
  cv_url: string | null;
  cover_letter_url: string | null;
  notes: string | null;
  stage: CandidateStage;
  rejection_reason: string | null;
  interview_1_date: string | null;
  interview_2_date: string | null;
  offer_date: string | null;
  hire_date: string | null;
  created_by: string | null;
  created_at: string;
}

export function useCandidates(stage?: CandidateStage) {
  return useQuery({
    queryKey: ['candidates', stage],
    queryFn: async () => {
      let query = supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (stage) {
        query = query.eq('stage', stage);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Candidate[];
    },
  });
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Candidate;
    },
    enabled: !!id,
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (candidate: Partial<Candidate>) => {
      const { data, error } = await supabase
        .from('candidates')
        .insert({ ...candidate, created_by: user?.id, stage: candidate.stage || 'applied' })
        .select()
        .single();
      if (error) throw error;
      return data as Candidate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Candidate> & { id: string }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Candidate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate', data.id] });
    },
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
}
