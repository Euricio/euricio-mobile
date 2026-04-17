import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

export interface Appointment {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  type: 'visit' | 'call' | 'meeting' | 'other';
  status: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  start_at: string | null;
  end_at: string | null;
  lead_id: string | null;
  property_id: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  lead?: { id: string; full_name: string } | null;
  property?: { id: string; title: string } | null;
}

export function useAppointments(month: string) {
  // month format: "YYYY-MM"
  return useQuery({
    queryKey: ['appointments', month],
    queryFn: async () => {
      const from = `${month}-01T00:00:00`;
      const lastDay = new Date(
        parseInt(month.split('-')[0]),
        parseInt(month.split('-')[1]),
        0,
      ).getDate();
      const to = `${month}-${String(lastDay).padStart(2, '0')}T23:59:59`;

      const { data, error } = await supabase
        .from('appointments')
        .select('*, lead:leads(id, full_name), property:properties(id, title)')
        .gte('start_at', from)
        .lte('start_at', to)
        .order('start_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, lead:leads(id, full_name), property:properties(id, title)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (appt: Partial<Appointment>) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert({ ...appt, created_by: user?.id, user_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', data.id] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
