import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useVehicle } from '../../context/VehicleContext';

export default function IssueDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { issues } = useVehicle();

  const issue = issues.find(i => i.id === id);

  if (!issue) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{t('d_issue_not_found', 'Issue not found')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(driver)/issues')}>
          <Text style={styles.backBtnText}>{t('common_go_back', 'Go Back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(driver)/issues')} style={styles.backNav}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('d_issue_details', 'Issue Details')}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.issueId}>ID: {issue.id.slice(0, 8)}</Text>
            <Text style={styles.date}>{issue.date}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            issue.status === 'Resolved' ? styles.statusResolved : 
            issue.status === 'In Progress' ? styles.statusInProgress : 
            styles.statusPending
          ]}>
            <Text style={[
              styles.statusText,
              issue.status === 'Resolved' ? styles.statusResolvedText : 
              issue.status === 'In Progress' ? styles.statusInProgressText : 
              styles.statusPendingText
            ]}>{issue.status}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.label}>{t('d_issue_lbl_cat', 'Category')}</Text>
        <Text style={styles.value}>{issue.type.toUpperCase()}</Text>

        <Text style={styles.label}>{t('d_issue_lbl_desc', 'Description')}</Text>
        <Text style={styles.descValue}>{issue.desc}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  errorText: { fontSize: 16, color: '#6B7280', marginBottom: 16 },
  backBtn: { backgroundColor: '#043094', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backNav: { marginRight: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  issueId: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 4 },
  date: { fontSize: 13, color: '#6B7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusResolved: { backgroundColor: '#D1FAE5' },
  statusInProgress: { backgroundColor: '#DBEAFE' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusResolvedText: { color: '#059669' },
  statusInProgressText: { color: '#1D4ED8' },
  statusPendingText: { color: '#D97706' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  label: { fontSize: 13, color: '#6B7280', marginBottom: 4, fontWeight: '500' },
  value: { fontSize: 16, color: '#111827', fontWeight: '600', marginBottom: 16 },
  descValue: { fontSize: 15, color: '#374151', lineHeight: 22 }
});
