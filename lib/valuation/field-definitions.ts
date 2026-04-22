// SOURCE OF TRUTH — web copy at Euricio.es/lib/valuation/field-definitions.ts MUST stay in sync
// Pure data — copy verbatim.

export type FieldType = 'number' | 'text' | 'enum' | 'boolean' | 'date' | 'categories';

export interface FieldDefinition {
  id: string;
  type: FieldType;
  label_es: string;
  label_de?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: string; label_es: string; label_de?: string }>;
  help_es?: string;
  help_de?: string;
  required_for_types?: string[];
}

export const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  // --- common / residential ---
  living_area_sqm: {
    id: 'living_area_sqm',
    type: 'number',
    label_es: 'Superficie habitable',
    label_de: 'Wohnfläche',
    unit: 'm²',
    min: 1,
    max: 5000,
  },
  built_area_sqm: {
    id: 'built_area_sqm',
    type: 'number',
    label_es: 'Superficie construida',
    label_de: 'Bruttogrundfläche',
    unit: 'm²',
    min: 1,
    max: 50000,
  },
  land_area_sqm: {
    id: 'land_area_sqm',
    type: 'number',
    label_es: 'Superficie de terreno',
    label_de: 'Grundstücksfläche',
    unit: 'm²',
    min: 0,
    max: 10000000,
  },
  construction_year: {
    id: 'construction_year',
    type: 'number',
    label_es: 'Año de construcción',
    label_de: 'Baujahr',
    min: 1800,
    max: 2030,
  },
  bedrooms: {
    id: 'bedrooms',
    type: 'number',
    label_es: 'Dormitorios',
    label_de: 'Schlafzimmer',
    min: 0,
    max: 20,
    step: 1,
  },
  bathrooms: {
    id: 'bathrooms',
    type: 'number',
    label_es: 'Baños',
    label_de: 'Bäder',
    min: 1,
    max: 10,
    step: 1,
  },
  terrace_m2: {
    id: 'terrace_m2',
    type: 'number',
    label_es: 'Terraza',
    unit: 'm²',
    min: 0,
    max: 500,
  },
  garage_spaces: {
    id: 'garage_spaces',
    type: 'number',
    label_es: 'Plazas de garaje',
    min: 0,
    max: 20,
    step: 1,
  },
  has_pool: { id: 'has_pool', type: 'boolean', label_es: 'Piscina' },
  has_sea_view: { id: 'has_sea_view', type: 'boolean', label_es: 'Vista al mar' },
  has_elevator: { id: 'has_elevator', type: 'boolean', label_es: 'Ascensor' },
  furnished: { id: 'furnished', type: 'boolean', label_es: 'Amueblado' },
  condition: {
    id: 'condition',
    type: 'enum',
    label_es: 'Estado',
    options: [
      { value: 'new', label_es: 'Nuevo / recién reformado' },
      { value: 'good', label_es: 'Buen estado' },
      { value: 'average', label_es: 'Regular' },
      { value: 'poor', label_es: 'A reformar' },
    ],
  },

  // --- commercial / office ---
  usable_area_sqm: {
    id: 'usable_area_sqm',
    type: 'number',
    label_es: 'Superficie útil',
    label_de: 'Nutzfläche',
    unit: 'm²',
    min: 1,
    max: 100000,
  },
  ceiling_height_m: {
    id: 'ceiling_height_m',
    type: 'number',
    label_es: 'Altura libre',
    unit: 'm',
    min: 1,
    max: 30,
  },
  office_share: {
    id: 'office_share',
    type: 'number',
    label_es: 'Cuota oficina',
    unit: '%',
    min: 0,
    max: 100,
    help_es: 'Porcentaje de la superficie destinado a oficinas',
  },
  loading_docks: {
    id: 'loading_docks',
    type: 'number',
    label_es: 'Muelles de carga',
    min: 0,
    max: 50,
    step: 1,
  },

  // --- hotel ---
  keys: { id: 'keys', type: 'number', label_es: 'Habitaciones / llaves', min: 1, max: 2000 },
  stars: { id: 'stars', type: 'number', label_es: 'Categoría (estrellas)', min: 1, max: 5, step: 1 },

  // --- income ---
  is_rented: { id: 'is_rented', type: 'boolean', label_es: '¿Actualmente alquilado?' },
  monthly_rent: { id: 'monthly_rent', type: 'number', label_es: 'Alquiler mensual', unit: '€', min: 0, max: 1000000 },
  estimated_monthly_rent: {
    id: 'estimated_monthly_rent',
    type: 'number',
    label_es: 'Alquiler estimado',
    unit: '€',
    min: 0,
    max: 1000000,
  },
  annual_operating_costs: {
    id: 'annual_operating_costs',
    type: 'number',
    label_es: 'Gastos anuales',
    unit: '€',
    min: 0,
    max: 10000000,
  },
  vacancy_ratio: {
    id: 'vacancy_ratio',
    type: 'number',
    label_es: 'Vacancia esperada',
    unit: '%',
    min: 0,
    max: 100,
  },
  contract_term_years: {
    id: 'contract_term_years',
    type: 'number',
    label_es: 'Plazo contrato',
    unit: 'años',
    min: 0,
    max: 50,
  },

  // --- land ---
  edificabilidad: {
    id: 'edificabilidad',
    type: 'number',
    label_es: 'Edificabilidad (m² techo / m² suelo)',
    min: 0,
    max: 20,
    step: 0.01,
  },
  max_built_area_sqm: {
    id: 'max_built_area_sqm',
    type: 'number',
    label_es: 'Techo máximo construible',
    unit: 'm²',
    min: 0,
    max: 1000000,
  },
  urban_classification: {
    id: 'urban_classification',
    type: 'enum',
    label_es: 'Clasificación urbanística',
    options: [
      { value: 'urbano_consolidado', label_es: 'Urbano consolidado' },
      { value: 'urbano_no_consolidado', label_es: 'Urbano no consolidado' },
      { value: 'urbanizable', label_es: 'Urbanizable' },
      { value: 'no_urbanizable', label_es: 'No urbanizable' },
    ],
  },
  suelo_rustico_categories: {
    id: 'suelo_rustico_categories',
    type: 'categories',
    label_es: 'Categorías rústicas',
  },
  access_quality: {
    id: 'access_quality',
    type: 'enum',
    label_es: 'Calidad del acceso',
    options: [
      { value: 'good', label_es: 'Bueno (pavimentado)' },
      { value: 'fair', label_es: 'Regular (pista)' },
      { value: 'none', label_es: 'Sin acceso rodado' },
    ],
  },
  has_water: { id: 'has_water', type: 'boolean', label_es: 'Agua disponible' },

  // --- building meta ---
  gebaeudetyp: {
    id: 'gebaeudetyp',
    type: 'enum',
    label_es: 'Tipo de edificio',
    options: [
      { value: 'Einfamilienhaus', label_es: 'Vivienda unifamiliar' },
      { value: 'Doppelhaushaelfte', label_es: 'Semi-adosada' },
      { value: 'Reihenhaus', label_es: 'Adosada' },
      { value: 'Mehrfamilienhaus', label_es: 'Plurifamiliar' },
      { value: 'Wohnung/Apartment', label_es: 'Apartamento' },
      { value: 'Villa', label_es: 'Villa' },
      { value: 'Finca/Landhaus', label_es: 'Finca' },
    ],
  },
  ausstattungsqualitaet: {
    id: 'ausstattungsqualitaet',
    type: 'enum',
    label_es: 'Calidad constructiva',
    options: [
      { value: 'einfach', label_es: 'Básica' },
      { value: 'mittel', label_es: 'Media' },
      { value: 'gehoben', label_es: 'Alta' },
      { value: 'luxurioes', label_es: 'Lujo' },
    ],
  },
  zustand: {
    id: 'zustand',
    type: 'enum',
    label_es: 'Estado de conservación',
    options: [
      { value: 'sanierungsbeduerftig', label_es: 'A reformar' },
      { value: 'normal', label_es: 'Normal' },
      { value: 'renoviert', label_es: 'Reformado' },
      { value: 'neuwertig', label_es: 'Como nuevo' },
    ],
  },

  // --- legal ---
  occupado_enabled: { id: 'occupado_enabled', type: 'boolean', label_es: 'Ocupado' },
  nuda_propiedad_enabled: { id: 'nuda_propiedad_enabled', type: 'boolean', label_es: 'Nuda propiedad' },

  // --- VPO ---
  vpo_status: {
    id: 'vpo_status',
    type: 'enum',
    label_es: 'VPO',
    options: [
      { value: 'no', label_es: 'No es VPO' },
      { value: 'si', label_es: 'Sí, vigente' },
      { value: 'dudosa', label_es: 'Dudosa' },
      { value: 'descalificada', label_es: 'Descalificada' },
    ],
  },
  vpo_precio_maximo: {
    id: 'vpo_precio_maximo',
    type: 'number',
    label_es: 'Precio máximo VPO',
    unit: '€/m²',
    min: 0,
    max: 10000,
  },
};

export function getField(id: string): FieldDefinition | undefined {
  return FIELD_DEFINITIONS[id];
}
