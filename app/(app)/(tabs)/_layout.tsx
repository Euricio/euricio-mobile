import { Tabs } from 'expo-router';
import { Colors } from '../../../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
        },
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Heute',
          headerTitle: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Objekte',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Aufgaben',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Einstellungen',
          headerTitle: 'Einstellungen',
        }}
      />
    </Tabs>
  );
}
