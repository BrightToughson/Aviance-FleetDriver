import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlerts } from '../../context/AlertsContext';

export default function AlertsScreen() {
  const { alerts, markAllAsRead, markAsRead } = useAlerts();

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    if (Platform.OS === 'web') {
      window.alert('All alerts marked as read');
    } else {
      Alert.alert('Success', 'All alerts marked as read');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'reminder': return 'alarm';
      case 'schedule': return 'calendar';
      case 'assignment': return 'briefcase';
      case 'request': return 'document-text';
      case 'checklist': return 'checkmark-circle';
      default: return 'notifications';
    }
  };

  const getColor = (type: string) => {
    switch(type) {
      case 'reminder': return '#F59E0B';
      case 'schedule': return '#3B82F6';
      case 'assignment': return '#10B981';
      case 'request': return '#8B5CF6';
      case 'checklist': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts & Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={styles.markReadText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {alerts.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 50 }}>No notifications yet.</Text>
      ) : (
        alerts.map((alert) => (
          <TouchableOpacity 
            key={alert.id} 
            style={[styles.card, !alert.isRead && styles.unreadCard]}
            onPress={() => markAsRead(alert.id)}
          >
            <View style={styles.iconContainer}>
              <View style={[styles.iconBox, { backgroundColor: getColor(alert.type) + '15' }]}>
                <Ionicons name={getIcon(alert.type) as any} size={24} color={getColor(alert.type)} />
              </View>
              {!alert.isRead && <View style={styles.unreadDot} />}
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={[styles.alertTitle, !alert.isRead && styles.unreadText]}>{alert.title}</Text>
                <Text style={styles.dateText}>{formatDate(alert.timestamp)}</Text>
              </View>
              <Text style={styles.description} numberOfLines={2}>{alert.body}</Text>
              <View style={styles.badgeContainer}>
                <Text style={[styles.severityBadge, { color: getColor(alert.type) }]}>{alert.type.toUpperCase()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  markReadText: { color: '#043094', fontWeight: '600', fontSize: 14 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#043094' },
  iconContainer: { marginRight: 16, position: 'relative' },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#043094', borderWidth: 2, borderColor: '#fff' },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  alertTitle: { fontSize: 16, fontWeight: '600', color: '#374151', flex: 1, marginRight: 8 },
  unreadText: { color: '#111827', fontWeight: '700' },
  dateText: { fontSize: 12, color: '#9CA3AF' },
  description: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 8 },
  badgeContainer: { flexDirection: 'row' },
  severityBadge: { fontSize: 12, fontWeight: '600' },
});
