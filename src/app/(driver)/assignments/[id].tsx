import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
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

export default function AssignmentDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { assignments } = useAssignments();
  
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(driver)/assignments');
    }
  };
  
  const assignment = assignments.find(a => a.id === id);

  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

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
        <Text style={styles.errorText}>{t('d_assign_not_found', 'Assignment not found')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
          <Text style={styles.backBtnText}>{t('d_assign_go_back', 'Go Back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('d_assign_details_title', 'Assignment Details')}</Text>
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
            <Text style={styles.infoLabel}>{t('d_assign_lbl_vehicle', 'Vehicle')}</Text>
            <Text style={styles.infoValue}>{assignment.vehicle}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color="#043094" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>{t('d_assign_lbl_schedule', 'Schedule')}</Text>
            <Text style={styles.infoValue}>{assignment.time}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#043094" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>{t('d_assign_lbl_stops', 'Stops')}</Text>
            <Text style={styles.infoValue}>{t('d_assign_stops_count', '{{count}} Locations', { count: 2 })}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('d_assign_route_preview', 'Route Preview')}</Text>
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
                latitude: (assignment.pickupCoords.latitude + assignment.dropoffCoords.latitude) / 2,
                longitude: (assignment.pickupCoords.longitude + assignment.dropoffCoords.longitude) / 2,
                latitudeDelta: Math.max(Math.abs(assignment.pickupCoords.latitude - assignment.dropoffCoords.latitude) * 2, 0.05),
                longitudeDelta: Math.max(Math.abs(assignment.pickupCoords.longitude - assignment.dropoffCoords.longitude) * 2, 0.05),
              }}
            >
              {userLocation && (
                <Marker 
                  coordinate={userLocation}
                  title={t('d_assign_your_loc', 'Your Location')}
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
              {userLocation && (
                <Polyline 
                  coordinates={[userLocation, assignment.pickupCoords]}
                  strokeColor="#6B7280"
                  strokeWidth={2}
                  lineDashPattern={[5, 5]}
                />
              )}
              <Polyline 
                coordinates={routeCoords.length > 0 ? routeCoords : [assignment.pickupCoords, assignment.dropoffCoords]}
                strokeColor="#043094"
                strokeWidth={4}
              />
            </MapView>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('d_assign_notes_title', 'Notes & Instructions')}</Text>
        <View style={styles.notesCard}>
          <Text style={styles.notesText}>
            {assignment.notes || t('d_assign_default_notes', 'No special instructions provided.')}
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push(`/(driver)/trip/${assignment.id}` as any)}>
          <Text style={styles.primaryBtnText}>
            {assignment.status === 'In Progress' ? t('d_assign_btn_resume', 'Resume') : t('d_assign_btn_start', 'Start')}
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
  mapContainer: { height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 4 },
  map: { width: '100%', height: '100%' },
  notesCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  notesText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },

  actionContainer: { marginTop: 10 },
  primaryBtn: { backgroundColor: '#043094', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#043094', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
