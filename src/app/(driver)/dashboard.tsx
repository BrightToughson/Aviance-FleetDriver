import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSchedules } from '../../context/SchedulesContext';
import { useAssignments } from '../../context/AssignmentsContext';
import { useVehicle } from '../../context/VehicleContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { schedules } = useSchedules();
  const { assignments } = useAssignments();
  const { fuelLevel } = useVehicle();

  const quickActions = [
    { name: 'Start Trip', icon: 'play', color: '#10B981', route: '/(driver)/assignments' },
    { name: 'Report Issue', icon: 'warning', color: '#EF4444', route: '/(driver)/issues' },
    { name: 'Log Fuel', icon: 'water', color: '#3B82F6', route: '/(driver)/fuel' },
    { name: 'Inspection', icon: 'clipboard', color: '#8B5CF6', route: '/(driver)/inspections' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good Morning, Driver!</Text>
        <Text style={styles.date}>{new Date().toDateString()}</Text>
      </View>

      {(() => {
        const activeAssignment = assignments.find(a => a.status === 'In Progress') || assignments.find(a => a.status === 'Pending');
        const vehicleString = activeAssignment ? activeAssignment.vehicle : 'No Vehicle Assigned';
        let vehicleName = vehicleString;
        let vehiclePlate = '';
        if (vehicleString.includes('(')) {
          const parts = vehicleString.split('(');
          vehicleName = parts[0].trim();
          vehiclePlate = 'Plate: ' + parts[1].replace(')', '');
        }

        return (
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(driver)/vehicle-details' as any)}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Current Vehicle</Text>
              <View style={[styles.statusBadge, !activeAssignment && { backgroundColor: '#F3F4F6' }]}>
                <Text style={[styles.statusText, !activeAssignment && { color: '#6B7280' }]}>
                  {activeAssignment ? 'Assigned' : 'None'}
                </Text>
              </View>
            </View>
            <View style={styles.vehicleInfo}>
              {activeAssignment?.vehicleImage ? (
                <Image 
                  source={{ uri: activeAssignment.vehicleImage }} 
                  style={{ width: 60, height: 60, borderRadius: 30, marginRight: 16 }} 
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="car-sport" size={48} color={activeAssignment ? "#043094" : "#9CA3AF"} />
              )}
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>{vehicleName}</Text>
                {!!vehiclePlate && <Text style={styles.vehiclePlate}>{vehiclePlate}</Text>}
                {!!activeAssignment && <Text style={styles.vehicleFuel}>Fuel: {fuelLevel}%</Text>}
              </View>
            </View>
          </TouchableOpacity>
        );
      })()}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        {quickActions.map((action, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.actionBtn, isMobile && styles.actionBtnMobile]} 
            onPress={() => router.push(action.route as any)}
          >
            <View style={[styles.iconWrapper, { backgroundColor: action.color + '20' }]}>
              <Ionicons name={action.icon as any} size={24} color={action.color} />
            </View>
            <Text style={styles.actionText}>{action.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Today's Schedule</Text>
      <View style={styles.card}>
        {schedules.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#6B7280', padding: 20 }}>No schedules created.</Text>
        ) : (
          schedules.slice(0, 3).map((schedule, index) => (
            <View key={schedule.id} style={[styles.scheduleItem, index === Math.min(2, schedules.length - 1) && { borderBottomWidth: 0 }]}>
              <View style={styles.timeBox}>
                <Text style={styles.timeText}>{schedule.dueDate.split(',')[0] || 'Anytime'}</Text>
              </View>
              <View style={styles.scheduleDetails}>
                <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                <Text style={styles.scheduleSub} numberOfLines={1}>{schedule.description || schedule.type}</Text>
              </View>
              <Ionicons name={schedule.status === 'completed' ? 'checkmark-circle' : 'time-outline'} size={24} color={schedule.status === 'completed' ? '#10B981' : '#F59E0B'} />
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>Today's Assignments</Text>
      {assignments.filter(a => a.status !== 'Completed').map((assignment) => (
        <TouchableOpacity 
          key={assignment.id} 
          style={styles.card}
          onPress={() => router.push(`/(driver)/assignments/${assignment.id}` as any)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="map-outline" size={20} color="#043094" />
              <Text style={styles.cardTitle}>{assignment.routeName}</Text>
            </View>
            <View style={[styles.badge, assignment.status === 'In Progress' ? styles.badgeActive : styles.badgePending]}>
              <Text style={[styles.badgeText, assignment.status === 'In Progress' ? styles.badgeTextActive : styles.badgeTextPending]}>
                {assignment.status}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailsRow}>
            <Ionicons name="car-outline" size={16} color="#6B7280" />
            <Text style={styles.detailsText}>{assignment.vehicle}</Text>
          </View>
          
          <View style={[styles.detailsRow, { marginBottom: 0 }]}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.detailsText}>{assignment.time}</Text>
          </View>
        </TouchableOpacity>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  date: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  statusBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#059669', fontSize: 12, fontWeight: '600' },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center' },
  vehicleDetails: { marginLeft: 16 },
  vehicleName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  vehiclePlate: { fontSize: 14, color: '#4B5563', marginTop: 4 },
  vehicleFuel: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1, minWidth: '22%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  actionBtnMobile: { minWidth: '45%' },
  iconWrapper: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontSize: 14, fontWeight: '500', color: '#374151', textAlign: 'center' },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  timeBox: { width: 70 },
  timeText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  scheduleDetails: { flex: 1, paddingHorizontal: 12 },
  scheduleTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  scheduleSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: '#DBEAFE' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextActive: { color: '#1D4ED8' },
  badgeTextPending: { color: '#D97706' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailsText: { fontSize: 14, color: '#4B5563', marginLeft: 8 },
});
