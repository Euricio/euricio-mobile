// SOURCE OF TRUTH — web copy at Euricio.es/lib/valuation/types.ts MUST stay in sync
// Mobile-only shapes: runtime function types (triggers, confidence rules) are
// intentionally stripped (replaced with `unknown`/`any`) since mobile only
// consumes profile data — the backend engine evaluates rules.

export type PropertyType =
  | 'piso'
  | 'casa'
  | 'local_comercial'
  | 'oficina'
  | 'nave_industrial'
  | 'suelo_urbano'
  | 'suelo_rustico'
  | 'edificio_residencial'
  | 'hotel'
  | 'garaje_trastero'
  | 'inmueble_mixto'
  | 'especial';

export type MethodId =
  | 'comparativo'
  | 'rendimiento'
  | 'sustancial'
  | 'comparativo_suelo'
  | 'residual_urbano'
  | 'rustico';

export type ConfidenceClass = 'alta' | 'media' | 'baja';

export type WarningSeverity = 'info' | 'warn' | 'error';

export interface Warning {
  code: string;
  severity: WarningSeverity;
  message: string;
  method?: MethodId;
  field?: string;
}

export interface MethodWeight {
  method: MethodId;
  weight: number;
  role?: 'primary' | 'secondary' | 'tertiary';
  /** Engine-only trigger; mobile does not evaluate this. */
  trigger?: unknown;
}

export interface FieldGroup {
  id: string;
  label_es: string;
  label_de?: string;
  fields: string[];
  collapsed?: boolean;
}

export interface ValuationProfile {
  type: PropertyType;
  labels: { es: string; de: string; en: string };
  icon: string;
  field_groups: FieldGroup[];
  methods: MethodWeight[];
  required_fields: string[];
  /** Engine-only rules; mobile does not evaluate. */
  confidence_rules?: unknown[];
  allows_vpo: boolean;
  bounds?: {
    min_sqm_price?: number;
    max_sqm_price?: number;
    min_total?: number;
  };
}

export interface PropertyValuationFields {
  // common
  living_area_sqm?: number;
  built_area_sqm?: number;
  land_area_sqm?: number;
  construction_year?: number;

  // residential
  bedrooms?: number;
  bathrooms?: number;
  terrace_m2?: number;
  garage_spaces?: number;
  has_pool?: boolean;
  has_sea_view?: boolean;
  has_elevator?: boolean;
  furnished?: boolean;

  // commercial / office / industrial / hotel
  usable_area_sqm?: number;
  loading_docks?: number;
  ceiling_height_m?: number;
  office_share?: number;
  keys?: number;
  stars?: number;

  // income
  is_rented?: boolean;
  monthly_rent?: number;
  estimated_monthly_rent?: number;
  annual_operating_costs?: number;
  vacancy_ratio?: number;
  contract_term_years?: number;

  // suelo urbano
  edificabilidad?: number;
  max_built_area_sqm?: number;
  urban_classification?: string;

  // suelo rustico
  suelo_rustico_categories?: {
    agrario?: { area_m2: number; price_per_m2?: number; productivity?: 'high' | 'medium' | 'low' };
    forestal?: { area_m2: number; price_per_m2?: number; productivity?: 'high' | 'medium' | 'low' };
    pastizal?: { area_m2: number; price_per_m2?: number; productivity?: 'high' | 'medium' | 'low' };
  };
  access_quality?: 'good' | 'fair' | 'none';
  has_water?: boolean;

  // legacy land categories
  land_categories?: {
    terreno_urbano?: { area_m2: number; price_per_m2?: number; condition?: 'good' | 'average' | 'poor' };
    terreno_agricola?: { area_m2: number; price_per_m2?: number; condition?: 'good' | 'average' | 'poor' };
    terreno_forestal?: { area_m2: number; price_per_m2?: number; condition?: 'good' | 'average' | 'poor' };
    terreno_pastizal?: { area_m2: number; price_per_m2?: number; condition?: 'good' | 'average' | 'poor' };
  };

