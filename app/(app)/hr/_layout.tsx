import { Stack, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontWeight } from '../../../constants/theme';

export default function HRLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: fontWeight.semibold },
        headerShadowVisible: false,
        headerBackVisible: true,
        headerLeft: ({ canGoBack }) =>
          canGoBack ? undefined : (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={8}
              style={{ marginRight: 8 }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
      }}
    />
  );
}
