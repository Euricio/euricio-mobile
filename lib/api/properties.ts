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

  // Land breakdown
  land_classification: string | null;
  land_buildable_m2: number | null;

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
