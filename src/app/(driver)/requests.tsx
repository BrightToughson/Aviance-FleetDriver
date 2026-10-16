import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useUser } from '@clerk/expo';

export default function RequestsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useUser();
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, [user?.id]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [driverReqRes, maintReqRes] = await Promise.all([
        supabase.from('driver_requests').select('*').eq('driver_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('maintenance_requests').select('*').eq('driver_id', user?.id).order('created_at', { ascending: false })
      ]);

      let combined: any[] = [];
      if (driverReqRes.data) {
        combined = combined.concat(driverReqRes.data.map((r: any) => ({
          id: r.id.substring(0, 8).toUpperCase(),
          type: r.request_type,
          date: r.request_type === 'Expense' ? `GH₵${r.amount}` : r.start_date ? `${new Date(r.start_date).toLocaleDateString()} - ${new Date(r.end_date).toLocaleDateString()}` : r.details,
          details: r.details,
          receipt_url: r.receipt_url,
          status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
          submitDate: new Date(r.created_at).toLocaleDateString(),
          icon: r.request_type === 'Expense' ? 'cash' : 'calendar',
          rawDate: new Date(r.created_at)
        })));
      }

      if (maintReqRes.data) {
        combined = combined.concat(maintReqRes.data.map((m: any) => ({
          id: m.id.substring(0, 8).toUpperCase(),
          type: 'Maintenance',
          date: m.description,
          details: m.description,
          status: m.status.charAt(0).toUpperCase() + m.status.slice(1),
          submitDate: new Date(m.created_at).toLocaleDateString(),
          icon: 'build',
          rawDate: new Date(m.created_at)
        })));
      }

      combined.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
      setRequests(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRequests} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('d_req_title', 'My Requests')}</Text>
          <TouchableOpacity style={styles.newButton} onPress={handleNewRequest}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.newButtonText}>{t('d_req_new', 'New Request')}</Text>
          </TouchableOpacity>
        </View>

        {!loading && requests.length === 0 && (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#6B7280' }}>No requests found.</Text>
        )}

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
            {req.type !== 'Maintenance' && <Text style={[styles.detailText, { fontWeight: 'bold' }]}>{req.details}</Text>}
            <Text style={styles.detailText}>{req.date}</Text>

            {req.receipt_url && (
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 8 }}
                onPress={() => window.open(req.receipt_url, '_blank')}
              >
                <Ionicons name="document-text" size={16} color="#043094" />
                <Text style={{ marginLeft: 4, color: '#043094', fontSize: 14, fontWeight: '600' }}>View Attached Document</Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.submitText}>{t('d_req_submitted', 'Submitted:')} {req.submitDate}</Text>
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


