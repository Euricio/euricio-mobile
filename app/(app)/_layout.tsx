import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth/authContext';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { VoiceProvider } from '../../lib/voice/VoiceContext';
import { useVoicePermissions } from '../../lib/voice/useVoicePermissions';
import FloatingDialer from '../../components/voice/FloatingDialer';
import FloatingScannerFab from '../../components/scanner/FloatingScannerFab';
import IncomingCallOverlay from '../../components/voice/IncomingCallOverlay';
import { registerForPush, wirePushTapHandler } from '../../lib/push/registerPush';

function PushBootstrap() {
  React.useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        await registerForPush();
        cleanup = await wirePushTapHandler();
      } catch (err) {
        // Non-fatal: push is best-effort.
        console.warn('[push] bootstrap failed', err);
      }
    })();
    return () => {
      cleanup?.();
    };
  }, []);
  return null;
}

function VoiceOverlay() {
  const { data: perms } = useVoicePermissions();
  if (!perms?.hasPermission || !perms?.isConnected) return null;
  return (
    <>
      <FloatingDialer />
      <IncomingCallOverlay />
    </>
  );
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <VoiceProvider>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="manager"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="hr"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="voice"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="email"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="call/[id]"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="property-media"
            options={{
              headerShown: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="scanner"
            options={{
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="busy-mode"
            options={{
              headerShown: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="missed-calls"
            options={{
              headerShown: true,
              animation: 'slide_from_right',
            }}
          />
        </Stack>
        <FloatingScannerFab />
        <VoiceOverlay />
        <PushBootstrap />
      </View>
    </VoiceProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
