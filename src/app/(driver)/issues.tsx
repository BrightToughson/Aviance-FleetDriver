import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import VehicleSelector from '../../components/VehicleSelector';
import { useVehicle } from '../../context/VehicleContext';
import { uploadImageToSupabase } from '../../lib/uploadImage';

export default function IssuesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [issueType, setIssueType] = useState('Mechanical');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueImage, setIssueImage] = useState<string | null>(null);
  const { addIssue, issues } = useVehicle();

  const handleAttachPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert(t('d_fuel_cam_perm', "Permission to access camera is required!"));
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

  const handleSubmit = async () => {
    if (!description.trim() || !issueImage) {
      alert(t('d_issue_req_err', 'Please provide a description and attach a photo of the issue.'));
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedUrl = '';
      if (issueImage) {
        uploadedUrl = await uploadImageToSupabase(issueImage, 'media');
      }

      const newIssue = {
        id: Math.random().toString(),
        type: issueType,
        priority: priority,
        vehicleId: vehicleId,
        desc: description.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Pending' as const,
        imageUrl: uploadedUrl
      };
      await addIssue(newIssue);

      alert(t('d_issue_success_msg', 'Report Submitted Successfully!'));
      setIsSubmitting(false);
      setVehicleId('');
      setDescription('');
      setIssueImage(null);
      router.replace('/(driver)/dashboard');
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      alert('Failed to submit report. Please try again.');
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
            <Text style={styles.title}>{t('d_issue_title', 'Report Issue')}</Text>
          </View>
          <Text style={styles.subtitle}>{t('d_issue_subtitle', 'Log a maintenance or safety issue')}</Text>

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.label}>{t('d_fuel_lbl_vehicle', 'Vehicle')}</Text>
          <TouchableOpacity onPress={() => setVehicleId('')}>
            <Text style={{ color: '#043094', fontWeight: '600', fontSize: 14 }}>{t('common_change', 'Change')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.readonlyInput}>
          <Text style={styles.readonlyText}>{vehicleId}</Text>
        </View>

        <Text style={styles.label}>{t('d_issue_lbl_cat', 'Issue Category *')}</Text>
        <View style={styles.categoryGrid}>
          {['Mechanical', 'Body Damage', 'Electrical', 'Tires', 'Other'].map(type => (
            <TouchableOpacity 
              key={type} 
              style={[styles.catBtn, issueType === type && styles.catBtnActive]}
              onPress={() => setIssueType(type)}
            >
              <Text style={[styles.catText, issueType === type && styles.catTextActive]}>{t(`d_issue_cat_${type.toLowerCase().replace(' ', '_')}`, type)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('d_issue_lbl_priority', 'Priority *')}</Text>
        <View style={styles.categoryGrid}>
          {['High', 'Medium', 'Low'].map(p => (
            <TouchableOpacity 
              key={p} 
              style={[
                styles.catBtn, 
                priority === p && styles.catBtnActive,
                priority === p && p === 'High' && { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
                priority === p && p === 'Medium' && { backgroundColor: '#FEF3C7', borderColor: '#FBBF24' },
                priority === p && p === 'Low' && { backgroundColor: '#D1FAE5', borderColor: '#34D399' }
              ]}
              onPress={() => setPriority(p as any)}
            >
              <Text style={[
                styles.catText, 
                priority === p && p === 'High' && { color: '#B91C1C', fontWeight: '700' },
                priority === p && p === 'Medium' && { color: '#B45309', fontWeight: '700' },
                priority === p && p === 'Low' && { color: '#065F46', fontWeight: '700' }
              ]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('d_issue_lbl_desc', 'Description *')}</Text>
        <TextInput 
          style={styles.textArea} 
          placeholder={t('d_issue_desc_placeholder', 'Describe the issue in detail...')}
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>{t('d_issue_lbl_photo', 'Photo Attachment *')}</Text>
        {issueImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: issueImage }} style={styles.issuePreview} />
            <TouchableOpacity style={styles.retakeBtn} onPress={handleAttachPhoto}>
              <Text style={styles.retakeBtnText}>{t('d_fuel_retake', 'Retake Photo')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBtn} onPress={handleAttachPhoto}>
            <Ionicons name="camera" size={24} color="#043094" />
            <Text style={styles.uploadText}>{t('d_issue_attach', 'Attach Photo')}</Text>
          </TouchableOpacity>
        )}

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && { backgroundColor: '#9CA3AF' }]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitBtnText}>{isSubmitting ? t('d_fuel_submitting', 'Submitting...') : t('d_issue_submit', 'Submit Report')}</Text>
          </TouchableOpacity>
        </View>
        </>
      )}

      <Text style={[styles.sectionTitle, !vehicleId && { marginTop: 24 }]}>{t('d_issue_recent', 'Recent Reports')}</Text>
      <View style={styles.historyCard}>
        {issues.map((issue, index) => (
          <TouchableOpacity 
            key={issue.id} 
            style={[styles.historyRow, index === issues.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => router.push(`/(driver)/issue-details?id=${issue.id}`)}
          >
            <View style={{ flex: 1, paddingRight: 16, overflow: 'hidden' }}>
              <Text style={styles.historyDate}>{issue.type.toUpperCase()}</Text>
              <Text style={styles.historySub} numberOfLines={2} ellipsizeMode="tail">{issue.desc}</Text>
            </View>
            <View style={{ flexShrink: 0 }}>
              <Text style={[
                styles.historyStatus, 
                issue.status === 'Resolved' ? styles.statusResolvedText : 
                issue.status === 'In Progress' ? styles.statusInProgressText :
                styles.statusPendingText
              ]}>
                {issue.status}
              </Text>
            </View>
          </TouchableOpacity>
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
  historyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, width: '100%' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', width: '100%' },
  historyDate: { fontSize: 15, fontWeight: '600', color: '#374151' },
  historySub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  historyStatus: { fontSize: 13, fontWeight: 'bold' },
  statusResolvedText: { color: '#10B981' },
  statusPendingText: { color: '#F59E0B' },
  statusInProgressText: { color: '#3B82F6' }
});
