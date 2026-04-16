import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth/authContext';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="hr"
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
    </Stack>
  );
}
