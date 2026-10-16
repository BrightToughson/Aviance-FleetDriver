import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { assignments, updateAssignmentStatus, updateAssignmentLocation } = useAssignments();
  
  const assignment = assignments.find(a => a.id === id);
  const [tripStarted, setTripStarted] = useState(assignment?.status === 'In Progress');
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 },
        (loc) => {
          const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserLocation(coords);
          if (assignment?.status === 'In Progress') {
            updateAssignmentLocation(id as string, coords).catch(console.warn);
          }
        }
      );
    })();
    return () => {
      if (subscription) subscription.remove();
    };
  }, [assignment?.status, id, updateAssignmentLocation]);

  useEffect(() => {
    if (assignment?.pickupCoords && assignment?.dropoffCoords) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${assignment.pickupCoords.longitude},${assignment.pickupCoords.latitude};${assignment.dropoffCoords.longitude},${assignment.dropoffCoords.latitude}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map((c: any) => ({ latitude: c[1], longitude: c[0] }));
            setRouteCoords(coords);
          } else {
            setRouteCoords([assignment.pickupCoords, assignment.dropoffCoords]);
          }
        })
        .catch(() => {
          setRouteCoords([assignment.pickupCoords, assignment.dropoffCoords]);
        });
    }
  }, [assignment?.pickupCoords, assignment?.dropoffCoords]);

  if (!assignment) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{t('d_trip_not_found', 'Trip not found')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>{t('d_trip_go_back', 'Go Back')}</Text>
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
        <Text style={styles.title}>{t('d_trip_active_title', 'Active Trip')}</Text>
      </View>

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (() => {
          const srcDoc = `
            <!DOCTYPE html>
            <html>
            <head>
              <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
              <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
              <style> body { margin: 0; padding: 0; } #map { width: 100vw; height: 100vh; } </style>
            </head>
            <body>
              <div id="map"></div>
              <script>
                var map = L.map('map');
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
                var p1 = [${assignment.pickupCoords.latitude}, ${assignment.pickupCoords.longitude}];
                var p2 = [${assignment.dropoffCoords.latitude}, ${assignment.dropoffCoords.longitude}];
                var hasUserLoc = ${userLocation ? 'true' : 'false'};
                var u1 = hasUserLoc ? [${userLocation?.latitude || 0}, ${userLocation?.longitude || 0}] : null;
                
                var blueIcon = new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                });
                var greenIcon = new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                });
                var blackIcon = new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                });

                L.marker(p1, {icon: blueIcon}).addTo(map).bindPopup("Pickup");
                L.marker(p2, {icon: greenIcon}).addTo(map).bindPopup("Drop-off");
                
                if (hasUserLoc) {
                  L.marker(u1, {icon: blackIcon}).addTo(map).bindPopup("Your Location");
                  L.polyline([u1, p1], {color: '#6B7280', weight: 2, dashArray: '5, 5'}).addTo(map);
                }
                
                fetch('https://router.project-osrm.org/route/v1/driving/' + p1[1] + ',' + p1[0] + ';' + p2[1] + ',' + p2[0] + '?overview=full&geometries=geojson')
                  .then(res => res.json())
                  .then(data => {
                    var coords = [p1, p2];
                    if(data.routes && data.routes[0]) {
                      coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    }
                    var polyline = L.polyline(coords, {color: '#043094', weight: 4}).addTo(map);
                    
                    var bounds = polyline.getBounds();
                    if (hasUserLoc) bounds.extend(u1);
                    
                    setTimeout(function(){ map.invalidateSize(); map.fitBounds(bounds, { padding: [30, 30] }); }, 400);
                  })
                  .catch(() => {
                    var polyline = L.polyline([p1, p2], {color: '#043094', weight: 4}).addTo(map);
                    var bounds = polyline.getBounds();
                    if (hasUserLoc) bounds.extend(u1);
                    setTimeout(function(){ map.invalidateSize(); map.fitBounds(bounds, { padding: [30, 30] }); }, 400);
                  });
              </script>
            </body>
            </html>
          `;
          return (
            <WebIframe 
              srcDoc={srcDoc} 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
            />
          );
        })() : (
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
                title={t('d_trip_your_loc', 'Your Location')}
                pinColor="#3B82F6"
              />
            )}
            <Marker 
              coordinate={assignment.pickupCoords}
              title={t('d_trip_pickup', 'Pickup')}
              description={assignment.pickupLocation}
              pinColor="#043094"
            />
            <Marker 
              coordinate={assignment.dropoffCoords}
              title={t('d_trip_dropoff', 'Drop-off')}
              description={assignment.dropoffLocation}
              pinColor="#10B981"
            />
            {(userLocation || assignment.pickupCoords) && (
              <>
                {/* Optional straight line from driver to pickup */}
                {userLocation && (
                  <Polyline 
                    coordinates={[userLocation, assignment.pickupCoords]}
                    strokeColor="#6B7280"
                    strokeWidth={2}
                    lineDashPattern={[5, 5]}
                  />
                )}
                {/* Actual driving route from pickup to dropoff */}
                <Polyline 
                  coordinates={routeCoords.length > 0 ? routeCoords : [assignment.pickupCoords, assignment.dropoffCoords]}
                  strokeColor="#043094"
                  strokeWidth={4}
                />
              </>
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
              <Text style={styles.stopName}>{t('d_trip_pickup', 'Pickup Location')}</Text>
              <Text style={styles.stopTime}>{assignment.pickupLocation}</Text>
            </View>
          </View>
          
          <View style={styles.stopItem}>
            <View style={styles.dotContainer}>
              <View style={styles.dotPending} />
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopName}>{t('d_trip_dropoff', 'Drop-off Location')}</Text>
              <Text style={styles.stopTime}>{assignment.dropoffLocation}</Text>
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
            <Text style={styles.startBtnText}>{t('d_trip_start_nav', 'Start Navigation')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeActions}>
            <TouchableOpacity style={styles.reportBtn} onPress={() => router.push('/(driver)/issues')}>
              <Text style={styles.reportBtnText}>{t('d_trip_report_issue', 'Report Issue')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.completeBtn} onPress={() => {
              updateAssignmentStatus(id as string, 'Completed');
              alert(t('d_trip_completed_alert', 'Trip completed!'));
              router.push('/(driver)/dashboard');
            }}>
              <Text style={styles.completeBtnText}>{t('d_trip_complete_trip', 'Complete Trip')}</Text>
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
  
  mapContainer: { height: Dimensions.get('window').height * 0.4, backgroundColor: '#E5E7EB' },
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
