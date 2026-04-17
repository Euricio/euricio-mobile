import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAuthStore } from '../../store/authStore';

export interface Subscription {
  id: string;
  owner_id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  billing_cycle: string;
  renewal_date: string | null;
  features: string[];
  limits: Record<string, number>;
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
}

export function useSubscription() {
  const user = useAuthStore.getState().user;
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('owner_id', user!.id)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const plan = (data as Record<string, unknown>).subscription_plans as Record<string, unknown> | null;
      return {
        id: data.id,
        owner_id: data.owner_id,
        plan_id: data.plan_id,
        plan_name: plan?.name ?? data.plan_id,
        status: data.status,
        billing_cycle: plan?.billing_cycle ?? 'monthly',
        renewal_date: data.renewal_date ?? null,
        features: (plan?.features as string[]) ?? [],
        limits: (plan?.limits as Record<string, number>) ?? {},
      } as Subscription;
    },
    enabled: !!user?.id,
  });
}

export function useAddons() {
  return useQuery({
    queryKey: ['addons'],
    queryFn: async () => {
      const { data: available, error: availError } = await supabase
        .from('available_addons')
        .select('*')
        .order('name', { ascending: true });
      if (availError) throw availError;

      const { data: userAddons, error: userError } = await supabase
        .from('user_addons')
        .select('addon_id');
      if (userError) throw userError;

      const activeIds = new Set((userAddons ?? []).map((a: { addon_id: string }) => a.addon_id));

      return (available ?? []).map((addon: Record<string, unknown>) => ({
        id: addon.id as string,
        name: addon.name as string,
        description: (addon.description as string) ?? '',
        price: (addon.price as number) ?? 0,
        is_active: activeIds.has(addon.id as string),
      })) as Addon[];
    },
  });
}

export function useToggleAddon() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async ({ addon_id, activate }: { addon_id: string; activate: boolean }) => {
      if (activate) {
        const { error } = await supabase
          .from('user_addons')
          .insert({ addon_id, user_id: user?.id });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_addons')
          .delete()
          .eq('addon_id', addon_id)
          .eq('user_id', user?.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addons'] });
    },
  });
}
