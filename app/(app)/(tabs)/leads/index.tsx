import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { SearchBar } from '../../../../components/common/SearchBar';
import { LeadCard } from '../../../../components/leads/LeadCard';
import { getLeads, searchLeads, Lead } from '../../../../lib/api/leads';
import { Colors } from '../../../../constants/colors';

export default function LeadsListScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    if (search.length >= 2) {
      searchLeads(search).then(({ data }) => setLeads((data as Lead[]) ?? []));
    } else if (search.length === 0) {
      loadLeads();
    }
  }, [search]);

  async function loadLeads() {
    setLoading(true);
    const { data } = await getLeads();
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Leads', headerShown: true }} />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Lead suchen..." />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeadCard
              id={item.id}
              name={item.name}
              phone={item.phone}
              status={item.status}
              source={item.source}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  loader: { marginTop: 48 },
  list: { padding: 16 },
});
