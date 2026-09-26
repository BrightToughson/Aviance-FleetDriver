import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RequestsScreen() {
  const router = useRouter();

  const requests = [
    { id: 'REQ-001', type: 'Time Off', date: 'Oct 12 - Oct 15', status: 'Pending', submitDate: '2 days ago', icon: 'calendar' },
    { id: 'REQ-002', type: 'Vehicle Maintenance', date: 'Brakes making noise', status: 'Approved', submitDate: '1 week ago', icon: 'build' },
    { id: 'REQ-003', type: 'Expense Reimbursement', date: 'Fuel - GH₵45.00', status: 'Rejected', submitDate: '2 weeks ago', icon: 'cash' },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved': return '#10B981';
      case 'Pending': return '#F59E0B';
      case 'Rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBg = (status: string) => {
    switch(status) {
      case 'Approved': return '#D1FAE5';
      case 'Pending': return '#FEF3C7';
      case 'Rejected': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  };

  const handleNewRequest = () => {
    router.push('/(driver)/new-request');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>My Requests</Text>
        <TouchableOpacity style={styles.newButton} onPress={handleNewRequest}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newButtonText}>New Request</Text>
        </TouchableOpacity>
      </View>

      {requests.map((req) => (
        <View key={req.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.typeContainer}>
              <View style={styles.iconBox}>
                <Ionicons name={req.icon as any} size={20} color="#043094" />
              </View>
              <View>
                <Text style={styles.reqType}>{req.type}</Text>
                <Text style={styles.reqId}>{req.id}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBg(req.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(req.status) }]}>{req.status}</Text>
            </View>
          </View>
          
          <View style={styles.cardBody}>
            <Text style={styles.detailText}>{req.date}</Text>
            <Text style={styles.submitText}>Submitted: {req.submitDate}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  newButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#043094', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  newButtonText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  typeContainer: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  reqType: { fontSize: 16, fontWeight: '600', color: '#111827' },
  reqId: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardBody: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  detailText: { fontSize: 15, color: '#374151', marginBottom: 4 },
  submitText: { fontSize: 13, color: '#9CA3AF' },
});


