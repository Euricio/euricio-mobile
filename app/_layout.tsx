import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth/authContext';
import { IncomingCallPopup } from '../components/call/IncomingCallPopup';
import { setupPushHandler } from '../lib/push/pushHandler';

export default function RootLayout() {
  useEffect(() => {
    const cleanup = setupPushHandler();
    return cleanup;
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <IncomingCallPopup />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </AuthProvider>
  );
}
