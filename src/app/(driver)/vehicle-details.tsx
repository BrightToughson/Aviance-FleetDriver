import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAssignments } from '../../context/AssignmentsContext';
import { useVehicle } from '../../context/VehicleContext';

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { assignments } = useAssignments();
  const { fuelLevel, issues, currentVehicle } = useVehicle();

  const vehicleName = currentVehicle ? `${currentVehicle.make} ${currentVehicle.model}` : t('d_veh_no_assigned', 'No Vehicle Assigned');
  const vehiclePlate = currentVehicle?.license_plate || 'N/A';
  const vehicleVin = currentVehicle?.vin || 'N/A';

  const vehicleInfo = [
    { label: t('d_veh_make', 'Make & Model'), value: vehicleName, icon: 'car-sport-outline' },
    { label: t('d_veh_plate', 'License Plate'), value: vehiclePlate, icon: 'barcode-outline' },
    { label: t('d_veh_vin', 'VIN'), value: vehicleVin, icon: 'finger-print-outline' },
    { label: t('d_veh_odo', 'Odometer'), value: currentVehicle?.odometer ? `${currentVehicle.odometer} mi` : (currentVehicle ? 'N/A' : '0 mi'), icon: 'speedometer-outline' },
    { label: t('d_veh_fuel_level', 'Fuel Level'), value: currentVehicle ? `${fuelLevel}%` : '0%', icon: 'water-outline' },
    { label: t('d_veh_last_service', 'Last Service'), value: currentVehicle?.last_service ? new Date(currentVehicle.last_service).toLocaleDateString() : 'N/A', icon: 'build-outline' },
  ];
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('d_veh_title', 'Vehicle Details')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            {currentVehicle?.image_url ? (
              <Image 
                source={{ uri: currentVehicle.image_url }} 
                style={{ width: 80, height: 80, borderRadius: 40 }} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.iconCircle}>
                <Ionicons name="bus" size={32} color="#043094" />
              </View>
            )}
            <View style={[styles.statusBadge, !currentVehicle && { backgroundColor: '#F3F4F6' }]}>
              <Text style={[styles.statusText, !currentVehicle && { color: '#6B7280' }]}>
                {currentVehicle ? t('d_veh_active', 'Active') : t('d_veh_unassigned', 'Unassigned')}
              </Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{vehicleName}</Text>
          <Text style={styles.heroSubtitle}>{currentVehicle ? t('d_veh_current', 'Current Active Vehicle') : t('d_veh_no_assigned', 'No Vehicle Assigned')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('d_veh_specs', 'Specifications & Status')}</Text>
        <View style={styles.infoCard}>
          {vehicleInfo.map((item, index) => (
            <View key={index} style={[styles.infoRow, index === vehicleInfo.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.infoRowLeft}>
                <Ionicons name={item.icon as any} size={20} color="#6B7280" />
                <Text style={styles.infoLabel}>{item.label}</Text>
              </View>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('d_veh_recent_issues', 'Recent Issues')}</Text>
        <View style={styles.issuesCard}>
          {issues.map((issue, index) => (
            <View key={issue.id} style={[styles.issueItem, index === issues.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.issueHeader}>
                <Text style={styles.issueType}>{issue.type}</Text>
                <Text style={[styles.issueStatus, issue.status === 'Resolved' ? styles.statusResolved : styles.statusPending]}>
                  {issue.status}
                </Text>
              </View>
              <Text style={styles.issueDesc}>{issue.desc}</Text>
              <Text style={styles.issueDate}>{issue.date}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { marginRight: 16, padding: 4 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  content: { padding: 20, paddingBottom: 40 },
  heroCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3, alignItems: 'center' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', marginBottom: 16 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  statusBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { color: '#059669', fontSize: 13, fontWeight: '700' },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  heroSubtitle: { fontSize: 15, color: '#6B7280' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12, marginLeft: 4 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 15, color: '#4B5563', marginLeft: 12, fontWeight: '500' },
  infoValue: { fontSize: 15, color: '#111827', fontWeight: '600' },
  issuesCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  issueItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  issueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  issueType: { fontSize: 15, fontWeight: '600', color: '#111827' },
  issueStatus: { fontSize: 12, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusResolved: { backgroundColor: '#D1FAE5', color: '#059669' },
  statusPending: { backgroundColor: '#FEF3C7', color: '#D97706' },
  issueDesc: { fontSize: 14, color: '#4B5563', marginBottom: 6 },
  issueDate: { fontSize: 13, color: '#9CA3AF' },
});
