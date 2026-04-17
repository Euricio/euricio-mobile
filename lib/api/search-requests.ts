import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

/* ── Types ──────────────────────────────────────────────────── */

export interface SearchRequest {
  id: string;
  tenant_id: string;
  intent: 'buy' | 'rent';
  property_type: string | null;
  min_area: number | null;
  max_area: number | null;
  min_rooms: number | null;
  max_rooms: number | null;
  min_budget: number | null;
  max_budget: number | null;
  location_preference: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  status: string;
  imported_lead_id: string | null;
  created_at: string;
}

export interface SearchRequestMatch {
  id: string;
  request_id: string;
  property_id: string;
  score: number;
  created_at: string;
}

/* ── Queries ────────────────────────────────────────────────── */

export function useSearchRequests(status?: string, search?: string) {
  return useQuery({
    queryKey: ['search-requests', status, search],
    queryFn: async () => {
      let query = supabase
        .from('search_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (search && search.length >= 2) {
        query = query.or(
          `contact_name.ilike.%${search}%,location_preference.ilike.%${search}%,contact_email.ilike.%${search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as SearchRequest[];
    },
  });
}

export function useSearchRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['search-request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('search_requests')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as SearchRequest;
    },
    enabled: !!id,
  });
}

export function useSearchRequestMatches(requestId: string | undefined) {
  return useQuery({
    queryKey: ['search-request-matches', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('search_request_matches')
        .select('*, property:properties(id, title, city, price, area_m2)')
        .eq('request_id', requestId!)
        .order('score', { ascending: false });
      if (error) throw error;
      return (data ?? []) as (SearchRequestMatch & {
        property: { id: string; title: string; city: string | null; price: number | null; area_m2: number | null } | null;
      })[];
    },
    enabled: !!requestId,
  });
}

/* ── Mutations ──────────────────────────────────────────────── */

export function useImportSearchRequestAsLead() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (request: SearchRequest) => {
      const intentLabel = request.intent === 'buy' ? 'Kauf' : 'Miete';
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: request.contact_name || 'Suchanfrage',
          email: request.contact_email,
          phone: request.contact_phone,
          source: 'suchanfrage',
          notes: `Suchanfrage (${intentLabel}): ${request.property_type || ''} ${request.location_preference || ''} ${request.min_budget && request.max_budget ? `${request.min_budget}–${request.max_budget} EUR` : ''}`.trim(),
          created_by: user?.id,
        })
        .select()
        .single();
      if (leadError) throw leadError;

      const { error: updateError } = await supabase
        .from('search_requests')
        .update({
          status: 'matched',
          imported_lead_id: lead.id,
        })
        .eq('id', request.id);
      if (updateError) throw updateError;

      return lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateSearchRequestStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; status: string }) => {
      const { error } = await supabase
        .from('search_requests')
        .update({ status: params.status })
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-requests'] });
    },
  });
}
