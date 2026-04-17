import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

export interface Shift {
  id: string;
  tenant_id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number | null;
  location: string | null;
  notes: string | null;
  status: 'planned' | 'appeared' | 'absent';
  created_by: string | null;
  created_at: string;
  profile?: { id: string; full_name: string; role: string; position: string | null };
}

export interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  position: string | null;
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, position')
        .eq('is_internal', true)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
  });
}

export function useTeamShifts(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['team-shifts', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('*, profile:profiles!user_id(id, full_name, role, position)')
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Shift[];
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (shift: Partial<Shift>) => {
      const { data, error } = await supabase
        .from('shifts')
        .insert({ ...shift, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as Shift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-shifts'] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Shift> & { id: string }) => {
      const { data, error } = await supabase
        .from('shifts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Shift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-shifts'] });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-shifts'] });
    },
  });
}
