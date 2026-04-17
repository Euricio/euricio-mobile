import { supabase } from '../supabase';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

export function useProfile() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role, position, phone, is_internal, language')
        .eq('id', user!.id)
        .single();
      if (profileError) throw profileError;

      // Fetch subscription plan
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('owner_id', user!.id)
        .eq('status', 'active')
        .maybeSingle();

      return {
        ...profile,
        plan: subscription?.plan_id ?? null,
      };
    },
    enabled: !!user?.id,
  });
}
