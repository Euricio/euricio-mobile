import { supabase } from '../supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  manager_id: string | null;
}

export interface TimeEntry {
  id: number;
  user_id: string;
  date: string;
  started_at: string | null;
  ended_at: string | null;
  status: string;
  duration_minutes: number | null;
  note: string | null;
  activity: string | null;
  category_id: string | null;
  short_break_minutes: number;
  lunch_break_minutes: number;
  total_hours: number | null;
}

export interface Shift {
  id: number;
  employee_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  break_short_min: number;
  break_lunch_min: number;
  location: string | null;
  notes: string | null;
  status: string;
}

export interface ScheduledShift {
  id: string;
  employee_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  note: string | null;
}

export interface VacationRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  status: string;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  employee?: { full_name: string };
}

export interface VacationEntitlement {
  id: string;
  employee_id: string;
  year: number;
  total_days: number;
  carry_over_days: number;
}

export interface ShiftRequest {
  id: number;
  employee_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  employee?: { full_name: string };
}

export interface TeamMemberStatus {
  member: TeamMember;
  status: 'available' | 'on_shift' | 'on_vacation' | 'offline';
  currentShift?: Shift | ScheduledShift;
  activeTimeEntry?: TimeEntry;
}

export interface TeamSummary {
  teamSize: number;
  onShiftToday: number;
  pendingRequests: number;
  overdueTeamTasks: number;
}

// ─── Team Members ────────────────────────────────────────────────────────────

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, position, phone, email, is_active, manager_id')
        .eq('is_active', true)
        .order('full_name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
  });
}

export function useTeamMember(id: string) {
  return useQuery({
    queryKey: ['team-member', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, position, phone, email, is_active, manager_id')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as TeamMember;
    },
    enabled: !!id,
  });
}

// ─── Shifts ──────────────────────────────────────────────────────────────────

export function useMyShiftToday() {
  const user = useAuthStore((s) => s.user);
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['my-shift-today', today],
    queryFn: async () => {
      // First check actual shifts
      const { data: shift } = await supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', user!.id)
        .eq('shift_date', today)
        .limit(1)
        .maybeSingle();

      if (shift) return { type: 'shift' as const, data: shift as Shift };

      // Fallback to scheduled shifts
      const { data: scheduled } = await supabase
        .from('scheduled_shifts')
        .select('*')
        .eq('employee_id', user!.id)
        .eq('shift_date', today)
        .limit(1)
        .maybeSingle();

      if (scheduled) return { type: 'scheduled' as const, data: scheduled as ScheduledShift };

      return null;
    },
    enabled: !!user?.id,
  });
}

// ─── Time Entries (Clock In/Out) ─────────────────────────────────────────────

export function useMyActiveTimeEntry() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['my-active-time-entry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'running')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as TimeEntry) ?? null;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30s for timer accuracy
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const today = now.split('T')[0];
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user!.id,
          date: today,
          started_at: now,
          status: 'running',
          short_break_minutes: 0,
          lunch_break_minutes: 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data as TimeEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-active-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['my-time-entries-today'] });
      queryClient.invalidateQueries({ queryKey: ['team-availability'] });
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: number) => {
      const now = new Date();
      const { data: entry, error: fetchError } = await supabase
        .from('time_entries')
        .select('started_at')
        .eq('id', entryId)
        .single();
      if (fetchError) throw fetchError;

      const startedAt = new Date(entry.started_at);
      const durationMs = now.getTime() - startedAt.getTime();
      const durationMinutes = Math.round(durationMs / 60000);
      const totalHours = parseFloat((durationMinutes / 60).toFixed(2));

      const { error } = await supabase
        .from('time_entries')
        .update({
          ended_at: now.toISOString(),
          status: 'completed',
          duration_minutes: durationMinutes,
          total_hours: totalHours,
        })
        .eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-active-time-entry'] });
      queryClient.invalidateQueries({ queryKey: ['my-time-entries-today'] });
      queryClient.invalidateQueries({ queryKey: ['team-availability'] });
    },
  });
}

