import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vddfghfvmnrbotmxhvvi.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkZGZnaGZ2bW5yYm90bXhodnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDEwMTksImV4cCI6MjA5MTAxNzAxOX0.jbwqw10ntettfPARHmdWYuYrkzhf-AOOWFQZ6rvH23s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Get a fresh access token, refreshing the session if the JWT has expired.
 *
 * `supabase.auth.getSession()` reads from local storage and does NOT
 * automatically refresh an expired token.  On mobile the app is frequently
 * backgrounded, so the cached JWT can easily be stale by the time we need
 * it for an upload.  This helper checks the `expires_at` claim and calls
 * `refreshSession()` when necessary so callers always get a valid token.
 */
export async function getFreshAccessToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // expires_at is a Unix timestamp (seconds). Refresh if within 60 s of expiry.
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at - now < 60) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      throw new Error('Session expired — please sign in again');
    }
    return data.session.access_token;
  }

  return session.access_token;
}
