import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSchedules } from '../../context/SchedulesContext';
import { useAssignments } from '../../context/AssignmentsContext';
import { useVehicle } from '../../context/VehicleContext';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/expo';
import { supabase } from '../../lib/supabase';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { schedules } = useSchedules();
  const { assignments } = useAssignments();
  const { fuelLevel, currentVehicle } = useVehicle();
  const { user } = useUser();
  const [hasManager, setHasManager] = useState<boolean | null>(true);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [licenseExpiryInfo, setLicenseExpiryInfo] = useState<{
    text: string;
    daysLeft: number;
    isUrgent: boolean;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    if (user?.id) {
      const checkManager = async () => {
        try {
          const { data, error } = await supabase.from('profiles').select('manager_id').eq('id', user.id).maybeSingle();
          if (error) {
             setHasManager(false);
             return;
          }
          if (data?.manager_id) {
            setHasManager(true);
            const { data: managerData } = await supabase.from('profiles').select('full_name').eq('id', data.manager_id).maybeSingle();
            if (managerData) setManagerName(managerData.full_name);
          } else {
            setHasManager(false);
          }
        } catch (e) {
          console.error(e);
          setHasManager(false);
        }
      };

      const checkLicense = async () => {
        try {
          const { data } = await supabase
            .from('driver_details')
            .select('license_expiry')
            .eq('profile_id', user.id)
            .maybeSingle();

          if (data?.license_expiry) {
            const expDate = new Date(data.license_expiry);
            if (!isNaN(expDate.getTime())) {
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const formatted = expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              
              if (diffDays <= 30) {
                setLicenseExpiryInfo({
                  text: formatted,
                  daysLeft: diffDays,
                  isUrgent: true,
                  isExpired: diffDays < 0,
                });
              } else {
                setLicenseExpiryInfo(null);
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      };

      checkManager();
      checkLicense();

      // Listen to profile updates
      const channel = supabase.channel('driver_profile_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          () => {
            checkManager();
          }
        )
        .subscribe();

      // Listen to driver_details updates
      const detailsChannel = supabase.channel('driver_details_dashboard_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'driver_details', filter: `profile_id=eq.${user.id}` },
          () => {
            checkLicense();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(detailsChannel);
      };
    }
  }, [user?.id]);

  const quickActions = [
    { name: t('d_dash_action_start', 'Start Trip'), icon: 'play', color: '#10B981', route: '/(driver)/assignments' },
    { name: t('d_dash_action_issue', 'Report Issue'), icon: 'warning', color: '#EF4444', route: '/(driver)/issues' },
    { name: t('d_dash_action_fuel', 'Log Fuel'), icon: 'water', color: '#3B82F6', route: '/(driver)/fuel' },
    { name: t('d_dash_action_inspect', 'Inspection'), icon: 'clipboard', color: '#8B5CF6', route: '/(driver)/inspections' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{t('d_dash_greeting', 'Good Morning, Driver!')}</Text>
        <Text style={styles.date}>{new Date().toDateString()}</Text>
      </View>

      {hasManager === false && (
        <View style={styles.noFleetBanner}>
          <Ionicons name="warning" size={24} color="#B45309" />
          <View style={styles.noFleetTextContainer}>
            <Text style={styles.noFleetTitle}>Not Connected to a Fleet</Text>
            <Text style={styles.noFleetDesc}>You aren't assigned to a fleet. Join one to receive assignments.</Text>
          </View>
          <TouchableOpacity 
            style={styles.joinFleetBtn}
            onPress={() => router.push({ pathname: '/(driver)/profile', params: { join: 'true' } } as any)}
          >
            <Text style={styles.joinFleetBtnText}>Join Fleet</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasManager === true && managerName && (
        <View style={styles.fleetSummaryBanner}>
          <Ionicons name="business" size={20} color="#043094" />
          <View style={styles.fleetSummaryTextContainer}>
            <Text style={styles.fleetSummaryText}>Connected to <Text style={{fontWeight: '700'}}>{managerName}</Text>'s Fleet</Text>
          </View>
        </View>
      )}

      {licenseExpiryInfo && (
        <View style={[
          styles.noFleetBanner, 
          licenseExpiryInfo.isExpired 
            ? { backgroundColor: '#FEF2F2', borderColor: '#FECACA' } 
            : { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }
        ]}>
          <Ionicons 
            name={licenseExpiryInfo.isExpired ? "alert-circle" : "time"} 
            size={24} 
            color={licenseExpiryInfo.isExpired ? "#EF4444" : "#D97706"} 
          />
          <View style={styles.noFleetTextContainer}>
            <Text style={[
              styles.noFleetTitle, 
              { color: licenseExpiryInfo.isExpired ? "#991B1B" : "#92400E" }
            ]}>
              {licenseExpiryInfo.isExpired 
                ? "Driver License Expired!" 
                : `License Expiring Soon (${licenseExpiryInfo.daysLeft} ${licenseExpiryInfo.daysLeft === 1 ? 'day' : 'days'} left)`}
            </Text>
            <Text style={[
              styles.noFleetDesc, 
              { color: licenseExpiryInfo.isExpired ? "#B91C1C" : "#B45309" }
            ]}>
              {licenseExpiryInfo.isExpired 
                ? `Your driver license expired on ${licenseExpiryInfo.text}. Please update it to avoid driving suspensions.` 
                : `Your driver license will expire on ${licenseExpiryInfo.text}. Please renew and update your profile.`}
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.joinFleetBtn, 
              licenseExpiryInfo.isExpired ? { backgroundColor: '#EF4444' } : { backgroundColor: '#D97706' }
            ]}
            onPress={() => router.push('/(driver)/profile' as any)}
          >
            <Text style={styles.joinFleetBtnText}>View</Text>
          </TouchableOpacity>
        </View>
      )}

      {(() => {
        const vehicleName = currentVehicle ? (currentVehicle.name || `${currentVehicle.make} ${currentVehicle.model}`) : t('d_dash_no_vehicle', 'No Vehicle Assigned');
        const vehiclePlate = currentVehicle?.license_plate ? t('d_dash_plate', 'Plate: ') + currentVehicle.license_plate : '';

        return (
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(driver)/vehicle-details' as any)} disabled={!currentVehicle}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t('d_dash_curr_vehicle', 'Current Vehicle')}</Text>
              <View style={[styles.statusBadge, !currentVehicle && { backgroundColor: '#F3F4F6' }]}>
                <Text style={[styles.statusText, !currentVehicle && { color: '#6B7280' }]}>
                  {currentVehicle ? t('d_dash_assigned', 'Assigned') : t('d_dash_none', 'None')}
                </Text>
              </View>
            </View>
            <View style={styles.vehicleInfo}>
              {currentVehicle?.image_url ? (
                <Image 
                  source={{ uri: currentVehicle.image_url }} 
                  style={{ width: 60, height: 60, borderRadius: 6, marginRight: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' }} 
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="car-sport" size={48} color={currentVehicle ? "#043094" : "#9CA3AF"} />
              )}
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleName}>{vehicleName}</Text>
                {!!vehiclePlate && <Text style={styles.vehiclePlate}>{vehiclePlate}</Text>}
                {!!currentVehicle && <Text style={styles.vehicleFuel}>{t('d_dash_fuel', 'Fuel: ')}{fuelLevel}%</Text>}
              </View>
            </View>
          </TouchableOpacity>
        );
      })()}

      <Text style={styles.sectionTitle}>{t('d_dash_quick_actions', 'Quick Actions')}</Text>
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

      <Text style={styles.sectionTitle}>{t('d_dash_today_schedule', "Today's Schedule")}</Text>
      <View style={styles.card}>
        {schedules.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#6B7280', padding: 20 }}>{t('d_dash_no_schedules', 'No schedules created.')}</Text>
        ) : (
          schedules.slice(0, 3).map((schedule, index) => (
            <View key={schedule.id} style={[styles.scheduleItem, index === Math.min(2, schedules.length - 1) && { borderBottomWidth: 0 }]}>
              <View style={styles.timeBox}>
                <Text style={styles.timeText}>{schedule.dueDate.split(',')[0] || t('d_dash_anytime', 'Anytime')}</Text>
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

      <Text style={styles.sectionTitle}>{t('d_dash_today_assignments', "Today's Assignments")}</Text>
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
  noFleetBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#F59E0B' },
  noFleetTextContainer: { flex: 1, marginLeft: 12, marginRight: 12 },
  noFleetTitle: { fontSize: 16, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  noFleetDesc: { fontSize: 13, color: '#B45309', lineHeight: 18 },
  joinFleetBtn: { backgroundColor: '#B45309', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  joinFleetBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  fleetSummaryBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#C7D2FE' },
  fleetSummaryTextContainer: { marginLeft: 10 },
  fleetSummaryText: { fontSize: 14, color: '#043094' },
});
