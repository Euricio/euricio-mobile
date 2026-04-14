import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Card } from '../../../../components/common/Card';
import { Badge } from '../../../../components/common/Badge';
import { useTasks } from '../../../../hooks/useTasks';
import { Colors } from '../../../../constants/colors';

const priorityVariant = {
  urgent: 'error',
  high: 'warning',
  medium: 'info',
  low: 'default',
} as const;

const typeLabel = {
  callback: 'Rückruf',
  follow_up: 'Nachfassen',
  meeting: 'Termin',
  general: 'Allgemein',
} as const;

export default function TasksScreen() {
  const { tasks, loading, completeTask } = useTasks('open');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Aufgaben', headerShown: true }} />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                <Badge
                  label={item.priority}
                  variant={priorityVariant[item.priority as keyof typeof priorityVariant] ?? 'default'}
                />
              </View>
              <Text style={styles.taskType}>{typeLabel[item.type as keyof typeof typeLabel] ?? item.type}</Text>
              {item.due_date && (
                <Text style={styles.dueDate}>
                  Fällig: {new Date(item.due_date).toLocaleDateString('de-DE')}
                </Text>
              )}
              <TouchableOpacity style={styles.completeBtn} onPress={() => completeTask(item.id)}>
                <Text style={styles.completeBtnText}>Erledigt</Text>
              </TouchableOpacity>
            </Card>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Keine offenen Aufgaben — gut gemacht!</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  loader: { marginTop: 48 },
  list: { padding: 16 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  taskType: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  dueDate: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  completeBtn: { marginTop: 12, alignSelf: 'flex-end', backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  completeBtnText: { color: Colors.textInverse, fontSize: 13, fontWeight: '600' },
  empty: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', marginTop: 48 },
});
