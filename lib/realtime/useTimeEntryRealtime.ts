import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to real-time changes on `time_entries` for a given user.
 * When the web CRM (or any other client) inserts / updates / deletes
 * a row, the relevant React-Query caches are invalidated so the UI
 * refreshes instantly — no polling delay.
 */
export function useTimeEntryRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Tear down any previous channel (e.g. on userId change)
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`time-entries-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'time_entries',
          filter: `user_id=eq.${userId}`,
        },
        (_payload) => {
          // Invalidate every query that touches time entries
          queryClient.invalidateQueries({ queryKey: ['my-active-time-entry'] });
          queryClient.invalidateQueries({ queryKey: ['my-time-entries-today'] });
          queryClient.invalidateQueries({ queryKey: ['time-entries-for-date'] });
          queryClient.invalidateQueries({ queryKey: ['time-entries-for-week'] });
          queryClient.invalidateQueries({ queryKey: ['day-summary'] });
          queryClient.invalidateQueries({ queryKey: ['team-availability'] });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, queryClient]);
}
