import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@clerk/expo';

const mockDatabase = [
  { id: '1', type: 'Vehicle', title: '2022 Ford Transit', icon: 'car-outline', route: '/(driver)/vehicle-details' },
  { id: '2', type: 'Vehicle', title: 'Vehicle 102 (ABC-9876)', icon: 'car-outline', route: '/(driver)/vehicle-details' },
  { id: '3', type: 'Task', title: 'Route 4 Delivery', icon: 'map-outline', route: '/(driver)/assignments' },
  { id: '4', type: 'Maintenance', title: 'Oil Change', icon: 'build-outline', route: '/(driver)/reminders' },
  { id: '5', type: 'Policy', title: 'Leave Policy', icon: 'document-text-outline', route: '/(driver)/help' },
  { id: '6', type: 'Issue', title: 'Brake Noise', icon: 'warning-outline', route: '/(driver)/issues' },
  { id: '7', type: 'Fuel', title: 'Refill at Shell Station', icon: 'water-outline', route: '/(driver)/fuel' },
  { id: '8', type: 'Inspection', title: 'Morning Pre-use Check', icon: 'clipboard-outline', route: '/(driver)/inspections' }
];

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const loadRecents = async () => {
      if (!user?.id) {
        setRecentSearches([]);
        return;
      }
      try {
        const stored = await AsyncStorage.getItem(`@driver_recent_searches_${user.id}`);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        } else {
          setRecentSearches([]);
        }
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    };
    loadRecents();
  }, [user?.id]);

  const filteredResults = mockDatabase.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) || 
    item.type.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectResult = async (item: any) => {
    if (!recentSearches.includes(item.title)) {
      const updated = [item.title, ...recentSearches].slice(0, 10);
      setRecentSearches(updated);
      if (user?.id) {
        await AsyncStorage.setItem(`@driver_recent_searches_${user.id}`, JSON.stringify(updated)).catch(console.error);
      }
    }
    // Navigate to route
    router.replace(item.route as any);
    setQuery('');
  };

  const handleClearRecents = async () => {
    setRecentSearches([]);
    if (user?.id) {
      await AsyncStorage.removeItem(`@driver_recent_searches_${user.id}`).catch(console.error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            placeholder={t('d_search_ph', 'Search tasks, vehicles, issues...')}
            placeholderTextColor="#9CA3AF"
            autoFocus
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {!query ? (
          <View>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>{t('d_search_recent', 'Recent Searches')}</Text>
              {recentSearches.length > 0 && (
                <TouchableOpacity onPress={handleClearRecents}>
                  <Text style={styles.clearText}>{t('d_search_clear', 'Clear')}</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {recentSearches.length > 0 ? (
              recentSearches.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.recentItem}
                  onPress={() => setQuery(item)}
                >
                  <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                  <Text style={styles.recentText}>{item}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyRecentText}>{t('d_search_no_recent', 'No recent searches')}</Text>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>{t('d_search_results', 'Search Results')}</Text>
            {filteredResults.length > 0 ? (
              filteredResults.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.resultItem}
                  onPress={() => handleSelectResult(item)}
                >
                  <View style={styles.resultIconWrapper}>
                    <Ionicons name={item.icon as any} size={20} color="#043094" />
                  </View>
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    <Text style={styles.resultType}>{item.type}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>{t('d_search_no_results', 'No results found for')} "{query}"</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginTop: 10 },
  backBtn: { marginRight: 16 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, height: 44 },
  input: { flex: 1, height: '100%', fontSize: 16, marginLeft: 8, color: '#111827', outlineStyle: 'none' as any },
  content: { flex: 1, padding: 20 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  clearText: { color: '#043094', fontSize: 14, fontWeight: '600' },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  recentText: { fontSize: 16, color: '#4B5563', marginLeft: 12 },
  emptyRecentText: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic', marginTop: 10 },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  resultIconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  resultTextContainer: { flex: 1 },
  resultTitle: { fontSize: 16, fontWeight: '500', color: '#111827' },
  resultType: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
});
