import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

export interface Property {
  id: string;
  title: string;
  address: string | null;
  city: string | null;
  price: number | null;
  size: number | null;
  rooms: number | null;
  type: string | null;
  status: string | null;
  description: string | null;
  image_url: string | null;
  images: string[] | null;
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
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (property: Partial<Property>) => {
      const { data, error } = await supabase
        .from('properties')
        .insert({ ...property, created_by: user?.id })
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
