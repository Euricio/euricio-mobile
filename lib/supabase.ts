import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// NEVER hardcode Supabase URL or keys in this file — this repo is PUBLIC.
// Values are injected at build time from the EAS / local env. A missing
// value fails loudly so we notice before shipping a broken build.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env: set EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (local) or in EAS secrets (CI/release).',
  );
}

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

/**
 * Sanitize a file name for Supabase Storage keys.
 * Removes accents/diacritics, replaces spaces with underscores,
 * and strips any remaining non-ASCII or special characters.
 */
export function sanitizeStorageKey(path: string): string {
  return path
    .split('/')
    .map((segment) =>
      segment
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/\s+/g, '_')            // spaces → underscores
        .replace(/[^a-zA-Z0-9._-]/g, '') // strip remaining special chars
    )
    .join('/');
}

/**
 * Upload a local file to Supabase Storage.
 * Works around React Native's broken FormData/Blob handling by reading
 * the file as base64, decoding to Uint8Array, and using supabase-js upload.
 * The storagePath is automatically sanitized for safe storage keys.
 */
export async function uploadToStorage(
  bucket: string,
  storagePath: string,
  fileUri: string,
  contentType: string,
): Promise<{ size: number; sanitizedPath: string }> {
  storagePath = sanitizeStorageKey(storagePath);
  const base64Data = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (!base64Data || base64Data.length === 0) {
    throw new Error('Could not read file — base64 data is empty');
  }

  // Decode base64 to Uint8Array
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, bytes, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return { size: bytes.length, sanitizedPath: storagePath };
}
