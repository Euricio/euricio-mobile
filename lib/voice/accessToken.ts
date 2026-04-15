import { supabase } from '../supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';

/**
 * Fetch a Twilio Voice access token from the backend.
 * The backend endpoint generates time-limited tokens for the Voice SDK.
 */
export async function getVoiceAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/api/twilio/voice/token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ platform: 'ios' }),
  });

  if (!res.ok) {
    throw new Error(`Token fetch failed: ${res.status}`);
  }

  const { token } = await res.json();
  return token;
}
