import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { supabase } from '../supabase';
import { openInAppBrowser } from '../inAppBrowser';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';

/**
 * Push pipeline — resilient to missing native module.
 *
 * expo-notifications is listed as a dependency but may not be linked until the
 * next native build. Everything here uses a dynamic import + guards so the app
 * stays fully functional on older builds that don't yet have the module.
 */

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined = undefined;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (cached !== undefined) return cached;
  try {
    cached = await import('expo-notifications');
    return cached;
  } catch (err) {
    console.warn('[push] expo-notifications not available in this build:', err);
    cached = null;
    return null;
  }
}

async function authHeaders(): Promise<Record<string, string> | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function postToken(expo_token: string, platform: 'ios' | 'android', device_name: string | null) {
  const headers = await authHeaders();
  if (!headers) return;
  try {
    const res = await fetch(`${API_URL}/api/push/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ expo_token, platform, device_name }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn('[push] register non-2xx:', res.status, body.slice(0, 200));
    }
  } catch (err) {
    console.warn('[push] register failed:', err);
  }
}

export async function deletePushToken(expo_token: string) {
  const headers = await authHeaders();
  if (!headers) return;
  try {
    await fetch(`${API_URL}/api/push/register?expo_token=${encodeURIComponent(expo_token)}`, {
      method: 'DELETE',
      headers,
    });
  } catch {
    /* ignore */
  }
}

/**
 * Register the current device for push, upsert the token, and wire the tap
 * handler that deep-links into the app. Idempotent — safe to call on every
 * auth change.
 *
 * Returns the token string on success, or null if unsupported / denied.
 */
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  // Show banners + play sound when the app is foregrounded
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }) as any, // SDK 54 renamed fields — cast keeps us compatible with older SDK types
  });

  // Permissions
  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;
  if (existing.status !== 'granted') {
    const ask = await Notifications.requestPermissionsAsync();
    finalStatus = ask.status;
  }
  if (finalStatus !== 'granted') return null;

  // Android channel (no-op on iOS)
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('euricio_default', {
        name: 'Euricio',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    } catch {
      /* ignore */
    }
  }

  // Fetch Expo token
  const projectId = (process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    || (Device as any).expoConfig?.extra?.eas?.projectId
    || undefined);
  let tokenValue: string | null = null;
  try {
    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    tokenValue = tokenRes.data;
  } catch (err) {
    console.warn('[push] getExpoPushTokenAsync failed:', err);
    return null;
  }
  if (!tokenValue) return null;

  await postToken(
    tokenValue,
    Platform.OS === 'ios' ? 'ios' : 'android',
    Device.modelName ?? null,
  );

  return tokenValue;
}

/**
 * Wire the tap handler. Call once at app start. Returns a cleanup fn.
 */
export async function wirePushTapHandler(): Promise<() => void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return () => {};

  const sub = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as
      | {
          deep_link?: string;
          kind?: string;
          contract_id?: string | number;
          signature_token?: string;
          signer_id?: string;
        }
      | undefined;

    // Contract signature push from web send-signature flow:
    // payload contains { kind:'contract_signature', contract_id, signature_token, signer_id }.
    // The signing UI lives on the web CRM but is presented in-app via
    // SFSafariViewController so the user never leaves Euricio.
    if (data?.kind === 'contract_signature' && typeof data.signature_token === 'string') {
      const signer = typeof data.signer_id === 'string' ? data.signer_id : '';
      const url = `${API_URL}/sign/${encodeURIComponent(data.signature_token)}${
        signer ? `?signer=${encodeURIComponent(signer)}` : ''
      }`;
      openInAppBrowser(url).catch(err => {
        console.warn('[push] contract_signature openInAppBrowser failed:', url, err);
      });
      return;
    }

    const deepLink = data?.deep_link;
    if (!deepLink || typeof deepLink !== 'string') return;
    try {
      router.push(deepLink as any);
    } catch (err) {
      console.warn('[push] deep link navigation failed:', deepLink, err);
    }
  });

  return () => sub.remove();
}
