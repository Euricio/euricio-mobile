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
});
