import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { useVehicle } from '../context/VehicleContext';

interface VehicleSelectorProps {
  onSelect: (vehicleId: string) => void;
  currentVehicleId?: string;
}

export default function VehicleSelector({ onSelect, currentVehicleId }: VehicleSelectorProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentVehicle } = useVehicle();
  
  const defaultVehicle = currentVehicle ? `${currentVehicle.make} ${currentVehicle.model}` : t('d_dash_no_vehicle', 'No Vehicle Assigned');
  const displayVehicleId = currentVehicleId || defaultVehicle;

  const [manualId, setManualId] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleBarCodeScanned = ({ type, data }: any) => {
    setShowScanner(false);
    onSelect(data);
  };

  if (showScanner) {
    if (Platform.OS !== 'web') {
      if (!permission) {
        return <View style={styles.center}><Text>{t('vs_loading_cam', 'Loading camera permissions...')}</Text></View>;
      }
      if (!permission.granted) {
        return (
          <View style={styles.center}>
            <Text style={{ marginBottom: 15, fontSize: 16 }}>{t('vs_need_cam', 'We need camera access to scan codes.')}</Text>
            <TouchableOpacity 
              onPress={() => {
                if (permission.canAskAgain) {
                  requestPermission();
                } else {
                  Linking.openSettings();
                }
              }} 
              style={styles.btn}
            >
              <Text style={styles.btnText}>
                {permission.canAskAgain ? t('vs_grant_perm', 'Grant Permission') : t('vs_open_settings', 'Open Settings')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowScanner(false)} style={[styles.btn, { marginTop: 10, backgroundColor: '#6B7280' }]}>
              <Text style={styles.btnText}>{t('vs_go_back', 'Go Back')}</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }
    return (
      <View style={styles.scannerContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.webFallback}>
            <Ionicons name="qr-code-outline" size={100} color="#D1D5DB" />
            <Text style={styles.webFallbackText}>{t('vs_cam_not_supp', 'Camera not supported on Web Simulator.')}</Text>
            <TouchableOpacity 
              style={styles.mockScanBtn} 
              onPress={() => handleBarCodeScanned({ type: 'mock', data: 'SCANNED-VEHICLE-001' })}
            >
              <Text style={styles.mockScanText}>{t('vs_sim_scan', 'Simulate Successful Scan')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowScanner(false)} style={[styles.btn, { marginTop: 20 }]}>
              <Text style={styles.btnText}>{t('vs_cancel', 'Cancel')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={StyleSheet.absoluteFill}>
            <CameraView
              style={StyleSheet.absoluteFill as any}
              facing="back"
              onBarcodeScanned={handleBarCodeScanned}
            />
            <View style={[StyleSheet.absoluteFill, styles.overlay, { zIndex: 10 }]}>
              <View style={styles.scanTarget} />
              <Text style={styles.scanText}>{t('vs_align_qr', 'Align QR code to scan vehicle')}</Text>
              <TouchableOpacity onPress={() => setShowScanner(false)} style={styles.cancelScanBtn}>
                <Text style={styles.btnText}>{t('vs_cancel_scan', 'Cancel Scan')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <TouchableOpacity onPress={() => router.replace('/(driver)/dashboard')} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('vs_title', 'Select a Vehicle')}</Text>
      </View>
      <Text style={styles.subtitle}>{t('vs_subtitle', 'You must select a vehicle before filling out this form.')}</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>{t('vs_current', 'Your Current Vehicle')}</Text>
        <TouchableOpacity style={styles.currentVehicleBtn} onPress={() => {
          if (currentVehicle) {
            onSelect(currentVehicle.id);
          } else if (currentVehicleId) {
            onSelect(currentVehicleId);
          }
        }}>
          <Ionicons name="car-outline" size={24} color="#043094" />
          <Text style={styles.currentVehicleText}>{displayVehicleId}</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>{t('vs_or', 'OR')}</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity style={styles.scanBtn} onPress={() => setShowScanner(true)}>
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
          <Text style={styles.scanBtnText}>{t('vs_scan_btn', 'Scan QR Code on Car')}</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>{t('vs_or', 'OR')}</Text>
          <View style={styles.line} />
        </View>

        <Text style={styles.label}>{t('vs_type_lbl', 'Type Vehicle Plate or ID')}</Text>
        <View style={styles.inputRow}>
          <TextInput 
            style={styles.input}
            placeholder={t('vs_type_ph', 'e.g. XYZ-1234')}
            placeholderTextColor="#9CA3AF"
            value={manualId}
            onChangeText={setManualId}
          />
          <TouchableOpacity 
            style={[styles.btn, !manualId.trim() && styles.btnDisabled]} 
            onPress={() => manualId.trim() && onSelect(manualId)}
            disabled={!manualId.trim()}
          >
            <Text style={styles.btnText}>{t('vs_proceed', 'Proceed')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { },
  scannerContainer: { height: 400, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  currentVehicleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  currentVehicleText: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600', color: '#1E3A8A' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  orText: { marginHorizontal: 12, color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#043094', padding: 16, borderRadius: 8 },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 14, fontSize: 16, color: '#111827', marginRight: 12 },
  btn: { backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 8, justifyContent: 'center' },
  btnDisabled: { backgroundColor: '#D1D5DB' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  center: { height: 400, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  scanTarget: { width: 250, height: 250, borderWidth: 2, borderColor: '#10B981', backgroundColor: 'transparent', borderRadius: 12 },
  scanText: { color: '#fff', marginTop: 30, fontSize: 16, fontWeight: '600' },
  cancelScanBtn: { marginTop: 30, backgroundColor: '#EF4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  webFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  webFallbackText: { color: '#9CA3AF', marginTop: 20, fontSize: 16 },
  mockScanBtn: { marginTop: 30, backgroundColor: '#043094', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  mockScanText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
