import { Platform } from 'react-native';
import { supabase } from '../supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';

/** App Group / shared-preferences identifier for the home screen widget. */
export const WIDGET_APP_GROUP = 'group.com.euricio.crm.widget';

/** Storage key — Swift/Kotlin side reads the exact same key. */
export const WIDGET_STORAGE_KEY = 'euricio_widget_snapshot';

/** Android-side widget name (must match app.config.js `widgets[].name`). */
export const ANDROID_WIDGET_NAME = 'EuricioNextCall';

// ---------------------------------------------------------------------------
// Data shape — must mirror /api/widget/snapshot (backend) + index.swift decoder
// ---------------------------------------------------------------------------

export interface WidgetNextCall {
  when: string;
  title: string | null;
  entity_name: string | null;
  entity_type: 'lead' | 'property_owner' | 'partner' | null;
  entity_id: string | number | null;
}

export interface WidgetSnapshot {
  is_busy: boolean;
  busy_until: string | null;
  next_call: WidgetNextCall | null;
  open_tasks_count: number;
  open_callbacks_count: number;
  generated_at: string;
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
 * GET /api/widget/snapshot — returns the current widget payload for the
 * signed-in manager. The backend scopes tasks/appointments per manager_id.
 */
export async function fetchWidgetSnapshot(): Promise<WidgetSnapshot> {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/api/widget/snapshot`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body.slice(0, 200) || `widget-snapshot ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Native storage write — platform-specific, dynamically imported so the app
// keeps working on Expo Go / web without the widget native modules present.
// ---------------------------------------------------------------------------

/**
 * Write the snapshot into App Group user defaults (iOS) or the Android
 * widget store, then ask the OS to refresh the widget timeline.
 *
 * Silently no-ops on unsupported platforms or if the native modules are
 * not linked (e.g. Expo Go); the UI still works, only the widget pauses.
 */
export async function writeSnapshotToNativeStorage(
  snapshot: WidgetSnapshot,
): Promise<void> {
  const payload = JSON.stringify(snapshot);

  if (Platform.OS === 'ios') {
    try {
      // @ts-ignore — optional peer, available after `expo prebuild` with the
      // @bacons/apple-targets config plugin.
      const mod = await import('@bacons/apple-targets');
      const ExtensionStorage = mod?.ExtensionStorage;
      if (!ExtensionStorage) return;
      const storage = new ExtensionStorage(WIDGET_APP_GROUP);
      storage.set(WIDGET_STORAGE_KEY, payload);
      try {
        ExtensionStorage.reloadWidget?.();
      } catch {
        // reloadWidget is best-effort; ignore failures.
      }
    } catch {
      // Module not available (e.g. running in Expo Go). Ignore.
    }
    return;
  }

  if (Platform.OS === 'android') {
    try {
      // @ts-ignore — optional peer, linked via react-native-android-widget.
      const mod = await import('react-native-android-widget');
      const requestWidgetUpdate = mod?.requestWidgetUpdate;
      if (typeof requestWidgetUpdate === 'function') {
        requestWidgetUpdate({
          widgetName: ANDROID_WIDGET_NAME,
          renderWidget: (_info: unknown) => {
            // The actual renderer lives in `widgets/EuricioNextCallWidget.tsx`
            // and is registered via `registerWidgetTaskHandler`. This call
            // just triggers the OS to re-invoke that handler.
            // Returning null is a no-op; the handler runs on its own side.
            return null as any;
          },
          widgetNotFound: () => {
            // Widget not placed on home screen yet — ignore.
          },
        });
      }
      // Also stash the payload in an AsyncStorage-like bridge so the
      // widget task handler can read it without another network call.
      try {
        const { default: AsyncStorage } = await import(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore — optional; falls back to no-op.
          '@react-native-async-storage/async-storage'
        );
        if (AsyncStorage?.setItem) {
          await AsyncStorage.setItem(WIDGET_STORAGE_KEY, payload);
        }
      } catch {
        // Not installed — fine; the task handler uses its own state.
      }
    } catch {
      // Module not available. Ignore.
    }
    return;
  }

  // Web / other — nothing to do.
}

/**
 * Convenience: fetch + persist in one call. Returns the snapshot so callers
 * can also show it in-app (e.g. a pull-down summary card).
 */
export async function refreshWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const snapshot = await fetchWidgetSnapshot();
    await writeSnapshotToNativeStorage(snapshot);
    return snapshot;
  } catch {
    // Silent: widget refresh must never break the app.
    return null;
  }
}
