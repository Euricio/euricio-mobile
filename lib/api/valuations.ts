import { supabase } from '../supabase';
import { useMutation } from '@tanstack/react-query';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://euricio.es';

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { ...headers, ...opts.headers },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/* ── Types ──────────────────────────────────────────────────── */

export interface ValuationInput {
  address: string;
  postal_code: string;
  area_m2: number;
  rooms: number;
  property_type: string;
  condition: string;
  year_built: number;
  condition_factor?: number;
  custom_adjustment?: number;
}

export interface ValuationResult {
  min: number;
  mid: number;
  max: number;
  price_per_m2?: number;
}

export interface ValuationPdfResult {
  url: string;
}

/* ── Mutations ──────────────────────────────────────────────── */

export function useCalculateVergleichswert() {
  return useMutation({
    mutationFn: async (input: ValuationInput) =>
      api<ValuationResult>('/api/valuations/calculate', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useCalculateSubstanzwert() {
  return useMutation({
    mutationFn: async (input: ValuationInput) =>
      api<ValuationResult>('/api/valuations/calculate-substanzwert', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useCalculateErtragswert() {
  return useMutation({
    mutationFn: async (input: ValuationInput) =>
      api<ValuationResult>('/api/valuations/calculate-ertragswert', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useGenerateValuationPdf() {
  return useMutation({
    mutationFn: async (input: ValuationInput & { results: ValuationResult }) =>
      api<ValuationPdfResult>('/api/valuations/generate-pdf', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useSendValuationReport() {
  return useMutation({
    mutationFn: async (params: {
      email: string;
      input: ValuationInput;
      results: ValuationResult;
    }) =>
      api<{ success: boolean }>('/api/valuations/send-report', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
}
