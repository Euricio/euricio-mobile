import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

/* ── Types ──────────────────────────────────────────────────── */

export interface ValuationRequest {
  id: string;
  tenant_id: string;
  property_type: string | null;
  address: string | null;
  postal_code: string | null;
  area_m2: number | null;
  rooms: number | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  sell_timeline: string | null;
  status: string;
  imported_lead_id: string | null;
  created_at: string;
}

/* ── Queries ────────────────────────────────────────────────── */

export function useValuationRequests(search?: string) {
  return useQuery({
    queryKey: ['valuation-requests', search],
    queryFn: async () => {
      let query = supabase
        .from('valuation_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (search && search.length >= 2) {
        query = query.or(
          `contact_name.ilike.%${search}%,address.ilike.%${search}%,contact_email.ilike.%${search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ValuationRequest[];
    },
  });
}

export function useValuationRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['valuation-request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('valuation_requests')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as ValuationRequest;
    },
    enabled: !!id,
  });
}

/* ── Mutations ──────────────────────────────────────────────── */

export function useImportValuationAsLead() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (request: ValuationRequest) => {
      // Create lead from valuation request data
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: request.contact_name || 'Bewertungsanfrage',
          email: request.contact_email,
          phone: request.contact_phone,
          source: 'bewertung',
          notes: `Bewertungsanfrage: ${request.property_type || ''} ${request.address || ''} ${request.area_m2 ? request.area_m2 + 'm²' : ''} ${request.rooms ? request.rooms + ' Zi.' : ''}`.trim(),
          created_by: user?.id,
        })
        .select()
        .single();
      if (leadError) throw leadError;

      // Mark request as imported
      const { error: updateError } = await supabase
        .from('valuation_requests')
        .update({
          status: 'imported',
          imported_lead_id: lead.id,
        })
        .eq('id', request.id);
      if (updateError) throw updateError;

      return lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valuation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
