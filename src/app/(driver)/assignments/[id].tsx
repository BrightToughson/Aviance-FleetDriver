import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAssignments } from '../../../context/AssignmentsContext';

export default function AssignmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { assignments } = useAssignments();
  
  const assignment = assignments.find(a => a.id === id);

  if (!assignment) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Assignment not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Assignment Details</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.routeName}>{assignment.routeName}</Text>
          <View style={[styles.badge, assignment.status === 'In Progress' ? styles.badgeActive : styles.badgePending]}>
            <Text style={[styles.badgeText, assignment.status === 'In Progress' ? styles.badgeTextActive : styles.badgeTextPending]}>
              {assignment.status}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="car-sport-outline" size={20} color="#043094" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Vehicle</Text>
            <Text style={styles.infoValue}>{assignment.vehicle}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color="#043094" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Schedule</Text>
            <Text style={styles.infoValue}>{assignment.time}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#043094" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Stops</Text>
            <Text style={styles.infoValue}>12 Locations</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes & Instructions</Text>
        <View style={styles.notesCard}>
          <Text style={styles.notesText}>
            Ensure all packages are scanned before loading. Contact dispatch if any discrepancies are found during the pre-trip inspection.
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`/(driver)/trip/${assignment.id}` as any)}>
          <Text style={styles.primaryBtnText}>
            {assignment.status === 'In Progress' ? 'Resume' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, paddingBottom: 100 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  errorText: { fontSize: 18, color: '#6B7280', marginBottom: 20 },
  backBtn: { backgroundColor: '#043094', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: 'bold' },
  
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backIcon: { padding: 8, marginRight: 12, backgroundColor: '#fff', borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  routeName: { fontSize: 20, fontWeight: 'bold', color: '#111827', flex: 1, marginRight: 12 },
  
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeActive: { backgroundColor: '#DBEAFE' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  badgeTextActive: { color: '#1D4ED8' },
  badgeTextPending: { color: '#D97706' },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  infoTextContainer: { marginLeft: 16 },
  infoLabel: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#111827' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  notesCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  notesText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },

  actionContainer: { marginTop: 10 },
  primaryBtn: { backgroundColor: '#043094', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#043094', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
