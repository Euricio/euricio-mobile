import { useEffect } from 'react';
import { Linking } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { AuthProvider } from '../lib/auth/authContext';
import { I18nProvider } from '../lib/i18n';
import { isInAppBrowserUrl, openInAppBrowser } from '../lib/inAppBrowser';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Check for OTA updates on app start
  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // Silently ignore update errors (e.g. no network, Expo Go)
      }
    }
    checkForUpdates();
  }, []);

  // Universal Links: when iOS hands the app a https://crm.euricio.es/sign/...
  // or /portal/... URL (cold start or while running), present it in the
  // in-app browser instead of bouncing to Safari. The signing/portal flows
  // are still web pages today, so this keeps the user visually inside the
  // app while we transition them to native screens later.
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url && isInAppBrowserUrl(url)) openInAppBrowser(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (isInAppBrowserUrl(url)) openInAppBrowser(url);
    });
    return () => sub.remove();
  }, []);

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}
