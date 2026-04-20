import React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useQueryClient } from '@tanstack/react-query';
import { refreshWidgetSnapshot } from '../lib/widgets/snapshot';
import { useAuth } from '../lib/auth/authContext';

// In Expo Go the native widget modules are not linked, so there is no point
// in polling the snapshot endpoint. Detect Expo Go at runtime so dev builds
// and production builds still refresh as normal.
const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * WidgetBootstrap — keeps the home-screen widget snapshot fresh.
 *
 * Fires `refreshWidgetSnapshot()` (fetch + write to native storage +
 * reload widget) whenever one of the following happens:
 *   1. App mounts while authenticated
 *   2. App returns to foreground (AppState → active)
 *   3. Query cache signals that data the widget depends on changed
 *      (busy-status, tasks, appointments, calendar, caller-context
 *       interactions).
 *
 * Throttled to max 1 refresh every 10 s to avoid spamming the widget.
 * Silent on failure — the app must never break because of widget I/O.
 */

const THROTTLE_MS = 10_000;

// Query keys whose invalidation should trigger a widget resync.
const WIDGET_DEPENDENT_KEYS = new Set<string>([
  'busy-status',
  'tasks',
  'appointments',
  'calendar',
  'calendar-events',
  'call-workspace',
]);

export default function WidgetBootstrap() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const lastRefreshAt = React.useRef<number>(0);

  const doRefresh = React.useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshAt.current < THROTTLE_MS) return;
    lastRefreshAt.current = now;
    refreshWidgetSnapshot().catch(() => {
      // Silent: widget refresh is best-effort.
    });
  }, []);

  // Initial + foreground refresh
  React.useEffect(() => {
    if (!isAuthenticated) return;
    if (IS_EXPO_GO) {
      // Widget native modules aren't available in Expo Go; skip entirely.
      return;
    }

    // Run once on mount.
    doRefresh();

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') doRefresh();
    });

    return () => {
      sub.remove();
    };
  }, [isAuthenticated, doRefresh]);

  // React to cache changes that mean the widget data is stale.
  React.useEffect(() => {
    if (!isAuthenticated) return;
    if (IS_EXPO_GO) return;

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (!event) return;
      // Only care about query-level events with a key we depend on.
      const key = event.query?.queryKey?.[0];
      if (typeof key !== 'string') return;
      if (!WIDGET_DEPENDENT_KEYS.has(key)) return;

      // `updated` fires for both setQueryData and invalidateQueries results.
      // Guard: only when the query just finished fetching / settled.
      const state = event.query.state;
      if (
        event.type === 'updated' &&
        (state.status === 'success' || state.status === 'error')
      ) {
        doRefresh();
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated, queryClient, doRefresh]);

  return null;
}