  // condition
  condition?: 'new' | 'good' | 'average' | 'poor';
  condition_label?: string;
  condition_multiplier?: number;

  // building meta
  gebaeudetyp?: string;
  ausstattungsqualitaet?: string;
  zustand?: string;

  // occupancy / legal
  occupado_enabled?: boolean;
  occupado_deduction_pct?: number;
  nuda_propiedad_enabled?: boolean;
  usufructuary_age?: number;

  // VPO
  vpo_status?: 'no' | 'si' | 'dudosa' | 'descalificada';
  vpo_tipo?: string;
  vpo_regimen?: string;
  vpo_precio_maximo?: number;
  vpo_fecha_calificacion?: string;
  vpo_fecha_descalificacion?: string;
  vpo_limitaciones_transmision?: boolean;
  vpo_autorizacion_necesaria?: boolean;
  vpo_observaciones?: string;

  // admin overrides
  custom_adjustment_factor?: number;
  condition_factor?: number;

  [key: string]: unknown;
}

export interface MarketData {
  postal_code: string;
  country: string;
  avg_sqm_built: number;
  avg_sqm_land: number;
  agricultural_price_per_m2?: number;
  forest_price_per_m2?: number;
  pasture_price_per_m2?: number;
  source: string;
  source_label?: string | null;
  source_url?: string | null;
  reference_period?: string | null;
  confidence: 'high' | 'medium' | 'low';
  age_days?: number;
  municipality?: string | null;
  province?: string | null;
  notary_required?: boolean;
}

export interface ExplanationStep {
  label: string;
  formula?: string;
  inputs?: Record<string, number | string | null>;
  result?: number;
  unit?: string;
  note?: string;
}

export interface ExplanationBlock {
  title: string;
  steps: ExplanationStep[];
}

export interface MethodOutput {
  method: MethodId;
  ok: boolean;
  value: number;
  value_low: number;
  value_high: number;
  confidence: number;
  explanation: ExplanationBlock;
  missing_fields?: string[];
  warnings?: Warning[];
  weight?: number;
}

export interface AggregateResult {
  base: number;
  low: number;
  high: number;
  weights: Partial<Record<MethodId, number>>;
  methods: MethodOutput[];
  warnings: Warning[];
}

export interface ConfidenceBreakdownEntry {
  reason: string;
  delta: number;
  severity: WarningSeverity;
  code?: string;
}

export interface ConfidenceResult {
  score: number;
  class: ConfidenceClass;
  breakdown: ConfidenceBreakdownEntry[];
}

export interface VpoInput {
  status?: 'no' | 'si' | 'dudosa' | 'descalificada';
  tipo?: string;
  regimen?: string;
  precio_maximo?: number;
  fecha_calificacion?: string;
  fecha_descalificacion?: string;
  limitaciones_transmision?: boolean;
  autorizacion_necesaria?: boolean;
  observaciones?: string;
}

export interface VpoResult {
  active: boolean;
  status: 'no' | 'si' | 'dudosa' | 'descalificada';
  price_cap?: number;
  warnings: Warning[];
  legal_review_required: boolean;
  snapshot: VpoInput;
}

export type Assumptions = Record<string, number>;

export interface ValuationResultV2 {
  property_type: PropertyType;
  country: string;
  postal_code: string;
  range: { low: number; base: number; high: number };
  value_per_sqm?: number;
  confidence: ConfidenceResult;
  weights: Partial<Record<MethodId, number>>;
  methods: MethodOutput[];
  warnings: Warning[];
  vpo?: VpoResult;
  market_data: {
    source: string;
    source_label?: string | null;
    source_url?: string | null;
    reference_period?: string | null;
    age_days?: number;
    confidence: 'high' | 'medium' | 'low';
    municipality?: string | null;
    province?: string | null;
  };
  assumptions_snapshot: Assumptions;
  calculated_at: string;
}
