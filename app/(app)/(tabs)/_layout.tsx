import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontWeight } from '../../../constants/theme';
import { useI18n } from '../../../lib/i18n';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: TabIconName; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingBottom: 4,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: fontWeight.medium,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: fontWeight.semibold,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('tab_dashboard'),
          headerTitle: t('tab_dashboard'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: t('tab_leads'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: t('tab_properties'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="business-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t('tab_tasks'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="checkbox-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tab_more'),
          headerTitle: t('settings_title'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
