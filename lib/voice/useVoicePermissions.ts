import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAuthStore } from '../../store/authStore';

interface VoicePermission {
  hasPermission: boolean;
  isConnected: boolean;
}

async function checkVoicePermission(userId: string): Promise<VoicePermission> {
  // 1. Check user has voice permission
  const { data: perm } = await supabase
    .from('voice_user_permissions')
    .select('id, user_id')
    .eq('user_id', userId)
    .eq('enabled', true)
    .maybeSingle();

  if (!perm) return { hasPermission: false, isConnected: false };

  // 2. Get user's profile to find manager/team
  const { data: profile } = await supabase
    .from('profiles')
    .select('manager_id, role')
    .eq('id', userId)
    .maybeSingle();

  const ownerId =
    profile?.role === 'employee_agent' && profile.manager_id
      ? profile.manager_id
      : userId;

  // 3. Check voice connection exists for the team
  const { data: conn } = await supabase
    .from('voice_connections')
    .select('id')
    .eq('user_id', ownerId)
    .maybeSingle();

  return { hasPermission: true, isConnected: !!conn };
}

export function useVoicePermissions() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  return useQuery<VoicePermission>({
    queryKey: ['voice-permissions', userId],
    queryFn: () => checkVoicePermission(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
