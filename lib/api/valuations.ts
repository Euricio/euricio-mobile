import { supabase } from '../supabase';
import { useMutation } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type {
  ValuationResultV2,
  PropertyValuationFields,
  PropertyType,
} from '../valuation/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';

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
    // Try to parse structured API errors (e.g. ES notary_input_required) so
    // callers can branch on `.status` and `.body` instead of regex-matching.
    let parsedBody: unknown = undefined;
    try { parsedBody = JSON.parse(body); } catch { /* plain text */ }
    const err = new Error(body || `API ${res.status}: ${res.statusText}`) as Error & {
      status?: number;
      body?: unknown;
    };
    err.status = res.status;
    err.body = parsedBody;
    throw err;
  }
  return res.json();
}

/* ── ES Portal Estadístico del Notariado ───────────────────── */

export interface NotaryPriceCache {
  cached: boolean;
  postal_code?: string;
  price_per_sqm?: number;
  fetched_at?: string;
  expires_at?: string;
  age_days?: number;
  source_url?: string;
  reference_period?: string | null;
  notary_portal_url?: string;
}

export async function getNotaryPrice(postalCode: string): Promise<NotaryPriceCache> {
  return api<NotaryPriceCache>(`/api/es/notary-price?postal_code=${encodeURIComponent(postalCode)}`);
}

export interface NotaryPricePostResult {
  ok: boolean;
  postal_code: string;
  price_per_sqm: number;
  cached_until: string;
  reference_period?: string;
  sanity_warning?: { provincial_avg: number; message: string };
}

export async function postNotaryPrice(
  postalCode: string,
  pricePerSqm: number,
  confirmedDivergence = false,
): Promise<NotaryPricePostResult> {
  return api<NotaryPricePostResult>('/api/es/notary-price', {
    method: 'POST',
    body: JSON.stringify({
      postal_code: postalCode,
      price_per_sqm: pricePerSqm,
      confirmed_divergence: confirmedDivergence,
    }),
  });
}

/* ── Types ──────────────────────────────────────────────────── */

// Land category input (per-category area, optional price override, condition)
export interface LandCategoryInput {
  area_m2: number;
  price_per_m2?: number;
  condition: 'good' | 'average' | 'poor';
}

// Vergleichswert (Comparative) Input
export interface VergleichswertInput {
  postal_code: string;
  country: string;
  living_area_sqm: number;
  land_categories: {
    terreno_urbano: LandCategoryInput;
    terreno_agricola: LandCategoryInput;
    terreno_forestal: LandCategoryInput;
    terreno_pastizal: LandCategoryInput;
  };
  terreno_urbano_price_override?: number;
  condition_factor: number;
  condition_multiplier: number;
  condition_label: string;
  custom_adjustment_factor: number;
  property_id?: number;
  // Features
  bedrooms: number;
  bathrooms: number;
  construction_year?: number;
  terrace_m2: number;
  garage_spaces: number;
  has_pool: boolean;
  has_sea_view: boolean;
  has_elevator: boolean;
  furnished: boolean;
  // Special conditions
  occupado_enabled: boolean;
  occupado_deduction_pct: number;
  nuda_propiedad_enabled: boolean;
  usufructuary_age?: number;
}

// Substanzwert (Asset Value) Input
export interface SubstanzwertInput {
  postal_code: string;
  country: string;
  wohnflaeche: number;
  grundstuecksflaeche: number;
  baujahr: number;
  gebaeudetyp: string;
  ausstattungsqualitaet: string;
  zustand: string;
  property_id?: number;
}

// Ertragswert (Income Value) Input
export interface ErtragswertInput {
  postal_code: string;
  country: string;
  grundstuecksflaeche: number;
  monatliche_mieteinnahmen: number;
  jaehrliche_bewirtschaftungskosten?: number;
  liegenschaftszins: number;
  restnutzungsdauer: number;
  property_id?: number;
}

/* ── Result Types ──────────────────────────────────────────── */

export interface LandCategoryResult {
  area_m2: number;
  price_per_m2: number;
  condition: string;
  value: number;
}

export interface VergleichswertResult {
  id: string;
  postal_code: string;
  country: string;
  living_area_sqm: number;
  land_area_sqm: number;
  condition_factor: number;
  custom_adjustment_factor: number;
  avg_sqm_built: number;
  avg_sqm_land: number;
  fetched_agricultural_price?: number;
  fetched_forest_price?: number;
  fetched_pasture_price?: number;
  fetched_agricultural_price_estimated?: boolean;
  fetched_forest_price_estimated?: boolean;
  fetched_pasture_price_estimated?: boolean;
  fetched_urban_land_price_estimated?: boolean;
  base_value_built: number;
  base_value_land: number;
  raw_value: number;
  adjusted_value: number;
  min_value: number;
  max_value: number;
  last_updated_at: string;
  price_source?: string;
  price_source_label?: string | null;
  price_source_url?: string | null;
  price_reference_period?: string | null;
  price_confidence?: 'high' | 'medium' | 'low';
  resolved_municipality?: string | null;
  resolved_province?: string | null;
  price_fetch_error_code?: string | null;
  price_fetch_error_message?: string | null;
  // Extended fields
  building_value?: number;
  adjusted_building_value?: number;
  total_land_value?: number;
  condition_multiplier?: number;
  condition_label?: string;
  land_categories?: {
    terreno_urbano: LandCategoryResult;
    terreno_agricola: LandCategoryResult;
    terreno_forestal: LandCategoryResult;
    terreno_pastizal: LandCategoryResult;
  };
  // Occupado
  occupado_enabled?: boolean;
  occupado_deduction_pct?: number;
  occupado_deduction?: number;
  value_before_occupado?: number;
  value_after_occupado?: number;
  // Nuda Propiedad
  nuda_propiedad_enabled?: boolean;
  usufruct_pct?: number;
  nuda_propiedad_pct?: number;
  usufruct_value?: number;
  nuda_propiedad_value?: number;
  // Features
  bedrooms?: number;
  bedroom_factor?: number;
  bathrooms?: number;
  bathroom_factor?: number;
  construction_year?: number;
  age_factor?: number;
  age_years?: number;
  terrace_m2?: number;
  terrace_value?: number;
  garage_spaces?: number;
  garage_value?: number;
  has_pool?: boolean;
  pool_factor?: number;
  has_sea_view?: boolean;
  sea_view_factor?: number;
  has_elevator?: boolean;
  elevator_factor?: number;
  furnished?: boolean;
  furnished_factor?: number;
  subtotal?: number;
  gross_total?: number;
}

