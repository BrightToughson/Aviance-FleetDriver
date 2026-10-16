import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAssignments } from '../../context/AssignmentsContext';

export default function AssignmentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { assignments } = useAssignments();
  const [activeTab, setActiveTab] = useState('Active');
  
  const displayedAssignments = assignments.filter(a => 
    activeTab === 'Active' ? a.status !== 'Completed' : a.status === 'Completed'
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <TouchableOpacity onPress={() => router.replace('/(driver)/dashboard')} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('d_assign_title', 'My Assignments')}</Text>
        </View>
        <Text style={styles.subtitle}>{t('d_assign_subtitle', 'Your scheduled routes and vehicles')}</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Active' && styles.activeTab]}
          onPress={() => setActiveTab('Active')}
        >
          <Text style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>{t('d_assign_tab_active', 'Active')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Completed' && styles.activeTab]}
          onPress={() => setActiveTab('Completed')}
        >
          <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>{t('d_assign_tab_completed', 'Completed')}</Text>
        </TouchableOpacity>
      </View>

      {displayedAssignments.map((assignment) => (
        <View key={assignment.id} style={styles.card}>
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
          
          <View style={styles.detailsRow}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.detailsText}>{assignment.time}</Text>
          </View>
          
          <View style={styles.actionRow}>
            {assignment.status !== 'Completed' && (
              <TouchableOpacity 
                style={styles.primaryBtn}
                onPress={() => router.push(`/(driver)/trip/${assignment.id}` as any)}
              >
                <Text style={styles.primaryBtnText}>
                  {assignment.status === 'In Progress' ? t('d_assign_btn_resume', 'Resume') : t('d_assign_btn_start', 'Start')}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.secondaryBtn}
              onPress={() => router.push(`/(driver)/assignments/${assignment.id}` as any)}
            >
              <Text style={styles.secondaryBtnText}>{t('d_assign_btn_details', 'View Details')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 8, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#043094' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginLeft: 8, flexShrink: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: '#DBEAFE' },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextActive: { color: '#1D4ED8' },
  badgeTextPending: { color: '#D97706' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailsText: { fontSize: 14, color: '#4B5563', marginLeft: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  primaryBtn: { flex: 1, backgroundColor: '#043094', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  secondaryBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  secondaryBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },
});
