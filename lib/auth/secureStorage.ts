import * as SecureStore from 'expo-secure-store';

const KEYS = {
  SESSION: 'euricio_session',
  VOICE_TOKEN: 'euricio_voice_token',
  PUSH_TOKEN: 'euricio_push_token',
} as const;

export async function storeSession(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.SESSION, token);
}

export async function getStoredSession(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.SESSION);
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.SESSION);
}

export async function storeVoiceToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.VOICE_TOKEN, token);
}

export async function getVoiceToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.VOICE_TOKEN);
}

export async function clearAllSecureData(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key))
  );
}
