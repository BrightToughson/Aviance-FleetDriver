import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import VehicleSelector from '../../components/VehicleSelector';
import { useVehicle } from '../../context/VehicleContext';

export default function IssuesScreen() {
  const router = useRouter();
  const [issueType, setIssueType] = useState('Mechanical');
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueImage, setIssueImage] = useState<string | null>(null);
  const { addIssue, issues } = useVehicle();

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
      setIssueImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!description.trim() || !issueImage) {
      alert('Please provide a description and attach a photo of the issue.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newIssue = {
        id: Math.random().toString(),
        type: issueType,
        desc: description.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Pending' as const
      };
      addIssue(newIssue);

      alert('Report Submitted Successfully!');
      setIsSubmitting(false);
      setVehicleId('');
      setDescription('');
      setIssueImage(null);
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
            <Text style={styles.title}>Report Issue</Text>
          </View>
          <Text style={styles.subtitle}>Log a maintenance or safety issue</Text>

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

        <Text style={styles.label}>Issue Category *</Text>
        <View style={styles.categoryGrid}>
          {['Mechanical', 'Body Damage', 'Electrical', 'Tires', 'Other'].map(type => (
            <TouchableOpacity 
              key={type} 
              style={[styles.catBtn, issueType === type && styles.catBtnActive]}
              onPress={() => setIssueType(type)}
            >
              <Text style={[styles.catText, issueType === type && styles.catTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description *</Text>
        <TextInput 
          style={styles.textArea} 
          placeholder="Describe the issue in detail..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Photo Attachment *</Text>
        {issueImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: issueImage }} style={styles.issuePreview} />
            <TouchableOpacity style={styles.retakeBtn} onPress={handleAttachPhoto}>
              <Text style={styles.retakeBtnText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBtn} onPress={handleAttachPhoto}>
            <Ionicons name="camera" size={24} color="#043094" />
            <Text style={styles.uploadText}>Attach Photo</Text>
          </TouchableOpacity>
        )}

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && { backgroundColor: '#9CA3AF' }]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitBtnText}>{isSubmitting ? 'Submitting...' : 'Submit Report'}</Text>
          </TouchableOpacity>
        </View>
        </>
      )}

      <Text style={[styles.sectionTitle, !vehicleId && { marginTop: 24 }]}>Recent Reports</Text>
      <View style={styles.historyCard}>
        {issues.map((issue, index) => (
          <View key={issue.id} style={[styles.historyRow, index === issues.length - 1 && { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.historyDate}>{issue.type}</Text>
              <Text style={styles.historySub}>{issue.desc}</Text>
            </View>
            <Text style={[styles.historyStatus, issue.status === 'Resolved' ? styles.statusResolvedText : styles.statusPendingText]}>
              {issue.status}
            </Text>
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  readonlyInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12 },
  readonlyText: { color: '#6B7280', fontSize: 15 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  catBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  catText: { color: '#4B5563', fontSize: 14, fontWeight: '500' },
  catTextActive: { color: '#1D4ED8', fontWeight: '600' },
  textArea: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 15, color: '#111827', minHeight: 100 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderStyle: 'dashed', borderRadius: 8, padding: 16, marginTop: 8 },
  uploadText: { fontSize: 15, fontWeight: '600', color: '#043094', marginLeft: 8 },
  submitBtn: { backgroundColor: '#043094', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  imageContainer: { marginTop: 8, alignItems: 'center' },
  issuePreview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 10, resizeMode: 'cover' },
  retakeBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retakeBtnText: { color: '#374151', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  historyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  historyDate: { fontSize: 15, fontWeight: '600', color: '#374151' },
  historySub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  historyStatus: { fontSize: 13, fontWeight: 'bold' },
  statusResolvedText: { color: '#10B981' },
  statusPendingText: { color: '#F59E0B' }
});
