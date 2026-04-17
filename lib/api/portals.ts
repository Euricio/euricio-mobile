import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export type PortalName =
  | 'idealista'
  | 'fotocasa'
  | 'pisos'
  | 'kyero'
  | 'immoscout24'
  | 'immowelt'
  | 'kleinanzeigen'
  | 'rightmove'
  | 'zoopla'
  | 'onthemarket';

export interface PortalConfig {
  id: string;
  user_id: string;
  portal: PortalName;
  api_key: string;
  auto_sync: boolean;
  sync_frequency: string;
  status: string;
  last_sync_at: string | null;
  updated_at: string;
}

export interface SyncLogEntry {
  id: string;
  user_id: string;
  portal: string;
  status: 'success' | 'error' | 'warning';
  properties_synced: number;
  error_message: string | null;
  synced_at: string;
}

export function usePortalConfigs() {
  return useQuery({
    queryKey: ['portal-configs'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await supabase
        .from('portal_configs')
        .select('*')
        .eq('user_id', session.user.id);
      if (error) throw error;
      return (data ?? []) as PortalConfig[];
    },
  });
}

export function usePortalSyncLogs() {
  return useQuery({
    queryKey: ['portal-sync-logs'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await supabase
        .from('portal_sync_log')
        .select('*')
        .eq('user_id', session.user.id)
        .order('synced_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as SyncLogEntry[];
    },
  });
}

export function useSavePortalConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      portal,
      api_key,
      auto_sync,
      sync_frequency,
      status,
    }: {
      portal: PortalName;
      api_key: string;
      auto_sync: boolean;
      sync_frequency: string;
      status: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('portal_configs')
        .upsert(
          {
            user_id: session.user.id,
            portal,
            api_key,
            auto_sync,
            sync_frequency,
            status,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,portal' },
        )
        .select('*')
        .single();
      if (error) throw error;
      return data as PortalConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-configs'] });
    },
  });
}

export function useSyncPortal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (portal: PortalName) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const now = new Date().toISOString();

      const { count } = await supabase
        .from('property_portal_status')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('portal', portal)
        .eq('is_published', true);

      const { data: logEntry, error: logError } = await supabase
        .from('portal_sync_log')
        .insert({
          user_id: session.user.id,
          portal,
          status: 'success',
          properties_synced: count ?? 0,
          synced_at: now,
        })
        .select('*')
        .single();
      if (logError) throw logError;

      await supabase
        .from('portal_configs')
        .update({ last_sync_at: now, updated_at: now })
        .eq('user_id', session.user.id)
        .eq('portal', portal);

      return logEntry as SyncLogEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-configs'] });
      queryClient.invalidateQueries({ queryKey: ['portal-sync-logs'] });
    },
  });
}