export interface SubstanzwertResult {
  id: string;
  postal_code: string;
  country: string;
  wohnflaeche: number;
  grundstuecksflaeche: number;
  baujahr: number;
  gebaeudetyp: string;
  ausstattungsqualitaet: string;
  zustand: string;
  avg_sqm_land: number;
  bodenwert: number;
  normalherstellungskosten: number;
  herstellungskosten: number;
  restnutzungsdauer: number;
  gesamtnutzungsdauer: number;
  alterswertminderung: number;
  zeitwert_gebaeude: number;
  substanzwert: number;
  last_updated_at: string;
  price_source?: string;
  price_fetch_error_code?: string | null;
  price_fetch_error_message?: string | null;
}

export interface ErtragswertResult {
  id: string;
  postal_code: string;
  country: string;
  grundstuecksflaeche: number;
  monatliche_mieteinnahmen: number;
  jahresrohertrag: number;
  bewirtschaftungskosten: number;
  reinertrag: number;
  avg_sqm_land: number;
  bodenwert: number;
  liegenschaftszins: number;
  bodenwertverzinsung: number;
  reinertragsanteil_gebaeude: number;
  vervielfaeltiger: number;
  restnutzungsdauer: number;
  ertragswert_gebaeude: number;
  ertragswert: number;
  last_updated_at: string;
  price_source?: string;
  price_fetch_error_code?: string | null;
  price_fetch_error_message?: string | null;
}

// Property type from Supabase
export interface Property {
  id: number;
  title: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  price: number | null;
  size_m2: number | null;
  rooms: number | null;
  bathrooms: number | null;
  has_garage: boolean;
  garage_spaces: number | null;
  has_terrace: boolean;
  terrace_m2: number | null;
  has_pool: boolean;
  has_sea_view: boolean;
  has_elevator: boolean;
  is_furnished: boolean;
  condition: string | null;
  legal_status: string | null;
  terreno_urbano_m2: number | null;
  terreno_agricola_m2: number | null;
  terreno_forestal_m2: number | null;
  terreno_pastizal_m2: number | null;
}

/* ── Mutations ──────────────────────────────────────────────── */

export function useCalculateVergleichswert() {
  return useMutation({
    mutationFn: async (input: VergleichswertInput) =>
      api<VergleichswertResult>('/api/valuations/calculate', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useCalculateSubstanzwert() {
  return useMutation({
    mutationFn: async (input: SubstanzwertInput) =>
      api<SubstanzwertResult>('/api/valuations/calculate-substanzwert', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useCalculateErtragswert() {
  return useMutation({
    mutationFn: async (input: ErtragswertInput) =>
      api<ErtragswertResult>('/api/valuations/calculate-ertragswert', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useGenerateValuationPdf() {
  return useMutation({
    mutationFn: async (params: {
      methods: string[];
      results: Record<string, VergleichswertResult | SubstanzwertResult | ErtragswertResult>;
      language: string;
      property_id?: number;
    }): Promise<{ uri: string; filename: string }> => {
      const headers = await authHeaders();
      const res = await fetch(`${API_URL}/api/valuations/generate-pdf`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || `API ${res.status}: ${res.statusText}`);
      }

      // Extract filename from Content-Disposition header (fallback: generic name)
      const disposition = res.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const filename = match?.[1] || `valuation-${Date.now()}.pdf`;

      // Download PDF binary → write to cache directory
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const file = new File(Paths.cache, filename);
      if (file.exists) {
        file.delete();
      }
      file.create();
      file.write(bytes);

      // Open native share sheet so user can Save to Files, AirDrop, etc.
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/pdf',
          dialogTitle: filename,
          UTI: 'com.adobe.pdf',
        });
      }

      return { uri: file.uri, filename };
    },
  });
}

/* ── Valuation v2 ──────────────────────────────────────────── */

export interface CalculateV2Input {
  property_type: PropertyType;
  country: string;
  postal_code: string;
  property_id?: number;
  fields: PropertyValuationFields;
  vpo?: PropertyValuationFields;
  method_weights_override?: Record<string, number>;
  explain?: boolean;
}

export interface CalculateV2Error {
  error: 'notary_input_required';
  portalUrl: string;
  postal_code: string;
}

export async function calculateV2(input: CalculateV2Input): Promise<ValuationResultV2> {
  return api<ValuationResultV2>('/api/valuations/calculate-v2', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function useSendValuationReport() {
  return useMutation({
    mutationFn: async (params: {
      methods: string[];
      results: Record<string, VergleichswertResult | SubstanzwertResult | ErtragswertResult>;
      customerEmail: string;
      customerName?: string;
      language: string;
      property_id?: number;
    }) =>
      api<{ success: boolean }>('/api/valuations/send-report', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
}
