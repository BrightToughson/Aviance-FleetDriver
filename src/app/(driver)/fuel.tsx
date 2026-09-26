import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import VehicleSelector from '../../components/VehicleSelector';
import { useVehicle } from '../../context/VehicleContext';

export default function FuelScreen() {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState('');
  const [odometer, setOdometer] = useState('');
  const [gallons, setGallons] = useState('');
  const [cost, setCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const { addFuelGallons, fuelLogs, addFuelLog } = useVehicle();

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("Permission to access camera is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!odometer.trim() || !gallons.trim() || !cost.trim() || !receiptImage) {
      alert('Please fill in all required fields and upload a receipt photo.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const addedGallons = parseFloat(gallons.trim()) || 0;
      addFuelGallons(addedGallons);
      
      const newLog = {
        id: Math.random().toString(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        gallons: gallons.trim(),
        cost: cost.trim()
      };
      addFuelLog(newLog);

      alert(`Fuel Log Submitted! Added ${addedGallons} gallons.`);
      setIsSubmitting(false);
      setVehicleId('');
      setOdometer('');
      setGallons('');
      setCost('');
      setReceiptImage(null);
      router.replace('/(driver)/dashboard');
    }, 1000);
  };



  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!vehicleId ? (
        <View style={styles.selectorContainer}>
          <VehicleSelector onSelect={setVehicleId} currentVehicleId="2022 Ford Transit (XYZ-1234)" />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <TouchableOpacity onPress={() => router.replace('/(driver)/dashboard')} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Log Fuel</Text>
          </View>
          <Text style={styles.subtitle}>Record your recent fuel purchases</Text>

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.label}>Vehicle</Text>
          <TouchableOpacity onPress={() => setVehicleId('')}>
            <Text style={{ color: '#043094', fontWeight: '600', fontSize: 14 }}>Change</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.readonlyInput}>
          <Text style={styles.readonlyText}>{vehicleId}</Text>
        </View>

        <Text style={styles.label}>Current Odometer *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. 45,200" 
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
          value={odometer}
          onChangeText={setOdometer}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Gallons / Liters *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0.00" 
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              value={gallons}
              onChangeText={setGallons}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>Total Cost (GH₵) *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0.00" 
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              value={cost}
              onChangeText={setCost}
            />
          </View>
        </View>

        <Text style={styles.label}>Upload Receipt *</Text>
        {receiptImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: receiptImage }} style={styles.receiptPreview} />
            <TouchableOpacity style={styles.retakeBtn} onPress={handleTakePhoto}>
              <Text style={styles.retakeBtnText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBtn} onPress={handleTakePhoto}>
            <Ionicons name="camera-outline" size={24} color="#043094" />
            <Text style={styles.uploadText}>Take Photo</Text>
          </TouchableOpacity>
        )}

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && { backgroundColor: '#9CA3AF' }]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitBtnText}>{isSubmitting ? 'Submitting...' : 'Submit Fuel Log'}</Text>
          </TouchableOpacity>
        </View>
        </>
      )}

      <Text style={[styles.sectionTitle, !vehicleId && { marginTop: 24 }]}>Recent Logs</Text>
      <View style={styles.historyCard}>
        {fuelLogs.map((log, index) => (
          <View key={log.id} style={[styles.historyRow, index === fuelLogs.length - 1 && { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.historyDate}>{log.date}</Text>
              <Text style={styles.historySub}>{log.gallons} Gallons</Text>
            </View>
            <Text style={styles.historyPrice}>GH₵{log.cost}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20 },
  selectorContainer: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  readonlyInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12 },
  readonlyText: { color: '#6B7280', fontSize: 15 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 15, color: '#111827' },
  row: { flexDirection: 'row' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderStyle: 'dashed', borderRadius: 8, padding: 16, marginTop: 8 },
  uploadText: { fontSize: 15, fontWeight: '600', color: '#043094', marginLeft: 8 },
  submitBtn: { backgroundColor: '#043094', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  historyDate: { fontSize: 15, fontWeight: '600', color: '#374151' },
  historySub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  historyPrice: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  imageContainer: { marginTop: 8, alignItems: 'center' },
  receiptPreview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 10, resizeMode: 'cover' },
  retakeBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retakeBtnText: { color: '#374151', fontWeight: '600' }
});


