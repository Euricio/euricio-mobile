import { supabase } from '../supabase';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

export function useProfile() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, role, position, phone, plan, is_internal')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}
