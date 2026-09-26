import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAssignments } from '../../../context/AssignmentsContext';
import * as Location from 'expo-location';

let MapView: any = (props: any) => <View {...props} />;
let Marker: any = (props: any) => <View {...props} />;
let Polyline: any = (props: any) => <View {...props} />;
const WebIframe: any = Platform.OS === 'web' ? (props: any) => React.createElement('iframe', props) : () => null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
}

export default function TripScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { assignments, updateAssignmentStatus } = useAssignments();
  
  const assignment = assignments.find(a => a.id === id);
  const [tripStarted, setTripStarted] = useState(assignment?.status === 'In Progress');
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  if (!assignment) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Trip not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Active Trip</Text>
      </View>

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <WebIframe 
            src={`https://maps.google.com/maps?q=${userLocation ? `${userLocation.latitude},${userLocation.longitude}` : 'Accra,Ghana'}&t=&z=15&ie=UTF8&iwloc=&output=embed`} 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
          />
        ) : (
          <MapView 
            style={styles.map}
            region={userLocation ? {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            } : {
              latitude: 5.6037, // Accra, Ghana
              longitude: -0.1870,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {userLocation && (
              <Marker 
                coordinate={userLocation}
                title="Your Location"
                pinColor="#3B82F6"
              />
            )}
            <Marker 
              coordinate={{ latitude: 5.6037, longitude: -0.1870 }}
              title="Depot"
              description="Main Office"
              pinColor="#043094"
            />
            <Marker 
              coordinate={{ latitude: 5.6500, longitude: -0.1500 }}
              title="Next Stop"
              description="Customer A"
              pinColor="#10B981"
            />
            {userLocation && (
              <Polyline 
                coordinates={[
                  userLocation,
                  { latitude: 5.6037, longitude: -0.1870 },
                  { latitude: 5.6500, longitude: -0.1500 }
                ]}
                strokeColor="#043094"
                strokeWidth={4}
                lineDashPattern={[1]}
              />
            )}
          </MapView>
        )}
      </View>

      <ScrollView style={styles.tripDetails} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.routeName}>{assignment.routeName}</Text>
        <Text style={styles.vehicleText}>{assignment.vehicle}</Text>
        
        <View style={styles.stopsContainer}>
          <View style={styles.stopItem}>
            <View style={styles.dotContainer}>
              <View style={styles.dotCurrent} />
              <View style={styles.line} />
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopName}>Current Location</Text>
              <Text style={styles.stopTime}>Depot - Main Office</Text>
            </View>
          </View>
          
          <View style={styles.stopItem}>
            <View style={styles.dotContainer}>
              <View style={styles.dotPending} />
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopName}>Next Stop</Text>
              <Text style={styles.stopTime}>Customer A (ETA: 15 mins)</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {!tripStarted ? (
          <TouchableOpacity style={styles.startBtn} onPress={() => {
            setTripStarted(true);
            updateAssignmentStatus(id as string, 'In Progress');
          }}>
            <Text style={styles.startBtnText}>Start Navigation</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeActions}>
            <TouchableOpacity style={styles.reportBtn} onPress={() => router.push('/(driver)/issues')}>
              <Text style={styles.reportBtnText}>Report Issue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.completeBtn} onPress={() => {
              updateAssignmentStatus(id as string, 'Completed');
              alert('Trip completed!');
              router.push('/(driver)/dashboard');
            }}>
              <Text style={styles.completeBtnText}>Complete Trip</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  errorText: { fontSize: 18, color: '#6B7280', marginBottom: 20 },
  backBtn: { backgroundColor: '#043094', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: 'bold' },
  
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  backIcon: { padding: 8, marginRight: 12, backgroundColor: '#F3F4F6', borderRadius: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  
  mapContainer: { height: Platform.OS === 'web' ? Dimensions.get('window').height * 0.55 : Dimensions.get('window').height * 0.45, backgroundColor: '#E5E7EB' },
  map: { width: '100%', height: '100%' },
  
  tripDetails: { flex: 1, padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  routeName: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  vehicleText: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
  
  stopsContainer: { marginTop: 10 },
  stopItem: { flexDirection: 'row', marginBottom: 20 },
  dotContainer: { alignItems: 'center', width: 24, marginRight: 12 },
  dotCurrent: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#043094', borderWidth: 3, borderColor: '#DBEAFE', zIndex: 1 },
  dotPending: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D1D5DB' },
  line: { width: 2, height: 40, backgroundColor: '#E5E7EB', position: 'absolute', top: 14 },
  
  stopInfo: { flex: 1 },
  stopName: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 2 },
  stopTime: { fontSize: 14, color: '#6B7280' },
  
  bottomBar: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  startBtn: { backgroundColor: '#043094', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  startBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  activeActions: { flexDirection: 'row', gap: 12 },
  reportBtn: { flex: 1, backgroundColor: '#FEE2E2', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  reportBtnText: { color: '#DC2626', fontWeight: 'bold', fontSize: 16 },
  completeBtn: { flex: 2, backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  completeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
