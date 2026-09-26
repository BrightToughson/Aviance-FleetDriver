import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Image } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import VehicleSelector from '../../components/VehicleSelector';
import { useVehicle } from '../../context/VehicleContext';

export default function InspectionsScreen() {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState('');
  const [notes, setNotes] = useState('');
  const [fuelLevel, setFuelLevel] = useState('Full');
  const [fuelImage, setFuelImage] = useState<string | null>(null);
  const [issueLocation, setIssueLocation] = useState('None');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addInspection, inspections } = useVehicle();
  
  // Checklist State
  const [checklist, setChecklist] = useState({
    tires: false,
    lights: false,
    brakes: false,
    fluids: false,
    body: false,
    mirrors: false,
    wipers: false,
    horn: false,
    emergency: false,
    battery: false,
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAttachPhoto = async () => {
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
      setFuelImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!vehicleId.trim()) {
      alert("Please enter a Vehicle ID.");
      return;
    }
    
    if (!fuelImage) {
      alert("Please take a photo of the dashboard as proof of the fuel level.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'inspections'), {
        vehicleId,
        driverId: 'mock_driver_123',
        driverEmail: 'driver@aviance.com',
        date: new Date().toISOString(),
        tires: checklist.tires,
        lights: checklist.lights,
        brakes: checklist.brakes,
        fluids: checklist.fluids,
        body: checklist.body,
        mirrors: checklist.mirrors,
        wipers: checklist.wipers,
        horn: checklist.horn,
        emergency: checklist.emergency,
        battery: checklist.battery,
        fuelLevel,
        issueLocation,
        notes,
      });

      const hasDefects = issueLocation !== 'None' || notes.trim() !== '';
      addInspection({
        id: Math.random().toString(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: hasDefects ? 'Failed' : 'Passed',
        vehicle: vehicleId
      });

      alert('Inspection Submitted Successfully!');
      // Reset form
      setVehicleId('');
      setNotes('');
      setFuelLevel('Full');
      setFuelImage(null);
      setChecklist({ tires: false, lights: false, brakes: false, fluids: false, body: false, mirrors: false, wipers: false, horn: false, emergency: false, battery: false });
      router.replace('/(driver)/dashboard');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('Failed to submit inspection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {!vehicleId ? (
        <View style={styles.selectorContainer}>
          <VehicleSelector onSelect={setVehicleId} currentVehicleId="2022 Ford Transit (XYZ-1234)" />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 }}>
            <TouchableOpacity onPress={() => router.replace('/(driver)/dashboard')} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Pre-use Inspection</Text>
          </View>
          <View style={styles.headerCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <Text style={styles.cardTitle}>Vehicle Information</Text>
          <TouchableOpacity onPress={() => setVehicleId('')}>
            <Text style={{ color: '#043094', fontWeight: '600' }}>Change</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.input, { backgroundColor: '#F3F4F6' }]}>
          <Text style={{ fontSize: 16, color: '#4B5563' }}>{vehicleId}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Current Fuel Level</Text>
        <Text style={styles.cardSubtitle}>Select current tank level and attach a photo</Text>
        
        <View style={styles.fuelOptionsGrid}>
          {['Full', '3/4', '1/2', '1/4', 'Empty'].map(level => (
            <TouchableOpacity 
              key={level} 
              style={[styles.fuelBtn, fuelLevel === level && styles.fuelBtnActive]}
              onPress={() => setFuelLevel(level)}
            >
              <Text style={[styles.fuelBtnText, fuelLevel === level && styles.fuelBtnTextActive]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.cardTitle, { marginTop: 15, fontSize: 16 }]}>Dashboard Photo Proof *</Text>
        {fuelImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: fuelImage }} style={styles.fuelPreview} />
            <TouchableOpacity style={styles.retakeBtn} onPress={handleAttachPhoto}>
              <Text style={styles.retakeBtnText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBtn} onPress={handleAttachPhoto}>
            <Ionicons name="camera-outline" size={24} color="#043094" />
            <Text style={styles.uploadText}>Take Photo of Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Daily Checklist</Text>
        <Text style={styles.cardSubtitle}>Ensure all items pass inspection before operation.</Text>

        <View style={styles.checkItem}>
          <View style={styles.checkItemLeft}>
            <Ionicons name="disc-outline" size={24} color="#4B5563" />
            <Text style={styles.checkText}>Tires & Wheels</Text>
          </View>
          <Switch 
            value={checklist.tires} 
            onValueChange={() => toggleCheck('tires')} 
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.checkItem}>
          <View style={styles.checkItemLeft}>
            <Ionicons name="bulb-outline" size={24} color="#4B5563" />
            <Text style={styles.checkText}>Headlights & Signals</Text>
          </View>
          <Switch 
            value={checklist.lights} 
            onValueChange={() => toggleCheck('lights')} 
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.checkItem}>
          <View style={styles.checkItemLeft}>
            <Ionicons name="stop-circle-outline" size={24} color="#4B5563" />
            <Text style={styles.checkText}>Brakes & Steering</Text>
          </View>
          <Switch 
            value={checklist.brakes} 
            onValueChange={() => toggleCheck('brakes')} 
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.checkItem}>
          <View style={styles.checkItemLeft}>
            <Ionicons name="water-outline" size={24} color="#4B5563" />
            <Text style={styles.checkText}>Fluid Levels (Oil/Coolant)</Text>
          </View>
          <Switch 
            value={checklist.fluids} 
            onValueChange={() => toggleCheck('fluids')} 
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.checkItem}>
          <View style={styles.checkItemLeft}>
            <Ionicons name="car-outline" size={24} color="#4B5563" />
            <Text style={styles.checkText}>Exterior Body Damage</Text>
          </View>
          <Switch 
            value={checklist.body} 
            onValueChange={() => toggleCheck('body')} 
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.checkItem}>
          <View style={styles.checkItemLeft}>
            <Ionicons name="scan-outline" size={24} color="#4B5563" />
            <Text style={styles.checkText}>Mirrors & Windows</Text>
          </View>
          <Switch 
            value={checklist.mirrors} 
            onValueChange={() => toggleCheck('mirrors')} 
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.checkItem}>
          <View style={styles.checkItemLeft}>
            <Ionicons name="rainy-outline" size={24} color="#4B5563" />
            <Text style={styles.checkText}>Wipers & Washer Fluid</Text>
          </View>
          <Switch 
            value={checklist.wipers} 
            onValueChange={() => toggleCheck('wipers')} 
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.checkItem}>
          <View style={styles.checkItemLeft}>
            <Ionicons name="megaphone-outline" size={24} color="#4B5563" />
            <Text style={styles.checkText}>Horn & Backup Alarm</Text>
          </View>
          <Switch 
            value={checklist.horn} 
            onValueChange={() => toggleCheck('horn')} 
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.checkItem}>
          <View style={styles.checkItemLeft}>
            <Ionicons name="medkit-outline" size={24} color="#4B5563" />
            <Text style={styles.checkText}>Emergency Equipment</Text>
          </View>
          <Switch 
            value={checklist.emergency} 
            onValueChange={() => toggleCheck('emergency')} 
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.checkItem}>
          <View style={styles.checkItemLeft}>
            <Ionicons name="battery-charging-outline" size={24} color="#4B5563" />
            <Text style={styles.checkText}>Car Battery</Text>
          </View>
          <Switch 
            value={checklist.battery} 
            onValueChange={() => toggleCheck('battery')} 
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#FFF"
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Issue Location</Text>
        <Text style={styles.cardSubtitle}>Where is the issue coming from?</Text>
        
        <View style={styles.fuelOptionsGrid}>
          {['None', 'Engine', 'Exterior', 'Interior', 'Tires/Wheels', 'Electrical'].map(loc => (
            <TouchableOpacity 
              key={loc} 
              style={[styles.fuelBtn, issueLocation === loc && styles.fuelBtnActive]}
              onPress={() => setIssueLocation(loc)}
            >
              <Text style={[styles.fuelBtnText, issueLocation === loc && styles.fuelBtnTextActive]}>{loc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.cardTitle, { marginTop: 20 }]}>Notes / Defect Details</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Describe any issues found..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>Submit Inspection</Text>
          </>
        )}
      </TouchableOpacity>
      </>
      )}

      <Text style={[styles.sectionTitle, !vehicleId && { marginTop: 24 }]}>Recent Inspections</Text>
      <View style={styles.historyCard}>
        {inspections.map((insp, index) => (
          <View key={insp.id} style={[styles.historyRow, index === inspections.length - 1 && { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.historyDate}>{insp.date}</Text>
              <Text style={styles.historySub}>{insp.vehicle}</Text>
            </View>
            <Text style={[styles.historyStatus, insp.status === 'Passed' ? styles.statusPassedText : styles.statusFailedText]}>
              {insp.status}
            </Text>
          </View>
        ))}
      </View>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  contentContainer: { padding: 15, paddingBottom: 40 },
  selectorContainer: { marginBottom: 20 },
  headerCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  sectionCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 15 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 15, fontSize: 16, color: '#1F2937', marginTop: 10 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  checkItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  checkItemLeft: { flexDirection: 'row', alignItems: 'center' },
  checkText: { marginLeft: 12, fontSize: 16, color: '#374151' },
  submitButton: { backgroundColor: '#043094', padding: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitButtonDisabled: { backgroundColor: '#9CA3AF' },
  submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  fuelOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  fuelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  fuelBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  fuelBtnText: { color: '#4B5563', fontSize: 14, fontWeight: '600' },
  fuelBtnTextActive: { color: '#1D4ED8', fontWeight: '700' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderStyle: 'dashed', borderRadius: 8, padding: 16, marginTop: 10 },
  uploadText: { fontSize: 15, fontWeight: '600', color: '#043094', marginLeft: 8 },
  imageContainer: { marginTop: 10, alignItems: 'center' },
  fuelPreview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 10, resizeMode: 'cover' },
  retakeBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retakeBtnText: { color: '#374151', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12, marginTop: 20 },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  historyDate: { fontSize: 15, fontWeight: '600', color: '#374151' },
  historySub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  historyStatus: { fontSize: 14, fontWeight: 'bold' },
  statusPassedText: { color: '#10B981' },
  statusFailedText: { color: '#EF4444' }
});
