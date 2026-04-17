import { supabase } from '../supabase';
import { useQuery } from '@tanstack/react-query';

export interface TimecheckShift {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number | null;
  status: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  break_minutes: number | null;
  category_id: string | null;
  category?: { id: string; name: string; color: string } | null;
}

export interface TimecheckMember {
  id: string;
  full_name: string;
  role: string;
  position: string | null;
}

export interface TimeCategory {
  id: string;
  name: string;
  color: string;
}

export function useTimecheckData(date: string) {
  return useQuery({
    queryKey: ['timecheck', date],
    queryFn: async () => {
      const [membersRes, shiftsRes, entriesRes, categoriesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, role, position')
          .eq('is_internal', true)
          .order('full_name', { ascending: true }),
        supabase
          .from('shifts')
          .select('id, user_id, date, start_time, end_time, break_minutes, status')
          .eq('date', date),
        supabase
          .from('time_entries')
          .select('id, user_id, started_at, ended_at, duration_minutes, notes, break_minutes, category_id')
          .gte('started_at', `${date}T00:00:00`)
          .lt('started_at', `${date}T23:59:59.999`),
        supabase
          .from('time_categories')
          .select('id, name, color')
          .eq('active', true),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (shiftsRes.error) throw shiftsRes.error;
      if (entriesRes.error) throw entriesRes.error;

      const members = (membersRes.data ?? []) as TimecheckMember[];
      const shifts = (shiftsRes.data ?? []) as TimecheckShift[];
      const entries = (entriesRes.data ?? []) as TimeEntry[];
      const categories = (categoriesRes.data ?? []) as TimeCategory[];

      const categoryMap = new Map(categories.map((c) => [c.id, c]));
      const entriesWithCategory = entries.map((e) => ({
        ...e,
        category: e.category_id ? categoryMap.get(e.category_id) ?? null : null,
      }));

      return { members, shifts, entries: entriesWithCategory, categories };
    },
    enabled: !!date,
  });
}
