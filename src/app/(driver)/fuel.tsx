import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import VehicleSelector from '../../components/VehicleSelector';
import { useVehicle } from '../../context/VehicleContext';
import { uploadFileToSupabase } from '../../lib/uploadImage';

export default function FuelScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { addFuelGallons, fuelLogs, addFuelLog, currentVehicle } = useVehicle();
  const [vehicleId, setVehicleId] = useState(currentVehicle?.id || '');
  const [odometer, setOdometer] = useState('');
  const [gallons, setGallons] = useState('');
  const [cost, setCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // Auto-select assigned vehicle when currentVehicle is loaded
  useEffect(() => {
    if (currentVehicle?.id && !vehicleId) {
      setVehicleId(currentVehicle.id);
    }
  }, [currentVehicle?.id]);

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        // Fallback to media library if camera permission denied
        handlePickPhoto();
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setReceiptImage(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Camera failed, falling back to library picker:', e);
      handlePickPhoto();
    }
  };

  const handlePickPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setReceiptImage(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Photo picker error:', e);
    }
  };

  const handleSubmit = async () => {
    if (!odometer.trim() || !gallons.trim() || !cost.trim()) {
      alert(t('d_fuel_req_err', 'Please fill in all required fields (Odometer, Gallons, and Cost).'));
      return;
    }

    setIsSubmitting(true);
    try {
      const addedGallons = parseFloat(gallons.trim()) || 0;
      
      let uploadedReceiptUrl: string | null = null;
      if (receiptImage) {
        try {
          uploadedReceiptUrl = await uploadFileToSupabase(receiptImage, 'media');
        } catch (uploadErr) {
          console.warn('Receipt upload to storage failed, proceeding with log:', uploadErr);
        }
      }

      const newLog = {
        id: Math.random().toString(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        gallons: gallons.trim(),
        cost: cost.trim(),
        vehicleId: vehicleId || currentVehicle?.id || undefined,
        odometer: odometer.trim(),
        receiptImage: uploadedReceiptUrl || receiptImage,
      };

      const result = await addFuelLog(newLog);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save fuel log to database.');
      }

      await addFuelGallons(addedGallons);

      alert(t('d_fuel_success_msg', 'Fuel Log Submitted! Added {{gallons}} gallons.', { gallons: addedGallons }));
      setOdometer('');
      setGallons('');
      setCost('');
      setReceiptImage(null);
      router.replace('/(driver)/dashboard');
    } catch (err: any) {
      console.error('Fuel log submit error:', err);
      alert(`Could not save fuel log: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!vehicleId ? (
        <View style={styles.selectorContainer}>
          <VehicleSelector onSelect={setVehicleId} />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <TouchableOpacity onPress={() => router.replace('/(driver)/dashboard')} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>{t('d_fuel_title', 'Log Fuel')}</Text>
          </View>
          <Text style={styles.subtitle}>{t('d_fuel_subtitle', 'Record your recent fuel purchases')}</Text>

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.label}>{t('d_fuel_lbl_vehicle', 'Vehicle')}</Text>
          <TouchableOpacity onPress={() => setVehicleId('')}>
            <Text style={{ color: '#043094', fontWeight: '600', fontSize: 14 }}>{t('common_change', 'Change')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.readonlyInput}>
          <Text style={styles.readonlyText}>{currentVehicle ? `${currentVehicle.name || ''} (${currentVehicle.make || ''} ${currentVehicle.model || ''})` : vehicleId}</Text>
        </View>

        <Text style={styles.label}>{t('d_fuel_lbl_odo', 'Current Odometer *')}</Text>
        <TextInput 
          style={styles.input} 
          placeholder={t('d_fuel_odo_placeholder', 'e.g. 45,200')} 
          keyboardType="numeric"
          placeholderTextColor="#9CA3AF"
          value={odometer}
          onChangeText={setOdometer}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>{t('d_fuel_lbl_gallons', 'Gallons / Liters *')}</Text>
            <TextInput 
              style={styles.input} 
              placeholder={t('d_fuel_gallons_placeholder', '0.00')} 
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              value={gallons}
              onChangeText={setGallons}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>{t('d_fuel_lbl_cost', 'Total Cost (GH₵) *')}</Text>
            <TextInput 
              style={styles.input} 
              placeholder={t('d_fuel_cost_placeholder', '0.00')} 
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              value={cost}
              onChangeText={setCost}
            />
          </View>
        </View>

        <Text style={styles.label}>{t('d_fuel_lbl_receipt', 'Upload Receipt (Optional)')}</Text>
        {receiptImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: receiptImage }} style={styles.receiptPreview} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.retakeBtn} onPress={handleTakePhoto}>
                <Text style={styles.retakeBtnText}>{t('d_fuel_retake', 'Camera')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.retakeBtn} onPress={handlePickPhoto}>
                <Text style={styles.retakeBtnText}>Choose File</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.retakeBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => setReceiptImage(null)}>
                <Text style={[styles.retakeBtnText, { color: '#DC2626' }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TouchableOpacity style={[styles.uploadBtn, { flex: 1, marginTop: 0 }]} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={22} color="#043094" />
              <Text style={styles.uploadText}>{t('d_fuel_take', 'Take Photo')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.uploadBtn, { flex: 1, marginTop: 0 }]} onPress={handlePickPhoto}>
              <Ionicons name="image-outline" size={22} color="#043094" />
              <Text style={styles.uploadText}>Upload Image</Text>
            </TouchableOpacity>
          </View>
        )}

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && { backgroundColor: '#9CA3AF' }]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitBtnText}>{isSubmitting ? t('d_fuel_submitting', 'Submitting...') : t('d_fuel_submit', 'Submit Fuel Log')}</Text>
          </TouchableOpacity>
        </View>
        </>
      )}

      <Text style={[styles.sectionTitle, !vehicleId && { marginTop: 24 }]}>{t('d_fuel_recent', 'Recent Logs')}</Text>
      <View style={styles.historyCard}>
        {fuelLogs.map((log, index) => (
          <View key={log.id} style={[styles.historyRow, index === fuelLogs.length - 1 && { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.historyDate}>{log.date}</Text>
              <Text style={styles.historySub}>{log.gallons} {t('d_fuel_gallons_unit', 'Gallons')}</Text>
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


