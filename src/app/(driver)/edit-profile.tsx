import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/expo';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useUser();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [licenseImageUri, setLicenseImageUri] = useState<string | null>(null);
  const [existingDocId, setExistingDocId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    licenseNumber: '',
    licenseExpiry: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    if (!user?.id) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', user.id)
        .single();
        
      const { data: details } = await supabase
        .from('driver_details')
        .select('license_number, license_expiry')
        .eq('profile_id', user.id)
        .single();
        
      const { data: doc } = await supabase
        .from('documents')
        .select('id, document_url')
        .eq('entity_id', user.id)
        .eq('document_type', 'License')
        .maybeSingle();
        
      setFormData({
        phoneNumber: profile?.phone_number || '',
        licenseNumber: details?.license_number || '',
        licenseExpiry: details?.license_expiry || ''
      });
      
      if (doc) {
        setExistingDocId(doc.id);
        setLicenseImageUri(doc.document_url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Refused", "You need to allow camera roll permissions to upload a photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLicenseImageUri(result.assets[0].uri);
    }
  };

  const uploadToSupabase = async (uri: string, bucket: string, path: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      return `${publicUrl}?t=${new Date().getTime()}`;
    } catch (e: any) {
      console.error("Upload error:", e.message);
      return null;
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    // Validate Date format before saving
    if (formData.licenseExpiry && !/^\d{4}-\d{2}-\d{2}$/.test(formData.licenseExpiry)) {
      if (Platform.OS === 'web') window.alert("Please enter the expiry date in YYYY-MM-DD format (e.g. 2028-10-14).");
      else Alert.alert("Invalid Date", "Please enter the expiry date in YYYY-MM-DD format (e.g. 2028-10-14).");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // 1. Update phone number and ensure driver role in profiles
      const { error: profileErr } = await supabase.from('profiles')
        .update({ 
          phone_number: formData.phoneNumber,
          role: 'driver',
          is_driver: true,
          is_manager: false,
        })
        .eq('id', user.id);
      if (profileErr) throw new Error("Profile update failed: " + profileErr.message);

      // 2. Upsert driver details (in case it wasn't created during onboarding)
      const { error: detailsErr } = await supabase.from('driver_details').upsert({ 
        profile_id: user.id,
        license_number: formData.licenseNumber, 
        license_expiry: formData.licenseExpiry 
      });
      if (detailsErr) throw new Error("License update failed: " + detailsErr.message);
        
      // 3. Document image upload
      if (licenseImageUri && !licenseImageUri.startsWith('http')) {
        const licenseUrl = await uploadToSupabase(licenseImageUri, 'documents', `${user.id}/license.jpg`);
        if (licenseUrl) {
          if (existingDocId) {
            const { error: docErr } = await supabase.from('documents')
              .update({ document_url: licenseUrl })
              .eq('id', existingDocId);
            if (docErr) throw new Error("Document update failed: " + docErr.message);
          } else {
            const { error: docErr } = await supabase.from('documents').insert({
              name: 'Driver License',
              entity_type: 'driver',
              entity_id: user.id,
              document_type: 'License',
              document_url: licenseUrl,
            });
            if (docErr) throw new Error("Document insert failed: " + docErr.message);
          }
        }
      }
        
      if (Platform.OS === 'web') window.alert("Profile updated successfully!");
      else Alert.alert("Success", "Profile updated successfully!");
      
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/profile');
      }
    } catch (e: any) {
      console.error(e);
      if (Platform.OS === 'web') window.alert(e.message || "Failed to update profile.");
      else Alert.alert("Error", e.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#043094" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#475569" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('d_edit_profile', 'Edit Profile')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-circle" size={28} color="#043094" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Personal Information</Text>
              <Text style={styles.cardSub}>Update your contact and license details</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('c_profile_phone', 'Phone Number')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.phoneNumber}
                  onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('c_profile_lic_num', 'Driver License Number')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.licenseNumber}
                  onChangeText={(text) => setFormData({ ...formData, licenseNumber: text })}
                  placeholder="e.g. D12345678"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('c_profile_lic_exp', 'License Expiry Date')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                {Platform.OS === 'web' ? (
                  React.createElement('input', {
                    type: 'date',
                    value: formData.licenseExpiry || '',
                    onChange: (e: any) => setFormData({ ...formData, licenseExpiry: e.target.value }),
                    onClick: (e: any) => { try { e.target.showPicker(); } catch(err) {} },
                    style: {
                      border: 'none', outline: 'none', background: 'transparent',
                      fontSize: 15, color: '#1E293B', fontWeight: '500', 
                      width: '100%', padding: '16px 0', fontFamily: 'inherit', cursor: 'pointer'
                    }
                  })
                ) : (
                  <TextInput
                    style={styles.input}
                    value={formData.licenseExpiry}
                    onChangeText={(text) => setFormData({ ...formData, licenseExpiry: text })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                  />
                )}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('c_profile_lic_img', "Photo of Driver's License")}</Text>
              <TouchableOpacity style={styles.licenseUploadBtn} onPress={pickImage} activeOpacity={0.8}>
                {licenseImageUri ? (
                  <Image source={{ uri: licenseImageUri }} style={styles.licenseImg} />
                ) : (
                  <View style={styles.licensePlaceholder}>
                    <View style={styles.uploadIconBox}>
                      <Ionicons name="cloud-upload-outline" size={28} color="#043094" />
                    </View>
                    <Text style={styles.licensePlaceholderText}>Tap to Upload License</Text>
                    <Text style={styles.licensePlaceholderSub}>JPEG, PNG up to 5MB</Text>
                  </View>
                )}
                {licenseImageUri && (
                  <View style={styles.editImageOverlay}>
                    <Ionicons name="pencil" size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>{t('common_save', 'Save Changes')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  
  scrollContent: { padding: 24, alignItems: 'center' },
  card: { width: '100%', maxWidth: 600, backgroundColor: '#FFFFFF', borderRadius: 24, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#F8FAFC' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#64748B' },
  
  formSection: { padding: 24 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 15, color: '#1E293B', fontWeight: '500' },
  
  licenseUploadBtn: { height: 180, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 16, overflow: 'hidden' },
  licenseImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  licensePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  uploadIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  licensePlaceholderText: { color: '#1E293B', fontWeight: '600', fontSize: 15, marginBottom: 4 },
  licensePlaceholderSub: { color: '#94A3B8', fontSize: 13 },
  editImageOverlay: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(15, 23, 42, 0.6)', alignItems: 'center', justifyContent: 'center' },
  
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  saveButton: { flexDirection: 'row', backgroundColor: '#043094', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#043094', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }
});
