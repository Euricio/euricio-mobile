// SOURCE OF TRUTH — web copy at Euricio.es/lib/valuation/property-types.ts MUST stay in sync
// Mobile version: trigger functions and confidence_rules stripped — the
// backend engine owns runtime evaluation. UI only needs profile shape.

import type { MethodWeight, PropertyType, ValuationProfile } from './types';

function baseProfile(
  type: PropertyType,
  overrides: Partial<ValuationProfile>,
  labels: { es: string; de: string; en: string },
  icon: string,
): ValuationProfile {
  return {
    type,
    labels,
    icon,
    field_groups: [],
    methods: [],
    required_fields: [],
    allows_vpo: false,
    ...overrides,
    confidence_rules: [],
  };
}

export const PROPERTY_PROFILES: Record<PropertyType, ValuationProfile> = {
  piso: baseProfile(
    'piso',
    {
      field_groups: [
        { id: 'basic', label_es: 'Datos básicos', fields: ['living_area_sqm', 'bedrooms', 'bathrooms', 'construction_year'] },
        { id: 'features', label_es: 'Características', fields: ['terrace_m2', 'garage_spaces', 'has_pool', 'has_sea_view', 'has_elevator', 'furnished'] },
        { id: 'condition', label_es: 'Estado', fields: ['condition'] },
        { id: 'rent', label_es: 'Alquiler (opcional)', fields: ['is_rented', 'monthly_rent', 'estimated_monthly_rent'], collapsed: true },
        { id: 'legal', label_es: 'Situación legal', fields: ['occupado_enabled', 'nuda_propiedad_enabled', 'vpo_status'], collapsed: true },
      ],
      methods: [
        { method: 'comparativo', weight: 1.0, role: 'primary' },
        { method: 'sustancial', weight: 0.3, role: 'secondary' },
        { method: 'rendimiento', weight: 0.5, role: 'tertiary' },
      ],
      required_fields: ['living_area_sqm'],
      allows_vpo: true,
      bounds: { min_sqm_price: 300, max_sqm_price: 15000 },
    },
    { es: 'Piso / Apartamento', de: 'Wohnung', en: 'Apartment' },
    'apartment',
  ),

  casa: baseProfile(
    'casa',
    {
      field_groups: [
        { id: 'basic', label_es: 'Datos básicos', fields: ['living_area_sqm', 'built_area_sqm', 'land_area_sqm', 'bedrooms', 'bathrooms', 'construction_year'] },
        { id: 'features', label_es: 'Características', fields: ['terrace_m2', 'garage_spaces', 'has_pool', 'has_sea_view', 'furnished'] },
        { id: 'building', label_es: 'Tipo y calidad', fields: ['gebaeudetyp', 'ausstattungsqualitaet', 'zustand'] },
        { id: 'rent', label_es: 'Alquiler (opcional)', fields: ['is_rented', 'monthly_rent', 'estimated_monthly_rent'], collapsed: true },
        { id: 'legal', label_es: 'Situación legal', fields: ['vpo_status'], collapsed: true },
      ],
      methods: [
        { method: 'comparativo', weight: 1.0, role: 'primary' },
        { method: 'sustancial', weight: 0.3, role: 'secondary' },
        { method: 'rendimiento', weight: 0.4, role: 'tertiary' },
      ],
      required_fields: ['living_area_sqm'],
      allows_vpo: true,
      bounds: { min_sqm_price: 300, max_sqm_price: 15000 },
    },
    { es: 'Casa / Chalet / Villa', de: 'Haus / Villa', en: 'House / Villa' },
    'house',
  ),

  local_comercial: baseProfile(
    'local_comercial',
    {
      field_groups: [
        { id: 'basic', label_es: 'Datos básicos', fields: ['usable_area_sqm', 'built_area_sqm', 'construction_year'] },
        { id: 'features', label_es: 'Características', fields: ['ceiling_height_m'] },
        { id: 'condition', label_es: 'Estado', fields: ['condition'] },
        { id: 'rent', label_es: 'Alquiler', fields: ['is_rented', 'monthly_rent', 'estimated_monthly_rent', 'annual_operating_costs', 'contract_term_years'] },
      ],
      methods: [
        { method: 'comparativo', weight: 0.5, role: 'primary' },
        { method: 'rendimiento', weight: 0.5, role: 'primary' },
        { method: 'sustancial', weight: 0.2, role: 'secondary' },
      ],
      required_fields: ['usable_area_sqm'],
      bounds: { min_sqm_price: 200, max_sqm_price: 12000 },
    },
    { es: 'Local comercial', de: 'Ladenlokal', en: 'Commercial unit' },
    'storefront',
  ),

  oficina: baseProfile(
    'oficina',
    {
      field_groups: [
        { id: 'basic', label_es: 'Datos básicos', fields: ['usable_area_sqm', 'construction_year'] },
        { id: 'features', label_es: 'Características', fields: ['has_elevator', 'garage_spaces'] },
        { id: 'condition', label_es: 'Estado', fields: ['condition'] },
        { id: 'rent', label_es: 'Alquiler', fields: ['is_rented', 'monthly_rent', 'estimated_monthly_rent', 'annual_operating_costs', 'contract_term_years'] },
      ],
      methods: [
        { method: 'comparativo', weight: 0.5, role: 'primary' },
        { method: 'rendimiento', weight: 0.5, role: 'primary' },
        { method: 'sustancial', weight: 0.2, role: 'secondary' },
      ],
      required_fields: ['usable_area_sqm'],
      bounds: { min_sqm_price: 300, max_sqm_price: 10000 },
    },
    { es: 'Oficina', de: 'Büro', en: 'Office' },
    'office',
  ),

  nave_industrial: baseProfile(
    'nave_industrial',
    {
      field_groups: [
        { id: 'basic', label_es: 'Datos básicos', fields: ['built_area_sqm', 'land_area_sqm', 'construction_year'] },
        { id: 'features', label_es: 'Características', fields: ['loading_docks', 'ceiling_height_m', 'office_share'] },
        { id: 'condition', label_es: 'Estado', fields: ['condition'] },
        { id: 'rent', label_es: 'Alquiler', fields: ['monthly_rent', 'estimated_monthly_rent', 'annual_operating_costs'] },
      ],
      methods: [
        { method: 'rendimiento', weight: 0.6, role: 'primary' },
        { method: 'sustancial', weight: 0.4, role: 'secondary' },
        { method: 'comparativo', weight: 0.3, role: 'tertiary' },
      ],
      required_fields: ['built_area_sqm'],
      bounds: { min_sqm_price: 150, max_sqm_price: 3000 },
    },
    { es: 'Nave industrial', de: 'Halle / Logistik', en: 'Industrial warehouse' },
    'warehouse',
  ),

  suelo_urbano: baseProfile(
    'suelo_urbano',
    {
      field_groups: [
        { id: 'basic', label_es: 'Datos básicos', fields: ['land_area_sqm', 'edificabilidad', 'max_built_area_sqm', 'urban_classification'] },
      ],
      methods: [
        { method: 'residual_urbano', weight: 0.6, role: 'primary' },
        { method: 'comparativo_suelo', weight: 0.4, role: 'secondary' },
      ],
      required_fields: ['land_area_sqm'],
      bounds: { min_sqm_price: 20, max_sqm_price: 3000 },
    },
    { es: 'Suelo urbano', de: 'Bauland', en: 'Urban plot' },
    'land-urban',
  ),

  suelo_rustico: baseProfile(
    'suelo_rustico',
    {
      field_groups: [
        { id: 'basic', label_es: 'Superficies', fields: ['suelo_rustico_categories'] },
        { id: 'access', label_es: 'Acceso y servicios', fields: ['access_quality', 'has_water'] },
      ],
      methods: [{ method: 'rustico', weight: 1.0, role: 'primary' }],
      required_fields: [],
      bounds: { min_sqm_price: 0.1, max_sqm_price: 200 },
    },
    { es: 'Suelo rústico', de: 'Agrar-/Forstland', en: 'Rural plot' },
    'land-rural',
  ),

  edificio_residencial: baseProfile(
    'edificio_residencial',
    {
      field_groups: [
        { id: 'basic', label_es: 'Datos básicos', fields: ['built_area_sqm', 'living_area_sqm', 'construction_year'] },
        { id: 'income', label_es: 'Rentabilidad', fields: ['monthly_rent', 'estimated_monthly_rent', 'annual_operating_costs', 'vacancy_ratio'] },
        { id: 'legal', label_es: 'Situación legal', fields: ['vpo_status'], collapsed: true },
      ],
      methods: [
        { method: 'rendimiento', weight: 0.7, role: 'primary' },
        { method: 'comparativo', weight: 0.3, role: 'secondary' },
      ],
      required_fields: ['built_area_sqm'],
      allows_vpo: true,
      bounds: { min_sqm_price: 300, max_sqm_price: 12000 },
    },
    { es: 'Edificio residencial (MFH)', de: 'Wohngebäude / MFH', en: 'Residential building' },
    'building-residential',
  ),

  hotel: baseProfile(
    'hotel',
    {
      field_groups: [
        { id: 'basic', label_es: 'Datos básicos', fields: ['built_area_sqm', 'keys', 'stars', 'construction_year'] },
        { id: 'income', label_es: 'Rentabilidad', fields: ['monthly_rent', 'annual_operating_costs', 'vacancy_ratio'] },
      ],
      methods: [
        { method: 'rendimiento', weight: 0.8, role: 'primary' },
        { method: 'sustancial', weight: 0.2, role: 'secondary' },
      ],
      required_fields: ['built_area_sqm'],
      bounds: { min_sqm_price: 500, max_sqm_price: 20000 },
    },
    { es: 'Hotel / Alojamiento', de: 'Hotel / Beherbergung', en: 'Hotel' },
    'hotel',
  ),

  garaje_trastero: baseProfile(
    'garaje_trastero',
    {
      field_groups: [
        { id: 'basic', label_es: 'Datos básicos', fields: ['usable_area_sqm', 'construction_year'] },
      ],
      methods: [{ method: 'comparativo', weight: 1.0, role: 'primary' }],
      required_fields: ['usable_area_sqm'],
      bounds: { min_sqm_price: 100, max_sqm_price: 3500 },
    },
    { es: 'Garaje / Trastero', de: 'Garage / Abstellraum', en: 'Garage / Storage' },
    'garage',
  ),

  inmueble_mixto: baseProfile(
    'inmueble_mixto',
    {
      field_groups: [
        { id: 'basic', label_es: 'Datos básicos', fields: ['built_area_sqm', 'living_area_sqm', 'usable_area_sqm', 'construction_year'] },
        { id: 'income', label_es: 'Rentabilidad', fields: ['monthly_rent', 'annual_operating_costs', 'vacancy_ratio'] },
      ],
      methods: [
        { method: 'rendimiento', weight: 0.6, role: 'primary' },
        { method: 'comparativo', weight: 0.3, role: 'secondary' },
        { method: 'sustancial', weight: 0.1, role: 'tertiary' },
      ],
      required_fields: ['built_area_sqm'],
      bounds: { min_sqm_price: 200, max_sqm_price: 12000 },
    },
    { es: 'Inmueble mixto', de: 'Mixed-Use', en: 'Mixed-use property' },
    'building-mixed',
  ),

  especial: baseProfile(
    'especial',
    {
      field_groups: [
        { id: 'basic', label_es: 'Datos básicos', fields: ['built_area_sqm', 'land_area_sqm', 'construction_year'] },
        { id: 'notes', label_es: 'Observaciones', fields: ['condition', 'condition_label'] },
      ],
      methods: [
        { method: 'sustancial', weight: 0.6, role: 'primary' },
        { method: 'comparativo', weight: 0.4, role: 'secondary' },
      ],
      required_fields: [],
    },
    { es: 'Especial / Otro', de: 'Spezial / Sonstige', en: 'Special / Other' },
    'question',
  ),
};

export function getProfile(type: PropertyType): ValuationProfile {
  const p = PROPERTY_PROFILES[type];
  if (!p) throw new Error(`Unknown property_type: ${type}`);
  return p;
}

export const ALL_PROPERTY_TYPES: PropertyType[] = Object.keys(PROPERTY_PROFILES) as PropertyType[];

export function resolveEffectiveMethods(profile: ValuationProfile): MethodWeight[] {
  // Mobile does not evaluate triggers — it shows all declared methods with
  // their base weights. The backend performs the actual filtering.
  return profile.methods.filter((m) => m.weight > 0);
}
