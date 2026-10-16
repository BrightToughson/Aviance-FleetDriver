import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/expo';
import { supabase } from '../../lib/supabase';

export default function MyEquipmentScreen() {
  const { user } = useUser();
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchMyEquipment();
      
      // Subscribe to changes in real-time
      const channel = supabase
        .channel('public:equipment')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'equipment' },
          (payload) => {
            fetchMyEquipment();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const fetchMyEquipment = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('assigned_driver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipments(data || []);
    } catch (err) {
      console.error('Error fetching my equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnEquipment = async (equipmentId: string, equipmentName: string) => {
    const returnItem = async () => {
      try {
        const { error } = await supabase
          .from('equipment')
          .update({ status: 'pending_return' })
          .eq('id', equipmentId);

        if (error) throw error;
        
        if (Platform.OS === 'web') {
          window.alert(`You have returned ${equipmentName}`);
        } else {
          Alert.alert('Success', `You have returned ${equipmentName}`);
        }
        
        // Optimistic UI update
        setEquipments(prev => prev.map(e => e.id === equipmentId ? { ...e, status: 'pending_return' } : e));
      } catch (err) {
        console.error('Error returning equipment:', err);
        if (Platform.OS === 'web') {
          window.alert('Failed to return equipment. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to return equipment. Please try again.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to return ${equipmentName}?`)) {
        returnItem();
      }
    } else {
      Alert.alert(
        'Return Equipment',
        `Are you sure you want to return ${equipmentName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Return', onPress: returnItem, style: 'destructive' }
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#043094" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerArea}>
          <Text style={styles.title}>My Checked Out Equipment</Text>
          <Text style={styles.subtitle}>Manage the tools and equipment currently in your possession.</Text>
        </View>

        {equipments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Equipment Checked Out</Text>
            <Text style={styles.emptySubtitle}>You don't have any equipment currently checked out. See your manager to check out tools.</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {equipments.map(equipment => (
              <View key={equipment.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconContainer}>
                    {equipment.image_url ? (
                      <Image source={{ uri: equipment.image_url }} style={{ width: 48, height: 48, borderRadius: 8 }} />
                    ) : (
                      <Ionicons name="construct" size={24} color="#043094" />
                    )}
                  </View>
                  <View style={styles.cardHeaderTexts}>
                    <Text style={styles.cardTitle}>{equipment.name}</Text>
                    <Text style={styles.cardSubtitle}>
                      {equipment.make} {equipment.model} {equipment.year ? `(${equipment.year})` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Serial Number (SN):</Text>
                    <Text style={styles.detailValue}>{equipment.serial_number || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type / Category:</Text>
                    <Text style={styles.detailValue}>{equipment.type || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{equipment.status || 'Active'}</Text>
                    </View>
                  </View>
                </View>

                {equipment.status === 'pending_return' ? (
                  <View style={[styles.returnBtn, { backgroundColor: '#FFA500', opacity: 0.8 }]}>
                    <Ionicons name="time-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.returnBtnText}>Pending Manager Confirmation</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.returnBtn} 
                    onPress={() => handleReturnEquipment(equipment.id, equipment.name)}
                  >
                    <Ionicons name="log-in-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.returnBtnText}>Return Equipment</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  headerArea: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 12, marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 15, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  cardsContainer: { gap: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cardIconContainer: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  cardHeaderTexts: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 2 },
  cardSubtitle: { fontSize: 14, color: '#6B7280' },
  cardDetails: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 15, marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  detailLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
  statusBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#065F46', fontSize: 12, fontWeight: '600' },
  returnBtn: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 8 },
  returnBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' }
});