export function useMyTimeEntriesToday() {
  const user = useAuthStore((s) => s.user);
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['my-time-entries-today', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', today)
        .order('started_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TimeEntry[];
    },
    enabled: !!user?.id,
  });
}

// ─── Vacation ────────────────────────────────────────────────────────────────

export function useVacationBalance(userId?: string) {
  const user = useAuthStore((s) => s.user);
  const targetId = userId || user?.id;
  const currentYear = new Date().getFullYear();

  return useQuery({
    queryKey: ['vacation-balance', targetId, currentYear],
    queryFn: async () => {
      // Get entitlement
      const { data: entitlement } = await supabase
        .from('vacation_entitlements')
        .select('total_days, carry_over_days')
        .eq('employee_id', targetId!)
        .eq('year', currentYear)
        .maybeSingle();

      const totalDays = (entitlement?.total_days ?? 30) + (entitlement?.carry_over_days ?? 0);

      // Count approved vacation days this year
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;
      const { count } = await supabase
        .from('vacation_requests')
        .select('days_count', { count: 'exact', head: false })
        .eq('employee_id', targetId!)
        .eq('status', 'approved')
        .gte('start_date', yearStart)
        .lte('end_date', yearEnd);

      // Sum days_count from the query
      const { data: approvedRequests } = await supabase
        .from('vacation_requests')
        .select('days_count')
        .eq('employee_id', targetId!)
        .eq('status', 'approved')
        .gte('start_date', yearStart)
        .lte('end_date', yearEnd);

      const usedDays = (approvedRequests ?? []).reduce((sum, r) => sum + (r.days_count ?? 0), 0);

      return {
        totalDays,
        usedDays,
        remainingDays: totalDays - usedDays,
      };
    },
    enabled: !!targetId,
  });
}

export function useMyVacationRequests() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['my-vacation-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vacation_requests')
        .select('*')
        .eq('employee_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as VacationRequest[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateVacationRequest() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (request: { start_date: string; end_date: string; days_count: number; notes?: string }) => {
      const { data, error } = await supabase
        .from('vacation_requests')
        .insert({
          ...request,
          employee_id: user!.id,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data as VacationRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    },
  });
}

// ─── Shift Requests ──────────────────────────────────────────────────────────

export function useMyShiftRequests() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['my-shift-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shift_requests')
        .select('*')
        .eq('employee_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ShiftRequest[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateShiftRequest() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async (request: { shift_date: string; start_time: string; end_time: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('shift_requests')
        .insert({
          ...request,
          employee_id: user!.id,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;
      return data as ShiftRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shift-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    },
  });
}

// ─── Manager: Pending Requests ───────────────────────────────────────────────

export function usePendingRequests() {
  return useQuery({
    queryKey: ['pending-requests'],
    queryFn: async () => {
      const [vacRes, shiftRes] = await Promise.all([
        supabase
          .from('vacation_requests')
          .select('*, employee:profiles!vacation_requests_employee_id_fkey(full_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('shift_requests')
          .select('*, employee:profiles!shift_requests_employee_id_fkey(full_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
      ]);

      if (vacRes.error) throw vacRes.error;
      if (shiftRes.error) throw shiftRes.error;

      return {
        vacationRequests: (vacRes.data ?? []) as VacationRequest[],
        shiftRequests: (shiftRes.data ?? []) as ShiftRequest[],
      };
    },
  });
}

export function useReviewVacationRequest() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: string; status: 'approved' | 'rejected'; rejection_reason?: string }) => {
      const { error } = await supabase
        .from('vacation_requests')
        .update({
          status,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          ...(rejection_reason ? { rejection_reason } : {}),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-vacation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-balance'] });
    },
  });
}

export function useReviewShiftRequest() {
  const queryClient = useQueryClient();
  const user = useAuthStore.getState().user;
  return useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: number; status: 'approved' | 'rejected'; rejection_reason?: string }) => {
      const { error } = await supabase
        .from('shift_requests')
        .update({
          status,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          ...(rejection_reason ? { rejection_reason } : {}),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-shift-requests'] });
    },
  });
}

// ─── Team Availability ───────────────────────────────────────────────────────

