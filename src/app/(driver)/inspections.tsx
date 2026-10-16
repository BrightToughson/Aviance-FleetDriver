import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Image } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import VehicleSelector from '../../components/VehicleSelector';
import { useVehicle } from '../../context/VehicleContext';
import { supabase } from '../../lib/supabase';
import { uploadImageToSupabase } from '../../lib/uploadImage';
import { useUser } from '@clerk/expo';

export default function InspectionsScreen() {
  const { user } = useUser();
  const { t } = useTranslation();
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState('');
  const [issueNotes, setIssueNotes] = useState<Record<string, string>>({});
  const [fuelLevel, setFuelLevel] = useState('Full');
  const [fuelImage, setFuelImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshVehicleData, inspections } = useVehicle();
  
  // Checklist State
  const [checklist, setChecklist] = useState({
    tires: true,
    lights: true,
    brakes: true,
    fluids: true,
    body: true,
    mirrors: true,
    wipers: true,
    horn: true,
    emergency: true,
    battery: true,
  });
  const [issueImages, setIssueImages] = useState<Record<string, string | null>>({});

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

  const handleAttachIssuePhoto = async (key: string) => {
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
      setIssueImages(prev => ({ ...prev, [key]: result.assets[0].uri }));
    }
  };

  const failedItems = Object.entries(checklist).filter(([key, passed]) => !passed);
  let computedLocation = 'None';
  const failedKeys = failedItems.map(item => item[0]);
  if (failedKeys.length > 0) {
    const locationSet = new Set<string>();
    failedKeys.forEach(key => {
      if (['battery', 'horn', 'lights'].includes(key)) locationSet.add('Electrical');
      else if (['tires', 'brakes'].includes(key)) locationSet.add('Tires/Wheels');
      else if (['fluids'].includes(key)) locationSet.add('Engine');
      else if (['body', 'mirrors', 'wipers'].includes(key)) locationSet.add('Exterior');
      else if (['emergency'].includes(key)) locationSet.add('Interior');
    });
    
    if (locationSet.size === 1) {
      computedLocation = Array.from(locationSet)[0];
    } else if (locationSet.size > 1) {
      computedLocation = Array.from(locationSet).join(', ');
    }
  }

  const handleSubmit = async () => {
    if (!vehicleId.trim()) {
      alert(t('d_insp_err_veh', "Please enter a Vehicle ID."));
      return;
    }
    
    if (!fuelImage) {
      alert(t('d_insp_err_photo', "Please take a photo of the dashboard as proof of the fuel level."));
      return;
    }

    for (const [key] of failedItems) {
      if (!issueImages[key]) {
        alert(t('d_insp_err_issue_photo', `Please take a photo for the failed inspection item: ${key}`));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Upload fuel image
      const fuelImageUrl = await uploadImageToSupabase(fuelImage);
      if (!fuelImageUrl) throw new Error("Failed to upload fuel image");

      // 2. Upload issue images
      const uploadedIssueImages: Record<string, string> = {};
      for (const [key, uri] of Object.entries(issueImages)) {
        if (uri) {
          const url = await uploadImageToSupabase(uri);
          if (url) uploadedIssueImages[key] = url;
        }
      }


      const labels: Record<string, string> = {
        tires: 'Tires & Wheels', lights: 'Headlights & Signals', brakes: 'Brakes & Steering',
        fluids: 'Fluid Levels (Oil/Coolant)', body: 'Exterior Body Damage', mirrors: 'Mirrors & Windows',
        wipers: 'Wipers & Washer Fluid', horn: 'Horn & Backup Alarm', emergency: 'Emergency Equipment',
        battery: 'Car Battery'
      };

      const formattedNotes = Object.entries(issueNotes)
        .filter(([key, note]) => note?.trim() !== '')
        .map(([key, note]) => `${labels[key] || key}:\n${note}`)
        .join('\n\n');

      const hasDefects = failedItems.length > 0;

      const { error: inspError } = await supabase.from('inspections').insert([{
        vehicle_id: vehicleId,
        driver_id: user?.id,
        status: hasDefects ? 'fail' : 'pass',
        checklist: checklist,
        fuel_level: fuelLevel,
        fuel_image_url: fuelImageUrl,
        issue_location: computedLocation,
        issue_images: uploadedIssueImages,
        notes: formattedNotes
      }]);

      if (inspError) throw inspError;

      if (hasDefects) {
        const failedList = failedItems.map(([key]) => labels[key] || key).join(', ');
        const issueDescription = `Failed Pre-use Inspection\nDetected Location(s): ${computedLocation}\nFailed Items: ${failedList}\n\nDriver Notes:\n${formattedNotes || 'None provided'}`;

        const { error: issueError } = await supabase.from('issues').insert([{
           vehicle_id: vehicleId,
           reported_by: user?.id,
           description: issueDescription,
           priority: 'high',
           status: 'open'
        }]);
        if (issueError) console.error("Error creating issue:", issueError);
      }

      alert(t('d_insp_success', 'Inspection Submitted Successfully!'));
      await refreshVehicleData();
      // Reset form
      setVehicleId('');
      setIssueNotes({});
      setFuelLevel('Full');
      setFuelImage(null);
      setChecklist({ tires: true, lights: true, brakes: true, fluids: true, body: true, mirrors: true, wipers: true, horn: true, emergency: true, battery: true });
      setIssueImages({});
      router.replace('/(driver)/dashboard');
    } catch (error: any) {
      console.error("Error adding document: ", error);
      alert(t('d_insp_fail', 'Failed to submit inspection. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {!vehicleId ? (
        <View style={styles.selectorContainer}>
          <VehicleSelector onSelect={setVehicleId} />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 }}>
            <TouchableOpacity onPress={() => router.replace('/(driver)/dashboard')} style={{ marginRight: 12 }}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>{t('d_insp_title', 'Pre-use Inspection')}</Text>
          </View>
          <View style={styles.headerCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <Text style={styles.cardTitle}>{t('d_insp_veh_info', 'Vehicle Information')}</Text>
          <TouchableOpacity onPress={() => setVehicleId('')}>
            <Text style={{ color: '#043094', fontWeight: '600' }}>{t('common_change', 'Change')}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.input, { backgroundColor: '#F3F4F6' }]}>
          <Text style={{ fontSize: 16, color: '#4B5563' }}>{vehicleId}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>{t('d_insp_fuel_level', 'Current Fuel Level')}</Text>
        <Text style={styles.cardSubtitle}>{t('d_insp_fuel_sub', 'Select current tank level and attach a photo')}</Text>
        
        <View style={styles.fuelOptionsGrid}>
          {['Full', '3/4', '1/2', '1/4', 'Empty'].map(level => (
            <TouchableOpacity 
              key={level} 
              style={[styles.fuelBtn, fuelLevel === level && styles.fuelBtnActive]}
              onPress={() => setFuelLevel(level)}
            >
              <Text style={[styles.fuelBtnText, fuelLevel === level && styles.fuelBtnTextActive]}>{t(`d_insp_fuel_${level.toLowerCase().replace('/', '_')}`, level)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.cardTitle, { marginTop: 15, fontSize: 16 }]}>{t('d_insp_photo_proof', 'Dashboard Photo Proof *')}</Text>
        {fuelImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: fuelImage }} style={styles.fuelPreview} />
            <TouchableOpacity style={styles.retakeBtn} onPress={handleAttachPhoto}>
              <Text style={styles.retakeBtnText}>{t('d_insp_photo_retake', 'Retake Photo')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBtn} onPress={handleAttachPhoto}>
            <Ionicons name="camera-outline" size={24} color="#043094" />
            <Text style={styles.uploadText}>{t('d_insp_photo_take', 'Take Photo of Dashboard')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>{t('d_insp_checklist', 'Daily Checklist')}</Text>
        <Text style={styles.cardSubtitle}>{t('d_insp_checklist_sub', 'Ensure all items pass inspection before operation.')}</Text>

        {[
          { id: 'tires', i18nKey: 'd_insp_chk_tires', label: 'Tires & Wheels', icon: 'disc-outline' },
          { id: 'lights', i18nKey: 'd_insp_chk_lights', label: 'Headlights & Signals', icon: 'bulb-outline' },
          { id: 'brakes', i18nKey: 'd_insp_chk_brakes', label: 'Brakes & Steering', icon: 'stop-circle-outline' },
          { id: 'fluids', i18nKey: 'd_insp_chk_fluids', label: 'Fluid Levels (Oil/Coolant)', icon: 'water-outline' },
          { id: 'body', i18nKey: 'd_insp_chk_body', label: 'Exterior Body Damage', icon: 'car-outline' },
          { id: 'mirrors', i18nKey: 'd_insp_chk_mirrors', label: 'Mirrors & Windows', icon: 'scan-outline' },
          { id: 'wipers', i18nKey: 'd_insp_chk_wipers', label: 'Wipers & Washer Fluid', icon: 'rainy-outline' },
          { id: 'horn', i18nKey: 'd_insp_chk_horn', label: 'Horn & Backup Alarm', icon: 'megaphone-outline' },
          { id: 'emergency', i18nKey: 'd_insp_chk_emergency', label: 'Emergency Equipment', icon: 'medkit-outline' },
          { id: 'battery', i18nKey: 'd_insp_chk_battery', label: 'Car Battery', icon: 'battery-charging-outline' },
        ].map((item) => (
          <View key={item.id} style={{ marginBottom: 15 }}>
            <View style={styles.checkItem}>
              <View style={styles.checkItemLeft}>
                <Ionicons name={item.icon as any} size={24} color="#4B5563" />
                <Text style={styles.checkText}>{t(item.i18nKey, item.label)}</Text>
              </View>
              <Switch 
                value={checklist[item.id as keyof typeof checklist]} 
                onValueChange={() => toggleCheck(item.id as keyof typeof checklist)} 
                trackColor={{ false: '#EF4444', true: '#10B981' }}
                thumbColor="#FFF"
              />
            </View>
            {!checklist[item.id as keyof typeof checklist] && (
              <View style={{ marginTop: 10, paddingLeft: 35 }}>
                {issueImages[item.id] ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: issueImages[item.id]! }} style={styles.fuelPreview} />
                    <TouchableOpacity style={styles.retakeBtn} onPress={() => handleAttachIssuePhoto(item.id)}>
                      <Text style={styles.retakeBtnText}>{t('d_insp_photo_retake', 'Retake Photo')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadBtn} onPress={() => handleAttachIssuePhoto(item.id)}>
                    <Ionicons name="camera-outline" size={20} color="#043094" />
                    <Text style={styles.uploadText}>{t('d_insp_photo_take', 'Take Photo of Issue')}</Text>
                  </TouchableOpacity>
                )}
                <TextInput
                  style={[styles.input, { minHeight: 60, marginTop: 12, paddingVertical: 10 }]}
                  placeholder={t('d_insp_item_note', 'Add notes about this issue...')}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={issueNotes[item.id] || ''}
                  onChangeText={(text) => setIssueNotes(prev => ({ ...prev, [item.id]: text }))}
                />
              </View>
            )}
          </View>
        ))}
      </View>

      {computedLocation !== 'None' && (
        <View style={styles.sectionCard}>
          <View style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F59E0B', flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="location-outline" size={18} color="#92400E" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 14, color: '#92400E', fontWeight: '600', flex: 1 }}>
              {t('d_insp_auto_loc', 'Detected Issue Location(s):')} {computedLocation}
            </Text>
          </View>
        </View>
      )}

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
            <Text style={styles.submitButtonText}>{t('d_insp_submit', 'Submit Inspection')}</Text>
          </>
        )}
      </TouchableOpacity>
      </>
      )}

      <Text style={[styles.sectionTitle, !vehicleId && { marginTop: 24 }]}>{t('d_insp_recent', 'Recent Inspections')}</Text>
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
