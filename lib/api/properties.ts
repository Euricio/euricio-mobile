import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

export interface Property {
  id: string;
  title: string;
  property_type: string | null;
  property_subtype: string | null;
  offer_type: string | null;
  status: string | null;

  // Address
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;

  // Price & Area
  price: number | null;
  price_negotiable: boolean | null;
  size_m2: number | null;
  plot_size_m2: number | null;
  built_size_m2: number | null;
  useful_size_m2: number | null;
  rooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;

  // Type & Condition
  orientation: string | null;
  condition: string | null;

  // Features
  has_elevator: boolean | null;
  has_parking: boolean | null;
  parking_spaces: number | null;
  has_pool: boolean | null;
  has_garden: boolean | null;
  garden_m2: number | null;
  is_furnished: boolean | null;
  has_garage: boolean | null;
  garage_spaces: number | null;
  has_terrace: boolean | null;
  terrace_m2: number | null;
  has_ac: boolean | null;
  has_heating: boolean | null;
  heating_type: string | null;
  has_storage: boolean | null;
  has_sea_view: boolean | null;
  has_balcony: boolean | null;
  balcony_m2: number | null;

  // Legal & Costs
  referencia_catastral: string | null;
  ibi_annual: number | null;
  community_fees_monthly: number | null;
  has_mortgage: boolean | null;
  mortgage_outstanding: number | null;
  legal_status: string | null;
  nota_simple_date: string | null;
  energy_certificate: string | null;

  // Rental
  rental_price: number | null;
  rental_period: string | null;
  available_from: string | null;
  is_rented: boolean | null;
  rental_yield: number | null;

  // Description
  description: string | null;
  notes: string | null;

  // Owner
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;

  // Land breakdown
  land_classification: string | null;
  land_buildable_m2: number | null;
  terreno_urbano_m2: number | null;
  terreno_agricola_m2: number | null;
  terreno_forestal_m2: number | null;
  terreno_pastizal_m2: number | null;

  // Estimated value
  estimated_value: number | null;
  estimated_value_date: string | null;
  estimated_value_method: string | null;

  // Operation & Lead
  operation_type: string | null;
  lead_id: string | null;

  // Meta
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export function useProperties(search?: string) {
  return useQuery({
    queryKey: ['properties', search],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (search && search.length >= 2) {
        query = query.or(
          `title.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Property[];
    },
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Property;
    },
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (property: Partial<Property>) => {
      const { data, error } = await supabase
        .from('properties')
        .insert(property)
        .select()
        .single();
      if (error) throw error;
      return data as Property;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Property> & { id: string }) => {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Property;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property', data.id] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

// ─── Property Listings (publish/unpublish) ──────────────────────────

export interface PropertyListing {
  id: string;
  property_id: string;
  is_published: boolean;
  published_at: string | null;
  unpublished_at: string | null;
  created_at: string;
  updated_at: string;
}

export function usePropertyListing(propertyId: string) {
  return useQuery({
    queryKey: ['property-listing', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_listings')
        .select('*')
        .eq('property_id', propertyId)
        .maybeSingle();
      if (error) throw error;
      return data as PropertyListing | null;
    },
    enabled: !!propertyId,
  });
}

export function useTogglePublish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      propertyId,
      isPublished,
    }: {
      propertyId: string;
      isPublished: boolean;
    }) => {
      // Check if listing row exists
      const { data: existing } = await supabase
        .from('property_listings')
        .select('id')
        .eq('property_id', propertyId)
        .maybeSingle();

      if (existing) {
        const updates: Record<string, any> = { is_published: isPublished };
        if (isPublished) {
          updates.published_at = new Date().toISOString();
          updates.unpublished_at = null;
        } else {
          updates.unpublished_at = new Date().toISOString();
        }
        const { data, error } = await supabase
          .from('property_listings')
          .update(updates)
          .eq('property_id', propertyId)
          .select()
          .single();
        if (error) throw error;
        return data as PropertyListing;
      } else {
        const { data, error } = await supabase
          .from('property_listings')
          .insert({
            property_id: propertyId,
            is_published: isPublished,
            published_at: isPublished ? new Date().toISOString() : null,
          })
          .select()
          .single();
        if (error) throw error;
        return data as PropertyListing;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['property-listing', variables.propertyId],
      });
    },
  });
}

// ─── Property Owners ────────────────────────────────────────────────

export interface PropertyOwner {
  id: string;
  property_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  percentage: number | null;
  status: 'won' | 'pending' | 'against';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function usePropertyOwners(propertyId: string) {
  return useQuery({
    queryKey: ['property-owners', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_owners')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at');
      if (error) throw error;
      return (data ?? []) as PropertyOwner[];
    },
    enabled: !!propertyId,
  });
}

export function useCreatePropertyOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (owner: Partial<PropertyOwner> & { property_id: string; name: string }) => {
      const { data, error } = await supabase
        .from('property_owners')
        .insert(owner)
        .select()
        .single();
      if (error) throw error;
      return data as PropertyOwner;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['property-owners', variables.property_id],
      });
    },
  });
}

export function useUpdatePropertyOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      property_id,
      ...updates
    }: Partial<PropertyOwner> & { id: string; property_id: string }) => {
      const { data, error } = await supabase
        .from('property_owners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PropertyOwner;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['property-owners', variables.property_id],
      });
    },
  });
}

export function useDeletePropertyOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      propertyId,
    }: {
      id: string;
      propertyId: string;
    }) => {
      const { error } = await supabase
        .from('property_owners')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['property-owners', variables.propertyId],
      });
    },
  });
}