export function useTeamAvailability() {
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['team-availability', today],
    queryFn: async () => {
      // Fetch all active team members
      const { data: members, error: membersErr } = await supabase
        .from('profiles')
        .select('id, full_name, role, position, phone, email, is_active, manager_id')
        .eq('is_active', true)
        .order('full_name');
      if (membersErr) throw membersErr;

      // Fetch today's shifts, scheduled shifts, running time entries, active vacations
      const [shiftsRes, scheduledRes, timeRes, vacRes] = await Promise.all([
        supabase.from('shifts').select('*').eq('shift_date', today),
        supabase.from('scheduled_shifts').select('*').eq('shift_date', today),
        supabase.from('time_entries').select('*').eq('status', 'running'),
        supabase
          .from('vacation_requests')
          .select('employee_id, start_date, end_date')
          .eq('status', 'approved')
          .lte('start_date', today)
          .gte('end_date', today),
      ]);

      const shifts = (shiftsRes.data ?? []) as Shift[];
      const scheduled = (scheduledRes.data ?? []) as ScheduledShift[];
      const timeEntries = (timeRes.data ?? []) as TimeEntry[];
      const vacations = vacRes.data ?? [];

      const shiftsMap = new Map<string, Shift>();
      shifts.forEach((s) => shiftsMap.set(s.employee_id, s));

      const scheduledMap = new Map<string, ScheduledShift>();
      scheduled.forEach((s) => scheduledMap.set(s.employee_id, s));

      const timeMap = new Map<string, TimeEntry>();
      timeEntries.forEach((t) => timeMap.set(t.user_id, t));

      const vacationSet = new Set(vacations.map((v) => v.employee_id));

      const result: TeamMemberStatus[] = (members ?? []).map((member) => {
        const m = member as TeamMember;
        const shift = shiftsMap.get(m.id) ?? scheduledMap.get(m.id);
        const timeEntry = timeMap.get(m.id);
        const onVacation = vacationSet.has(m.id);

        let status: TeamMemberStatus['status'] = 'offline';
        if (onVacation) {
          status = 'on_vacation';
        } else if (timeEntry) {
          status = 'on_shift';
        } else if (shift) {
          status = 'available';
        }

        return {
          member: m,
          status,
          currentShift: shift,
          activeTimeEntry: timeEntry,
        };
      });

      return result;
    },
  });
}

// ─── Team Tasks ──────────────────────────────────────────────────────────────

export function useTeamTasks(memberId?: string) {
  return useQuery({
    queryKey: ['team-tasks', memberId],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*, lead:leads(id, full_name)')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(50);

      if (memberId) {
        query = query.eq('assigned_to', memberId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: memberId ? !!memberId : true,
  });
}

// ─── Team Summary (Dashboard) ────────────────────────────────────────────────

export function useTeamSummary() {
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['team-summary', today],
    queryFn: async (): Promise<TeamSummary> => {
      const [membersRes, shiftsRes, scheduledRes, timeRes, vacReqRes, shiftReqRes, overdueRes] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true),
          supabase
            .from('shifts')
            .select('employee_id')
            .eq('shift_date', today),
          supabase
            .from('scheduled_shifts')
            .select('employee_id')
            .eq('shift_date', today),
          supabase
            .from('time_entries')
            .select('user_id')
            .eq('status', 'running'),
          supabase
            .from('vacation_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase
            .from('shift_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .in('status', ['open', 'in_progress'])
            .not('assigned_to', 'is', null)
            .lt('due_date', today),
        ]);

      // Count unique employees on shift
      const onShiftIds = new Set<string>();
      (shiftsRes.data ?? []).forEach((s) => onShiftIds.add(s.employee_id));
      (scheduledRes.data ?? []).forEach((s) => onShiftIds.add(s.employee_id));
      (timeRes.data ?? []).forEach((t) => onShiftIds.add(t.user_id));

      return {
        teamSize: membersRes.count ?? 0,
        onShiftToday: onShiftIds.size,
        pendingRequests: (vacReqRes.count ?? 0) + (shiftReqRes.count ?? 0),
        overdueTeamTasks: overdueRes.count ?? 0,
      };
    },
  });
}
