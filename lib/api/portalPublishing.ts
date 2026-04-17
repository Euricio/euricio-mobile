import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

type PortalName = 'idealista' | 'fotocasa' | 'pisos' | 'kyero' | 'immoscout24' | 'immowelt' | 'kleinanzeigen' | 'rightmove' | 'zoopla' | 'onthemarket';

interface PortalConfig {
  portal: PortalName;
  status: string;
  auto_sync: boolean;
}

interface PropertyPortalStatus {
  id: string;
  property_id: string;
  portal: PortalName;
  is_published: boolean;
  published_at: string | null;
}

const PORTAL_GROUPS = [
  { label: { de: 'Spanien', en: 'Spain', es: 'España' }, portals: ['idealista', 'fotocasa', 'pisos', 'kyero'] as PortalName[] },
  { label: { de: 'Deutschland', en: 'Germany', es: 'Alemania' }, portals: ['immoscout24', 'immowelt', 'kleinanzeigen'] as PortalName[] },
  { label: { de: 'Großbritannien', en: 'United Kingdom', es: 'Reino Unido' }, portals: ['rightmove', 'zoopla', 'onthemarket'] as PortalName[] },
];

const PORTAL_META: Record<PortalName, { name: string; color: string }> = {
  idealista: { name: 'Idealista', color: '#1BC47D' },
  fotocasa: { name: 'Fotocasa', color: '#E4002B' },
  pisos: { name: 'Pisos.com', color: '#FF6B00' },
  kyero: { name: 'Kyero', color: '#0077B6' },
  immoscout24: { name: 'ImmoScout24', color: '#FF7500' },
  immowelt: { name: 'Immowelt', color: '#003399' },
  kleinanzeigen: { name: 'Kleinanzeigen', color: '#86B817' },
  rightmove: { name: 'Rightmove', color: '#00DEB6' },
  zoopla: { name: 'Zoopla', color: '#8046F1' },
  onthemarket: { name: 'OnTheMarket', color: '#1A1A2E' },
};

export { PORTAL_GROUPS, PORTAL_META };
export type { PortalName, PortalConfig, PropertyPortalStatus };

// Fetch which portals are configured for the current user
export function useConfiguredPortals() {
  const user = useAuthStore(s => s.user);
  return useQuery({
    queryKey: ['portal-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portal_configs')
        .select('portal, status, auto_sync')
        .eq('user_id', user!.id)
        .eq('status', 'configured');
      if (error) throw error;
      return (data ?? []) as PortalConfig[];
    },
    enabled: !!user,
  });
}

// Fetch portal publishing status for a specific property
export function usePropertyPortalStatus(propertyId: string | number) {
  const user = useAuthStore(s => s.user);
  return useQuery({
    queryKey: ['property-portal-status', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_portal_status')
        .select('*')
        .eq('property_id', propertyId)
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []) as PropertyPortalStatus[];
    },
    enabled: !!propertyId && !!user,
  });
}

// Toggle portal publishing for a property
export function useTogglePortalPublishing() {
  const queryClient = useQueryClient();
  const user = useAuthStore(s => s.user);

  return useMutation({
    mutationFn: async ({ propertyId, portal, publish }: { propertyId: string | number; portal: PortalName; publish: boolean }) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('property_portal_status')
        .upsert({
          property_id: propertyId,
          user_id: user!.id,
          portal,
          is_published: publish,
          published_at: publish ? now : null,
          updated_at: now,
        }, { onConflict: 'property_id,user_id,portal' });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-portal-status', variables.propertyId] });
    },
  });
}
