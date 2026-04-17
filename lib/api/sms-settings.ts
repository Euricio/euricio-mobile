import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';

export interface SmsConfig {
  id: string;
  tenant_id: string;
  account_sid: string;
  auth_token: string;
  phone_number: string;
}

export interface NotificationSetting {
  id: string;
  tenant_id: string;
  event_type: string;
  enabled: boolean;
}

export function useSmsConfig() {
  return useQuery({
    queryKey: ['sms-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_configurations')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SmsConfig | null;
    },
  });
}

export function useUpdateSmsConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: Partial<SmsConfig>) => {
      const { data: existing } = await supabase
        .from('sms_configurations')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('sms_configurations')
          .update(config)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as SmsConfig;
      } else {
        const { data, error } = await supabase
          .from('sms_configurations')
          .insert(config)
          .select()
          .single();
        if (error) throw error;
        return data as SmsConfig;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-config'] });
    },
  });
}

export function useSmsNotificationSettings() {
  return useQuery({
    queryKey: ['sms-notification-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .order('event_type', { ascending: true });
      if (error) throw error;
      return (data ?? []) as NotificationSetting[];
    },
  });
}

export function useUpdateNotificationSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('notification_settings')
        .update({ enabled })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as NotificationSetting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-notification-settings'] });
    },
  });
}
