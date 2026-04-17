import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontWeight, spacing, fontSize } from '../../../constants/theme';
import { useI18n } from '../../../lib/i18n';
import { useUnreadCount } from '../../../lib/api/notifications';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: TabIconName; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function NotificationBell() {
  const { data: unreadCount } = useUnreadCount();
  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/notifications/')}
      style={bellStyles.container}
    >
      <Ionicons name="notifications-outline" size={22} color={colors.text} />
      {(unreadCount ?? 0) > 0 && (
        <View style={bellStyles.badge}>
          <Text style={bellStyles.badgeText}>
            {unreadCount! > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const bellStyles = StyleSheet.create({
  container: { padding: spacing.xs, marginRight: spacing.sm },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
});

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
          headerRight: () => <NotificationBell />,
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
        name="contracts"
        options={{
          title: t('contracts_title'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tab_more'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
