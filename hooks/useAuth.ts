import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/api/client';

/**
 * Hook für Auth-Status und Session-Management.
 */
export function useAuth() {
  const { user, session, isLoading, signIn, signOut } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        useAuthStore.getState().setSession(session);
        useAuthStore.getState().setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
  };
}
