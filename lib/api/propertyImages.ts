import { supabase } from '../supabase';
import { useQuery } from '@tanstack/react-query';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is not set');
}
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/property-images`;

export interface PropertyImage {
  id: string;
  storage_path: string;
  is_cover: boolean;
  sort_order: number;
  url: string;
}

export function usePropertyImages(propertyId: string | number) {
  return useQuery({
    queryKey: ['property-images', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_images')
        .select('id, storage_path, is_cover, sort_order')
        .eq('property_id', propertyId)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []).map((img) => ({
        ...img,
        url: `${STORAGE_BASE}/${img.storage_path}`,
      })) as PropertyImage[];
    },
    enabled: !!propertyId,
  });
}

export function getCoverImage(images: PropertyImage[]): PropertyImage | undefined {
  return images.find((img) => img.is_cover) || images[0];
}
