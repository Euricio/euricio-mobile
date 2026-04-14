import { Config } from '../../constants/config';
import { supabase } from '../api/client';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Holt ein Twilio Access Token vom Backend.
 * Token wird gecached und vor Ablauf erneuert.
 */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Nicht authentifiziert');
  }

  const response = await fetch(`${Config.apiUrl}${Config.twilio.tokenEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Token-Anfrage fehlgeschlagen: ${response.status}`);
  }

  const { token, expiresIn } = await response.json();
  cachedToken = token;
  tokenExpiry = Date.now() + (expiresIn * 1000) - 60_000; // 1 Min Puffer

  return token;
}

export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiry = 0;
}
