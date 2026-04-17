import { Stack } from 'expo-router';
import { colors, fontWeight } from '../../../constants/theme';

export default function PartnersLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: fontWeight.semibold },
        headerShadowVisible: false,
      }}
    />
  );
}
