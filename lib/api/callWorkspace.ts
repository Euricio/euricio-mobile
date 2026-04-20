import { supabase } from '../supabase';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';

export type InteractionType =
  | 'call'
  | 'note'
  | 'stage_change'
  | 'appointment_scheduled'
  | 'callback_scheduled'
  | 'task_created'
  | 'property_assigned';

export interface InteractionPayload {
  entity_type: 'lead' | 'property_owner' | 'partner';
  entity_id: number;
  interaction_type: InteractionType;
  summary: string;
  stage?: string;
  next_action?: string;
  callback_at?: string;
  property_id?: number;
  task?: {
    title: string;
    due_date?: string;
    task_type?: string;
  };
  appointment?: {
    title: string;
    start_at: string;
    end_at?: string;
    description?: string;
  };
}

export interface InteractionResponse {
  success: boolean;
  applied: {
    interaction_id: number;
    stage?: string;
    next_action?: string;
    property_assigned?: number;
    callback_task_id?: number | null;
    task_id?: number | null;
    appointment_id?: string | null;
    stage_error?: string;
    next_action_error?: string;
    property_assigned_error?: string;
    callback_error?: string;
    task_error?: string;
    appointment_error?: string;
  };
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Low-level POST /api/voice/interactions.
 * Records a contact_interaction and applies optional structured
 * side-effects (stage, next_action, callback, task, appointment,
 * property assignment) in a single round-trip.
 */
export async function postInteraction(
  payload: InteractionPayload,
): Promise<InteractionResponse> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/voice/interactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body.slice(0, 200) || `interactions ${res.status}`);
  }
  return res.json();
}

/**
 * React-query mutation for the Mobile Call Workspace. Invalidates
 * relevant caches on success so the caller overlay / lead screen
 * picks up the new interaction + task + appointment.
 */
export function useRecordInteraction() {
  const qc = useQueryClient();
  return useMutation<InteractionResponse, Error, InteractionPayload>({
    mutationFn: postInteraction,
    onSuccess: (_data, variables) => {
      // Caller context shows last_interaction / next_action / open_tasks
      qc.invalidateQueries({ queryKey: ['callerContext'] });
      // Lead / owner detail screens
      if (variables.entity_type === 'lead') {
        qc.invalidateQueries({ queryKey: ['lead', variables.entity_id] });
        qc.invalidateQueries({ queryKey: ['leads'] });
        qc.invalidateQueries({ queryKey: ['tasks'] });
      } else if (variables.entity_type === 'property_owner') {
        qc.invalidateQueries({ queryKey: ['property_owner', variables.entity_id] });
      }
      // Calendar (appointments)
      if (variables.appointment) {
        qc.invalidateQueries({ queryKey: ['appointments'] });
        qc.invalidateQueries({ queryKey: ['calendar'] });
      }
    },
  });
}
