import { supabase } from '../supabase';
import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
  openTasks: number;
  newLeadsToday: number;
  missedCalls: number;
}

interface Activity {
  id: string;
  task_type: string;
  title: string;
  description: string | null;
  created_at: string;
  lead_name: string | null;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [tasksRes, leadsRes, callsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .in('status', ['open', 'in_progress']),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', todayISO),
        supabase
          .from('call_logs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'missed')
          .gte('created_at', todayISO),
      ]);

      return {
        openTasks: tasksRes.count ?? 0,
        newLeadsToday: leadsRes.count ?? 0,
        missedCalls: callsRes.count ?? 0,
      };
    },
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async (): Promise<Activity[]> => {
      // Fetch recent tasks as activities
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, task_type, title, created_at, lead:leads(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!tasks) return [];

      return tasks.map((t: Record<string, unknown>) => ({
        id: t.id as string,
        task_type: t.task_type as string,
        title: t.title as string,
        description: null,
        created_at: t.created_at as string,
        lead_name: (t.lead as Record<string, unknown> | null)?.full_name as string | null,
      }));
    },
  });
}
