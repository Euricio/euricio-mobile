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
    }) =>
      api<{ url: string }>('/api/valuations/generate-pdf', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
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
