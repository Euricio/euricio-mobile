import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAuthStore } from '../../store/authStore';

export interface FeedbackTicket {
  id: string;
  tenant_id: string | null;
  user_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  created_at: string;
  user_name?: string;
}

export interface FeedbackComment {
  id: string;
  ticket_id: string;
  user_id: string;
  body: string;
  created_at: string;
  user_name?: string;
}

export function useFeedbackTickets(status?: string) {
  return useQuery({
    queryKey: ['feedback-tickets', status],
    queryFn: async () => {
      let query = supabase
        .from('feedback_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as FeedbackTicket[];
    },
  });
}

export function useFeedbackTicket(id: string) {
  return useQuery({
    queryKey: ['feedback-ticket', id],
    queryFn: async () => {
      const { data: ticket, error: ticketError } = await supabase
        .from('feedback_tickets')
        .select('*')
        .eq('id', id)
        .single();
      if (ticketError) throw ticketError;

      const { data: comments, error: commentsError } = await supabase
        .from('feedback_comments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });
      if (commentsError) throw commentsError;

      return {
        ticket: ticket as FeedbackTicket,
        comments: (comments ?? []) as FeedbackComment[],
      };
    },
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (ticket: Partial<FeedbackTicket>) => {
      const { data, error } = await supabase
        .from('feedback_tickets')
        .insert({ ...ticket, user_id: user?.id, status: 'open' })
        .select()
        .single();
      if (error) throw error;
      return data as FeedbackTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-tickets'] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async ({ ticket_id, body }: { ticket_id: string; body: string }) => {
      const { data, error } = await supabase
        .from('feedback_comments')
        .insert({ ticket_id, body, user_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as FeedbackComment;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['feedback-ticket', vars.ticket_id] });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, priority }: { id: string; status?: string; priority?: string }) => {
      const updates: Record<string, string> = {};
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      const { data, error } = await supabase
        .from('feedback_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as FeedbackTicket;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feedback-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-ticket', data.id] });
    },
  });
}
